// Remaining 6 screens: Experiences, TapPoints, Spaces, Spaces-Selected, Reports, Edit-Space-Modal
const { useState: useState2, useMemo: useMemo2 } = React;

// ============================================================
// 3. Experiences (list)
// ============================================================
function ExperiencesScreen({ onNav, onSelectExperience, ai }) {
  ai = ai || {};
  const insights = useMemo2(
    () => window.computeExperiencesInsights({ tone: ai.aiTone || "factual" }),
    [ai.aiTone, window.DATA.EXPERIENCES, window.DATA.EXPERIENCES.length, window.DATA.TAPPOINTS.length, window.DATA.SPACES.length]
  );
  const [filterText, setFilter] = useState2("");
  const [spaceFilter, setSpaceFilter] = useState2([]);
  const [timeRange, setTimeRange] = useState2("all"); // "all" | "15" | "30" | "90" | "365"
  const [creating, setCreating] = useState2(false);
  const [creatingInitialMode, setCreatingInitialMode] = useState2("blank");
  const [useTemplateTarget, setUseTemplateTarget] = useState2(null);
  const [view, setView] = useState2("list"); // "list" | "templates"
  const [cloningExp, setCloningExp] = useState2(null);
  const [confirmDelete, setConfirmDelete] = useState2(null); // experience object or null
  const [toast, setToast] = useState2(null);
  // Open Create-Experience modal automatically when we arrive here with the flag set
  // (e.g. from the SpaceEditScreen "Create new" button).
  React.useEffect(() => {
    if (window.__openCreateExperience) {
      window.__openCreateExperience = false;
      setCreating(true);
    }
  }, []);
  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);
  const spaces = window.DATA.SPACES;
  const [exps, setExps] = useState2(window.DATA.EXPERIENCES);
  const allExps = exps;
  const [selected, setSelected] = useState2(() => new Set());
  const [tagDraft, setTagDraft] = useState2("");
  const [anchorId, setAnchorId] = useState2(null);
  const types = Array.from(new Set(allExps.map((e) => e.type)));
  const rows = allExps.filter((e) => {
    if (spaceFilter.length > 0) {
      const isUnassignedPick = spaceFilter.includes("__unassigned__");
      const matchesSpace = spaceFilter.includes(e.spaceId);
      const isUnassigned = !e.spaceId || e.spaceId === "__unassigned__" || !spaces.find((s) => s.id === e.spaceId);
      if (!matchesSpace && !(isUnassignedPick && isUnassigned)) return false;
    }
    if (filterText && !e.name.toLowerCase().includes(filterText.toLowerCase())) return false;
    return true;
  }).map((e) => {
    const space = spaces.find((s) => s.id === e.spaceId);
    const deviceCount = window.DATA.TAPPOINTS.filter((t) => t.experienceId === e.id).length;
    // Scale taps/visitors/leads by the selected time range. "all" leaves
    // the canonical lifetime totals as-is.
    let scaled = e;
    if (timeRange !== "all") {
      const days = parseInt(timeRange, 10);
      const factor = days / 28; // canonical data is sized to ~28 days
      // Seeded jitter so values look stable but believable per-experience.
      let h = (e.id ? e.id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 1) : 1) + days;
      const jit = () => {h = (h * 9301 + 49297) % 233280;return 0.84 + h / 233280 * 0.32;};
      scaled = {
        ...e,
        taps: Math.max(0, Math.round((e.taps || 0) * factor * jit())),
        visitors: Math.max(0, Math.round((e.visitors || 0) * factor * jit())),
        leads: Math.max(0, Math.round((e.leads || 0) * factor * jit()))
      };
    }
    return { ...scaled, _spaceName: space ? space.name : "", _devices: deviceCount };
  });
  const sortableExps = useSortableData(rows, null);

  // KPIs
  const totalExps = allExps.length;
  const totalTaps = allExps.reduce((a, e) => a + (e.taps || 0), 0);
  const totalLeads = allExps.reduce((a, e) => a + (e.leads || 0), 0);
  const avgTaps = totalExps > 0 ? Math.round(totalTaps / totalExps) : 0;
  const top = allExps.reduce((best, e) => !best || e.taps > best.taps ? e : best, null);

  const TypeChip = ({ t }) => {
    const tone = t === "Hub" ? { bg: "rgba(0,125,249,0.10)", fg: "var(--tapin-blue)" } :
    t === "Card" ? { bg: "rgba(138,82,234,0.14)", fg: "#7434c2" } :
    t === "Sticker" ? { bg: "rgba(46,160,67,0.14)", fg: "#1c8a36" } :
    { bg: "rgba(20,29,35,0.06)", fg: "var(--ink-700)" };
    return <span className="pill" style={{ background: tone.bg, color: tone.fg, fontWeight: 600 }}>{t}</span>;
  };

  const maxTaps = Math.max(1, ...allExps.map((e) => e.taps || 0));

  const toggleSelect = (id, opts = {}) => {
    setSelected((s) => {
      const n = new Set(s);
      if (opts.shiftKey && anchorId != null) {
        const ids = rows.map((r) => r.id);
        const a = ids.indexOf(anchorId);
        const b = ids.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          const target = !s.has(id);
          for (let i = lo; i <= hi; i++) {
            if (target) n.add(ids[i]);else n.delete(ids[i]);
          }
          return n;
        }
      }
      if (n.has(id)) n.delete(id);else n.add(id);
      return n;
    });
    setAnchorId(id);
  };
  const clearSelection = () => setSelected(new Set());
  const visibleIds = rows.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleSelectAllVisible = () => setSelected((s) => {
    if (allVisibleSelected) {
      const n = new Set(s);visibleIds.forEach((id) => n.delete(id));return n;
    }
    const n = new Set(s);visibleIds.forEach((id) => n.add(id));return n;
  });
  const applyBulkSpace = (spaceId) => setExps(exps.map((e) => selected.has(e.id) ? { ...e, spaceId } : e));
  const addBulkTag = (tag) => {
    const v = (tag || "").trim();
    if (!v) return;
    setExps(exps.map((e) => {
      if (!selected.has(e.id)) return e;
      const cur = Array.isArray(e.tags) ? e.tags : [];
      if (cur.includes(v)) return e;
      return { ...e, tags: [...cur, v] };
    }));
    setTagDraft("");
  };
  const removeBulkTag = (tag) => {
    const v = (tag || "").trim();
    if (!v) return;
    setExps(exps.map((e) => {
      if (!selected.has(e.id)) return e;
      const cur = Array.isArray(e.tags) ? e.tags : [];
      if (!cur.includes(v)) return e;
      return { ...e, tags: cur.filter((x) => x !== v) };
    }));
    setTagDraft("");
  };
  const tagsOnAllSelected = (() => {
    const sel = exps.filter((e) => selected.has(e.id));
    if (sel.length === 0) return [];
    let common = new Set(Array.isArray(sel[0].tags) ? sel[0].tags : []);
    for (let i = 1; i < sel.length; i++) {
      const next = new Set(Array.isArray(sel[i].tags) ? sel[i].tags : []);
      common = new Set([...common].filter((t) => next.has(t)));
    }
    return [...common];
  })();

  return (
    <>
      <Topbar title="Experiences" subtitle="Manage and track the performance of all experiences." />

      <div className="exp-toolbar">
        {view === "templates" ?
        <>
            <button className="btn btn--sm" onClick={() => setView("list")}>← Back to experiences</button>
            <div style={{ flex: 1 }} />
            <span className="tpl-create-wrap">
              <button
              className="btn btn--primary"
              onClick={() => {setCreatingInitialMode("blank");setCreating(true);}}>
              
                <Icon.Plus /> Create experience
              </button>
              <span className="tpl-create-tip" role="tooltip">
                Click <strong>"Save as template"</strong> in the experience builder to see your template here.
              </span>
            </span>
          </> :

        <>
            <div className="input-search" style={{ flex: 1, maxWidth: 360 }}>
              <span className="icon-search"><Icon.Search /></span>
              <input placeholder="Search experiences" value={filterText} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <MultiSelect
            label="Spaces"
            allLabel="All spaces"
            placeholder="Search spaces"
            options={[...spaces.map((s) => ({ id: s.id, label: s.name })), { id: "__unassigned__", label: "Unassigned" }]}
            values={spaceFilter}
            onChange={setSpaceFilter} />

            {(() => {
            const trOpts = [
            { id: "all", label: "All time" },
            { id: "15", label: "Last 15 days" },
            { id: "30", label: "Last 30 days" },
            { id: "90", label: "Last 90 days" },
            { id: "365", label: "Last 365 days" }];

            const current = trOpts.find((o) => o.id === timeRange) || trOpts[0];
            return (
              <div className={"time-range-dd" + (timeRange !== "all" ? " is-on" : "")}>
                  <Dropdown trigger={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="2" y="3.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                      <span>{current.label}</span>
                    </span>
                }>
                    {({ close }) =>
                  <>
                        {trOpts.map((o) =>
                    <div
                      key={o.id}
                      className={"item" + (o.id === timeRange ? " is-selected" : "")}
                      onClick={() => {setTimeRange(o.id);close();}}>
                      {o.label}</div>
                    )}
                      </>
                  }
                  </Dropdown>
                </div>);

          })()}

            <div style={{ flex: 1 }} />
            <button className="btn" onClick={() => setView("templates")}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><rect x="10.5" y="2.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><rect x="10.5" y="8.5" width="4.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><rect x="2.5" y="10.5" width="6.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /></svg>
              Templates
            </button>
            <button className="btn btn--primary" onClick={() => {setCreatingInitialMode("blank");setCreating(true);}}><Icon.Plus /> Create experience</button>
          </>
        }
      </div>

      {ai.aiPanel !== false && view === "list" && <AIInsightsPanel insights={insights} onNav={onNav} period={{ kind: "page", page: "experiences" }} sessionKey="experiences" />}

      {view === "templates" ?
      <TemplatesView onUse={(tpl) => setUseTemplateTarget(tpl)} /> :

      <div className="card exp-table-card">
        {selected.size > 0 &&
        <div className="bulk-bar">
            <div className="bulk-bar__count">
              <span className="bulk-bar__count-num">{selected.size}</span>
              <span>selected</span>
              <button className="bulk-bar__clear" onClick={clearSelection}>Clear</button>
            </div>
            <div className="bulk-bar__divider" />
            <div className="bulk-bar__group">
              <span className="bulk-bar__label">Space</span>
              <Dropdown trigger={<span>Change space</span>}>
                {({ close }) =>
              <>
                    {spaces.map((s) =>
                <div key={s.id} className="item" onClick={() => {applyBulkSpace(s.id);close();}}>{s.name}</div>
                )}
                  </>
              }
              </Dropdown>
            </div>
            <div className="bulk-bar__group bulk-bar__group--tags">
              <span className="bulk-bar__label">Tags</span>
              <div className="bulk-bar__tag-input">
                <input
                placeholder="Tag name…"
                value={tagDraft}
                onChange={(ev) => setTagDraft(ev.target.value)}
                onKeyDown={(ev) => {if (ev.key === "Enter") addBulkTag(tagDraft);}} />
              
                <button className="btn btn--xs btn--primary" onClick={() => addBulkTag(tagDraft)} disabled={!tagDraft.trim()}>Add</button>
              </div>
              {tagsOnAllSelected.length > 0 &&
            <div className="bulk-bar__tag-chips">
                  {tagsOnAllSelected.map((t) =>
              <span key={t} className="bulk-tag-chip" title="Click × to remove from all selected">
                      <span>{t}</span>
                      <button onClick={() => removeBulkTag(t)} aria-label={"Remove " + t}>×</button>
                    </span>
              )}
                </div>
            }
            </div>
            <button className="btn btn--primary btn--sm bulk-bar__done" onClick={clearSelection}>Done</button>
          </div>
        }
        <Paginator items={sortableExps.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50]} itemLabel="experience">
          {(pageItems) =>
          <table className="table exp-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => {if (el) el.indeterminate = !allVisibleSelected && rows.some((r) => selected.has(r.id));}}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all on this page" />
                  
                  </th>
                  <SortTh columnKey="name" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort} style={{ minWidth: 280 }}>Experience</SortTh>
                  <SortTh columnKey="_spaceName" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Space</SortTh>
                  <SortTh columnKey="taps" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Taps</SortTh>
                  <SortTh columnKey="visitors" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Visitors</SortTh>
                  <SortTh columnKey="leads" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Leads</SortTh>
                  <SortTh columnKey="_devices" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Assigned devices</SortTh>
                  <SortTh columnKey="updated" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Updated</SortTh>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 &&
              <tr><td colSpan="8" style={{ padding: 40, textAlign: "center", color: "var(--ink-600)" }}>
                    No experiences match your filters.
                  </td></tr>
              }
                {pageItems.map((e) => {
                const space = spaces.find((s) => s.id === e.spaceId);
                const pct = Math.max(2, Math.round((e.taps || 0) / maxTaps * 100));
                const tags = Array.isArray(e.tags) ? e.tags : [];
                const isSel = selected.has(e.id);
                return (
                  <tr key={e.id} className={isSel ? "is-selected" : ""}>
                      <td className="col-checkbox">
                        <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => {}}
                        onClick={(ev) => toggleSelect(e.id, { shiftKey: ev.shiftKey })}
                        aria-label={"Select " + e.name} />
                      
                      </td>
                      <td className="exp-name-cell row-overlay-cell">
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <span className="link" style={{ cursor: "pointer", fontWeight: 600 }} onClick={() => onSelectExperience && onSelectExperience(e.id)}>{e.name}</span>
                            {tags.length > 0 &&
                          <div className="tp-tags">
                                {tags.map((tag) =>
                            <span key={tag} className="tp-tag">{tag}</span>
                            )}
                              </div>
                          }
                          </div>
                        </div>
                        <div className="row-actions row-actions--inline row-actions--overlay">
                          <button className="btn btn--xs row-action-btn" onClick={() => onSelectExperience && onSelectExperience(e.id)}><Icon.Edit /> Edit</button>
                          <Dropdown trigger={<span>Actions</span>}>
                            {({ close }) =>
                          <>
                              <div className="item" onClick={() => {close();setCloningExp(e);}}>Clone</div>
                              <div className="item" onClick={() => {close();onSelectExperience && onSelectExperience(e.id, "history");}}>View insights</div>
                              <div className="item is-destructive" onClick={() => {close();setConfirmDelete(e);}}>Delete</div>
                            </>
                          }
                          </Dropdown>
                        </div>
                      </td>
                      <td>{space ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-700)" }}><SpaceAvatar space={space} size={22} /><span>{space.name}</span></span> : "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{(e.taps || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>{e.visitors}</td>
                      <td>{e.leads}</td>
                      <td>{window.DATA.TAPPOINTS.filter((tp) => tp.experienceId === e.id).length}</td>
                      <td style={{ color: "var(--ink-600)" }}>{e.updated}</td>
                    </tr>);

              })}
              </tbody>
            </table>
          }
        </Paginator>
      </div>
      }
      {creating && <CreateExperienceModal spaces={spaces} initialMode={creatingInitialMode} onClose={() => setCreating(false)} onSelectExperience={(id) => { setCreating(false); onSelectExperience && onSelectExperience(id); }} />}
      {useTemplateTarget && <UseTemplateModal tpl={useTemplateTarget} spaces={spaces} onClose={() => setUseTemplateTarget(null)} />}
      {cloningExp && <CreateExperienceModal spaces={spaces} mode="clone" source={cloningExp} onClose={() => setCloningExp(null)} onSelectExperience={(id) => { setCloningExp(null); onSelectExperience && onSelectExperience(id); }} />}
      {confirmDelete &&
      <ConfirmModal
        title="Delete experience?"
        body={`This will permanently delete "${confirmDelete.name}" and detach it from any TapPoints. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {setToast("Deleted \u201C" + confirmDelete.name + "\u201D (demo only)");setConfirmDelete(null);}}
        onCancel={() => setConfirmDelete(null)} />

      }
      {toast && <div className="toast">{toast}</div>}
    </>);

}

// ============================================================
// 4. TapPoints
// ============================================================
function TapPointsScreen({ ai, onNav }) {
  ai = ai || {};
  const insights = useMemo2(
    () => window.computeTappointsInsights({ tone: ai.aiTone || "factual" }),
    [ai.aiTone, window.DATA.TAPPOINTS, window.DATA.TAPPOINTS.length, window.DATA.EXPERIENCES.length, window.DATA.SPACES.length]
  );
  const [filterText, setFilter] = useState2("");
  const [spaceFilter, setSpaceFilter] = useState2([]);
  const [typeFilter, setTypeFilter] = useState2([]);
  const spaces = window.DATA.SPACES;
  const [tps, setTpsLocal] = useState2(window.DATA.TAPPOINTS);
  // Wrap setter so every mutation also persists to window.DATA and re-syncs per-space rollups.
  // This ensures changing a TapPoint's space (or any other field) propagates everywhere —
  // dashboards, reports, space rollups, and the SpaceEditScreen device list.
  const setTps = (next) => {
    const list = typeof next === "function" ? next(tps) : next;
    window.DATA.TAPPOINTS = list;
    (window.DATA.SPACES || []).forEach((s) => {
      s.devices = list.filter((t) => t.spaceId === s.id).length;
    });
    setTpsLocal(list);
  };
  const TP_TYPES = ["Sticker", "Hub", "Card"];
  const typeFor = (id) => {
    const s = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return TP_TYPES[s % TP_TYPES.length];
  };
  const typeTone = (t) => t === "Hub" ? { bg: "rgba(0,125,249,0.10)", fg: "var(--tapin-blue)" } :
  t === "Card" ? { bg: "rgba(138,82,234,0.14)", fg: "#7434c2" } :
  t === "Sticker" ? { bg: "rgba(46,160,67,0.14)", fg: "#1c8a36" } :
  { bg: "rgba(20,29,35,0.06)", fg: "var(--ink-700)" };
  const rows = tps.filter((t) => {
    if (spaceFilter.length > 0) {
      const isUnassignedPick = spaceFilter.includes("__unassigned__");
      const matchesSpace = spaceFilter.includes(t.spaceId);
      const isUnassigned = !t.spaceId || !spaces.find((s) => s.id === t.spaceId);
      if (!matchesSpace && !(isUnassignedPick && isUnassigned)) return false;
    }
    if (typeFilter.length > 0 && !typeFilter.includes(typeFor(t.id))) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      const tags = Array.isArray(t.tags) ? t.tags : [];
      const hit =
      t.name.toLowerCase().includes(q) ||
      (t.xuid || "").toLowerCase().includes(q) ||
      tags.some((tag) => tag.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  }).map((t) => {
    const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
    const space = spaces.find((s) => s.id === t.spaceId);
    return { ...t, _type: typeFor(t.id), _spaceName: space ? space.name : "", _expName: exp ? exp.name : "" };
  });
  const sortable = useSortableData(rows, null);
  const reassign = (tpId, expId) => setTps(tps.map((t) => t.id === tpId ? { ...t, experienceId: expId } : t));
  const [editingTp, setEditingTp] = useState2(null);
  const [activityTp, setActivityTp] = useState2(null);
  const saveTp = (updated) => setTps(tps.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
  const [selected, setSelected] = useState2(() => new Set());
  const [tagDraft, setTagDraft] = useState2("");
  const [anchorId, setAnchorId] = useState2(null);
  const toggleSelect = (id, opts = {}) => {
    setSelected((s) => {
      const n = new Set(s);
      if (opts.shiftKey && anchorId != null) {
        const ids = rows.map((r) => r.id);
        const a = ids.indexOf(anchorId);
        const b = ids.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          // Range takes the target state of the clicked checkbox.
          const target = !s.has(id);
          for (let i = lo; i <= hi; i++) {
            if (target) n.add(ids[i]);else n.delete(ids[i]);
          }
          return n;
        }
      }
      if (n.has(id)) n.delete(id);else n.add(id);
      return n;
    });
    setAnchorId(id);
  };
  const clearSelection = () => setSelected(new Set());
  const visibleIds = rows.map((r) => r.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleSelectAllVisible = () => setSelected((s) => {
    if (allVisibleSelected) {
      const n = new Set(s);visibleIds.forEach((id) => n.delete(id));return n;
    }
    const n = new Set(s);visibleIds.forEach((id) => n.add(id));return n;
  });
  const applyBulkSpace = (spaceId) => setTps(tps.map((t) => selected.has(t.id) ? { ...t, spaceId, experienceId: null } : t));
  const applyBulkStatus = (status) => setTps(tps.map((t) => selected.has(t.id) ? { ...t, status } : t));
  const addBulkTag = (tag) => {
    const v = (tag || "").trim();
    if (!v) return;
    setTps(tps.map((t) => {
      if (!selected.has(t.id)) return t;
      const cur = Array.isArray(t.tags) ? t.tags : [];
      if (cur.includes(v)) return t;
      return { ...t, tags: [...cur, v] };
    }));
    setTagDraft("");
  };
  const removeBulkTag = (tag) => {
    const v = (tag || "").trim();
    if (!v) return;
    setTps(tps.map((t) => {
      if (!selected.has(t.id)) return t;
      const cur = Array.isArray(t.tags) ? t.tags : [];
      if (!cur.includes(v)) return t;
      return { ...t, tags: cur.filter((x) => x !== v) };
    }));
    setTagDraft("");
  };
  // Tags currently present on every selected row (for "remove" suggestions)
  const tagsOnAllSelected = (() => {
    const sel = tps.filter((t) => selected.has(t.id));
    if (sel.length === 0) return [];
    let common = new Set(Array.isArray(sel[0].tags) ? sel[0].tags : []);
    for (let i = 1; i < sel.length; i++) {
      const next = new Set(Array.isArray(sel[i].tags) ? sel[i].tags : []);
      common = new Set([...common].filter((t) => next.has(t)));
    }
    return [...common];
  })();
  const toggleStatus = (tpId) => setTps(tps.map((t) => t.id === tpId ? { ...t, status: t.status === "Active" ? "Inactive" : "Active" } : t));
  return (
    <>
      <Topbar title="TapPoints" subtitle="Manage TapPoint devices and assign experiences." />
      <div className="exp-toolbar">
        <div className="input-search" style={{ flex: 1, maxWidth: 360 }}>
          <span className="icon-search"><Icon.Search /></span>
          <input placeholder="Search by name, XUID, or tag" value={filterText} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <MultiSelect
          label="Spaces"
          allLabel="All spaces"
          placeholder="Search spaces"
          options={[...spaces.map((s) => ({ id: s.id, label: s.name })), { id: "__unassigned__", label: "Unassigned" }]}
          values={spaceFilter}
          onChange={setSpaceFilter} />
        <MultiSelect
          label="Type"
          allLabel="All types"
          placeholder="Filter type"
          options={TP_TYPES.map((t) => ({ id: t, label: t }))}
          values={typeFilter}
          onChange={setTypeFilter} />
        <div style={{ flex: 1 }} />
        {window.__viewerRole !== "Space Admin" &&
        <button className="btn" onClick={() => window.__tapinNav && window.__tapinNav("orders")}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 4.5h10M3 8h10M3 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Orders
          </button>
        }
        {window.__viewerRole === "Space Admin" ?
        <button className="btn" onClick={() => window.__tapinToast && window.__tapinToast("Permission request sent to your Organization admin")}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Request permission to order
          </button> :

        <button className="btn btn--primary" onClick={() => window.__tapinNav && window.__tapinNav("order")}><Icon.Plus /> Order more</button>
        }
      </div>
      {ai.aiPanel !== false && <AIInsightsPanel insights={insights} onNav={onNav || window.__tapinNav} period={{ kind: "page", page: "tappoints" }} sessionKey="tappoints" />}
      {editingTp &&
      <EditTapPointModal
        tp={editingTp}
        spaces={spaces}
        deviceType={typeFor(editingTp.id)}
        typeTone={typeTone(typeFor(editingTp.id))}
        onSave={(u) => {saveTp(u);setEditingTp(null);}}
        onClose={() => setEditingTp(null)} />

      }
      {activityTp &&
      <TapPointActivityModal
        tp={activityTp}
        spaces={spaces}
        deviceType={typeFor(activityTp.id)}
        typeTone={typeTone(typeFor(activityTp.id))}
        onClose={() => setActivityTp(null)} />

      }
      <div className="card">
        {selected.size > 0 &&
        <div className="bulk-bar">
            <div className="bulk-bar__count">
              <span className="bulk-bar__count-num">{selected.size}</span>
              <span>selected</span>
              <button className="bulk-bar__clear" onClick={clearSelection}>Clear</button>
            </div>
            <div className="bulk-bar__divider" />
            <div className="bulk-bar__group">
              <span className="bulk-bar__label">Space</span>
              <Dropdown trigger={<span>Change space</span>}>
                {({ close }) =>
              <>
                    {spaces.map((s) =>
                <div key={s.id} className="item" onClick={() => {applyBulkSpace(s.id);close();}}>{s.name}</div>
                )}
                  </>
              }
              </Dropdown>
            </div>
            <div className="bulk-bar__group">
              <span className="bulk-bar__label">Status</span>
              <button className="btn btn--sm" onClick={() => applyBulkStatus("Active")}>Activate</button>
              <button className="btn btn--sm" onClick={() => applyBulkStatus("Inactive")}>Deactivate</button>
            </div>
            <div className="bulk-bar__group bulk-bar__group--tags">
              <span className="bulk-bar__label">Tags</span>
              <div className="bulk-bar__tag-input">
                <input
                placeholder="Tag name…"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {if (e.key === "Enter") addBulkTag(tagDraft);}} />
              
                <button className="btn btn--xs btn--primary" onClick={() => addBulkTag(tagDraft)} disabled={!tagDraft.trim()}>Add</button>
              </div>
              {tagsOnAllSelected.length > 0 &&
            <div className="bulk-bar__tag-chips">
                  {tagsOnAllSelected.map((t) =>
              <span key={t} className="bulk-tag-chip" title="Click × to remove from all selected">
                      <span>{t}</span>
                      <button onClick={() => removeBulkTag(t)} aria-label={"Remove " + t}>×</button>
                    </span>
              )}
                </div>
            }
            </div>
            <button className="btn btn--primary btn--sm bulk-bar__done" onClick={clearSelection}>Done</button>
          </div>
        }
        <Paginator items={sortable.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50, 100]} itemLabel="device">
          {(pageItems) =>
          <table className="table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => {if (el) el.indeterminate = !allVisibleSelected && rows.some((r) => selected.has(r.id));}}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all on this page" />
                  
              </th>
              <SortTh columnKey="name" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort} style={{ minWidth: 260 }}>Device Name</SortTh>
              <SortTh columnKey="xuid" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>XUID</SortTh>
              <SortTh columnKey="_type" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Type</SortTh>
              <SortTh columnKey="_spaceName" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Space</SortTh>
              <SortTh columnKey="status" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Status</SortTh>
              <SortTh columnKey="_expName" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Assigned Experience</SortTh>
              <SortTh columnKey="updated" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Updated</SortTh>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 &&
              <tr><td colSpan="8"><div className="empty-row">No devices match your filters.</div></td></tr>
              }
            {pageItems.map((t) => {
                const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
                const space = spaces.find((s) => s.id === t.spaceId);
                const tags = Array.isArray(t.tags) ? t.tags : [];
                const isSel = selected.has(t.id);
                return (
                  <tr key={t.id} className={isSel ? "is-selected" : ""}>
                  <td className="col-checkbox">
                    <input type="checkbox" checked={isSel} onChange={() => {}} onClick={(e) => toggleSelect(t.id, { shiftKey: e.shiftKey })} aria-label={"Select " + t.name} />
                  </td>
                  <td className="row-overlay-cell">
                    <span className="link" style={{ cursor: "pointer" }} onClick={() => setEditingTp(t)}>{t.name}</span>
                    {tags.length > 0 &&
                      <div className="tp-tags">
                        {tags.map((tag) =>
                        <span key={tag} className="tp-tag">{tag}</span>
                        )}
                      </div>
                      }
                    <div className="row-actions row-actions--inline row-actions--overlay">
                      <button className="btn btn--xs row-action-btn" onClick={() => setEditingTp(t)}><Icon.Edit /> Edit</button>
                      <Dropdown trigger={<span>Actions</span>}>
                        {({ close }) =>
                          <>
                          <div className="item" onClick={() => {setActivityTp(t);close();}}>View activity</div>
                          <div className={"item" + (t.status === "Active" ? " is-destructive" : "")} onClick={() => {toggleStatus(t.id);close();}}>
                            {t.status === "Active" ? "Deactivate" : "Activate"}
                          </div>
                        </>
                          }
                      </Dropdown>
                    </div>
                  </td>
                  <td style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 11, color: "var(--ink-600)" }}>{t.xuid}</td>
                  <td>{(() => {const tt = typeFor(t.id);const tone = typeTone(tt);return <span className="pill" style={{ background: tone.bg, color: tone.fg, fontWeight: 600 }}>{tt}</span>;})()}</td>
                  <td>{space ? space.name : ""}</td>
                  <td><span className={"pill " + (t.status === "Active" ? "pill--green" : "pill--red")}>{t.status}</span></td>
                  <td>
                    <Dropdown trigger={<span>{exp ? exp.name : "Unassigned"}</span>}>
                      {({ close }) =>
                        <>
                          <div className={"item" + (!t.experienceId ? " is-selected" : "")} onClick={() => {reassign(t.id, null);close();}}>Unassigned</div>
                          {window.DATA.EXPERIENCES.filter((e) => e.spaceId === t.spaceId).map((e) =>
                          <div key={e.id} className={"item" + (e.id === t.experienceId ? " is-selected" : "")} onClick={() => {reassign(t.id, e.id);close();}}>{e.name}</div>
                          )}
                          {window.DATA.EXPERIENCES.filter((e) => e.spaceId === t.spaceId).length === 0 &&
                          <div className="item" style={{ color: "var(--ink-500)", pointerEvents: "none" }}>No experiences in this space</div>
                          }
                        </>
                        }
                    </Dropdown>
                  </td>
                  <td>{t.updated}</td>
                </tr>);

              })}
          </tbody>
        </table>
          }
        </Paginator>
      </div>
    </>);

}

// ============================================================
// 5. Spaces list
// ============================================================
function SpacesScreen({ onSelectSpace, ai, onNav }) {
  ai = ai || {};
  const insights = useMemo2(
    () => window.computeSpacesInsights({ tone: ai.aiTone || "factual" }),
    [ai.aiTone, window.DATA.SPACES, window.DATA.SPACES.length, window.DATA.EXPERIENCES.length, window.DATA.TAPPOINTS.length]
  );
  const [filterText, setFilter] = useState2("");
  const [selected, setSelected] = useState2(null);
  const [creating, setCreating] = useState2(false);
  const spaces = window.DATA.SPACES.filter((s) => !filterText || s.name.toLowerCase().includes(filterText.toLowerCase()));
  return (
    <>
      <Topbar title="Spaces" subtitle="Manage your spaces here." />
      <div className="exp-toolbar">
        <div className="input-search" style={{ flex: 1, maxWidth: 360 }}>
          <span className="icon-search"><Icon.Search /></span>
          <input placeholder="Search spaces" value={filterText} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div style={{ flex: 1 }} />
        {window.__viewerRole === "Space Admin" ?
        <span className="info-tip" tabIndex="0" aria-label="Only Organization admins can create new spaces" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 14px", height: 36, borderRadius: 8, background: "rgba(20,29,35,0.06)", color: "var(--ink-600)", fontSize: 13, fontWeight: 600, cursor: "not-allowed" }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>Add New Space</span>
            <span className="info-tip__pop">Only Organization admins can create new spaces. Ask an org admin to add one.</span>
          </span> :

        <button className="btn btn--primary" onClick={() => setCreating(true)}><Icon.Plus /> Add New Space</button>
        }
      </div>
      {ai.aiPanel !== false && <AIInsightsPanel insights={insights} onNav={onNav || window.__tapinNav} period={{ kind: "page", page: "spaces" }} sessionKey="spaces" />}
      {creating && <CreateSpaceModal onClose={() => setCreating(false)} />}
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px 100px", padding: "16px 26px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Space</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Type</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Updated</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Status</span>
        </div>
        <Paginator items={spaces} defaultPerPage={10} perPageOptions={[10, 25, 50, 100]} itemLabel="space">
          {(pageItems) =>
          <div className="row-list">
              {pageItems.length === 0 && <div className="empty-row">No spaces match your filter.</div>}
              {pageItems.map((s) =>
            <div className={"row" + (selected === s.id ? " is-selected" : "")} key={s.id}
            onMouseEnter={() => setSelected(s.id)}
            onClick={() => onSelectSpace(s.id)}
            style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 140px 160px 100px", gap: 16 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 0 }}>
                    <SpaceAvatar space={s} />
                    <div className="row-main">
                      <p className="row-title">{s.name}</p>
                      <p className="row-sub">
                        {s.members} {s.members === 1 ? "user" : "users"} • {s.taps} total taps • {s.devices} Devices Associated • {s.experiences} Experiences Associated<br />
                        Admins: {s.admins.join(", ")}
                      </p>
                    </div>
                    <div className="row-action-cluster">
                      <button className="btn btn--xs" onClick={(e) => {e.stopPropagation();onSelectSpace(s.id);}}><Icon.Edit /> Edit</button>
                    </div>
                  </div>
                  <div style={{ alignSelf: "center" }}><span className="pill pill--soft">{s.type}</span></div>
                  <div style={{ alignSelf: "center", fontSize: 12, color: "var(--ink-800)" }}>{s.updated}</div>
                  <div style={{ alignSelf: "center" }}><span className="pill pill--green">Active</span></div>
                </div>
            )}
            </div>
          }
        </Paginator>
      </div>
    </>);

}

// ============================================================
// Use Template — focused popup launched from a template card
// ============================================================
function UseTemplateModal({ tpl, spaces, onClose }) {
  const [name, setName] = useState2(tpl.name);
  const [desc, setDesc] = useState2(tpl.description || "");
  const [spaceId, setSpaceId] = useState2(spaces[0]?.id || "");
  const [spaceOpen, setSpaceOpen] = useState2(false);
  const spaceRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => {
      if (spaceRef.current && !spaceRef.current.contains(e.target)) setSpaceOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const selectedSpace = spaces.find((s) => s.id === spaceId);
  const canSubmit = name.trim() && spaceId;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span className="tpl-locked-banner__thumb" style={{ width: 40, height: 40 }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                <path d="m5 11.738h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3zm-1-6.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v3.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                <path d="m15 27v-10.63c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3zm-11 0v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v10.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                <path d="m27 20.262h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3zm1 6.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-3.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
                <path d="m27 2h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-10.63c0-1.654-1.346-3-3-3zm1 13.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
              </svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <h3 className="card-title" style={{ margin: 0 }}>Use "{tpl.name}" template</h3>
              <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Rename, describe and pick a space — you'll customise the design after.</p>
            </div>
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 420 }}>
          <div className="field">
            <label>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dinosaur Discoveries" />
          </div>
          <div className="field">
            <label>Description <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>(optional)</span></label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short summary visible in lists and reports" />
          </div>
          <div className="field" style={{ position: "relative" }} ref={spaceRef}>
            <label>Space *</label>
            <div className="select" onClick={() => setSpaceOpen(!spaceOpen)}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {selectedSpace && <SpaceAvatar space={selectedSpace} size={18} />}
                <span>{selectedSpace ? selectedSpace.name : spaceId === "__unassigned__" ? "Unassigned" : "Select a space"}</span>
              </span>
              <Icon.Caret />
            </div>
            {spaceOpen &&
            <div className="dropdown-menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, marginTop: 0, maxHeight: 240, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)", zIndex: 10 }}>
                <div className={"item" + (spaceId === "__unassigned__" ? " is-selected" : "")} style={{ display: "grid", gridTemplateColumns: "22px 1fr", columnGap: 10, alignItems: "center", padding: "8px 12px" }} onClick={() => {setSpaceId("__unassigned__");setSpaceOpen(false);}}>
                    <span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ink-500)" }}>—</span>
                    <span style={{ color: "var(--ink-700)" }}>Unassigned</span>
                  </div>
                {spaces.map((s) =>
              <div key={s.id} className={"item" + (s.id === spaceId ? " is-selected" : "")} style={{ display: "grid", gridTemplateColumns: "22px 1fr", columnGap: 10, alignItems: "center", padding: "8px 12px" }} onClick={() => {setSpaceId(s.id);setSpaceOpen(false);}}>
                    <SpaceAvatar space={s} size={22} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  </div>
              )}
              </div>
            }
          </div>
        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            style={canSubmit ? null : { opacity: 0.5, pointerEvents: "none" }}
            onClick={onClose}>
            
            Create experience
          </button>
        </div>
      </div>
    </div>);

}

// ============================================================
// Templates view — shown on the Experiences page when the
// "Templates" toolbar toggle is active.
// ============================================================
function TemplatesView({ onUse }) {
  const TEMPLATES = [
  { id: "tpl-hub", name: "Exhibit", updated: "2 weeks ago", description: "Multi-section landing page with hero, links, and contact", uses: 8 },
  { id: "tpl-card", name: "Promo", updated: "1 month ago", description: "Single-offer card with CTA and image", uses: 12 },
  { id: "tpl-sticker", name: "Event", updated: "1 month ago", description: "Lightweight QR/NFC redirect with event details", uses: 5 },
  { id: "tpl-form", name: "Lead capture", updated: "3 months ago", description: "Form-first hub for collecting visitor info", uses: 3 },
  { id: "tpl-coupon", name: "Coupon", updated: "3 months ago", description: "Time-limited offer with code reveal", uses: 9 },
  { id: "tpl-menu", name: "Menu", updated: "5 months ago", description: "Section-based menu with items and prices", uses: 2 }];

  const [previewing, setPreviewing] = useState2(null);
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Your templates</h3>
          <p className="card-subtitle">Saved designs you can reuse to spin up new experiences fast.</p>
        </div>
      </div>
      <div className="tpl-grid">
        {TEMPLATES.map((tpl) =>
        <div key={tpl.id} className="tpl-grid-card">
            <div className="tpl-grid-card__thumb">
              <svg width="40" height="40" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                <path d="m5 11.738h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3zm-1-6.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v3.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                <path d="m15 27v-10.63c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3zm-11 0v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v10.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                <path d="m27 20.262h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3zm1 6.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-3.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
                <path d="m27 2h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-10.63c0-1.654-1.346-3-3-3zm1 13.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
              </svg>
            </div>
            <div className="tpl-grid-card__body">
              <div className="tpl-grid-card__head">
                <span className="tpl-grid-card__name">{tpl.name}</span>
              </div>
              <p className="tpl-grid-card__desc">{tpl.description}</p>
              <div className="tpl-grid-card__meta">
                <span>Updated {tpl.updated}</span>
                <span>•</span>
                <span>{tpl.uses} {tpl.uses === 1 ? "use" : "uses"}</span>
              </div>
            </div>
            <div className="tpl-grid-card__foot">
              <button className="btn btn--xs" onClick={() => setPreviewing(tpl)}>Preview</button>
              <button className="btn btn--xs btn--primary" onClick={() => onUse && onUse(tpl)}>Use template</button>
            </div>
          </div>
        )}
      </div>
      {previewing &&
      <TemplatePreviewModal
        tpl={previewing}
        onUse={() => {const t = previewing;setPreviewing(null);onUse && onUse(t);}}
        onClose={() => setPreviewing(null)} />

      }
    </div>);

}

// ============================================================
// Template preview — phone-screen mockup popup
// ============================================================
function TemplatePreviewModal({ tpl, onUse, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tpl-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>{tpl.name}</h3>
            <p className="card-subtitle" style={{ margin: "2px 0 0" }}>{tpl.description}</p>
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body tpl-preview-body">
          <div className="tpl-preview-phone" aria-label="Phone preview">
            <div className="tpl-preview-phone__notch" />
            <div className="tpl-preview-phone__screen">
              <span style={{ fontSize: 12, color: "var(--ink-500)", textAlign: "center", padding: "0 24px" }}>
                Preview not yet available
              </span>
            </div>
            <div className="tpl-preview-phone__home" />
          </div>
        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn--primary" onClick={onUse}>Use template</button>
        </div>
      </div>
    </div>);

}

// ============================================================
// Add User to Space — picks existing org users to add to a space
// ============================================================
function AddUserToSpaceModal({ space, existingNames, onCancel, onConfirm }) {
  const all = window.DATA && window.DATA.PEOPLE || [];
  const candidates = all.filter((p) => !existingNames.has(p.name));
  const [search, setSearch] = useState2("");
  const [picked, setPicked] = useState2(() => new Set());
  const q = search.trim().toLowerCase();
  const filtered = candidates.filter((p) =>
  !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  );
  const toggle = (email) => setPicked((cur) => {
    const n = new Set(cur);
    if (n.has(email)) n.delete(email);else n.add(email);
    return n;
  });
  const submit = () => {
    if (picked.size === 0) return;
    onConfirm(all.filter((p) => picked.has(p.email)));
  };
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Add user to {space.name}</h3>
            <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Pick existing users from your organisation</p>
          </div>
          <button className="btn btn--icon" onClick={onCancel} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="input-search">
            <span className="icon-search"><Icon.Search /></span>
            <input placeholder="Search users by name or email" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, maxHeight: 340, overflowY: "auto" }}>
            {filtered.length === 0 &&
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-600)", fontSize: 13 }}>
                {candidates.length === 0 ?
              "Everyone in your organisation is already in this space." :
              "No users match your search."}
              </div>
            }
            {filtered.map((p, i) => {
              const isPicked = picked.has(p.email);
              return (
                <label
                  key={p.email}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--line)",
                    cursor: "pointer",
                    background: isPicked ? "var(--tapin-blue-100, rgba(176,216,255,0.30))" : "transparent"
                  }}>
                  
                  <input type="checkbox" checked={isPicked} onChange={() => toggle(p.email)} aria-label={"Select " + p.name} />
                  <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{p.name.split(" ").map((x) => x[0]).join("")}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-600)" }}>{p.email}</div>
                  </div>
                  <span className={"pill " + (p.role === "Space Admin" ? "pill--purple" : "pill--soft")} style={{ fontSize: 11 }}>{p.role}</span>
                </label>);

            })}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-600)", margin: 0 }}>
            {window.__viewerRole === "Space Admin" ?
            <>Only existing users can be added. Ask an <strong>Organization admin</strong> to invite new people to your organisation.</> :
            <>Not finding who you need? <a href="#" onClick={(e) => {e.preventDefault();window.__openInviteUser = true;onCancel();if (window.__tapinNav) window.__tapinNav("people");}} style={{ color: "var(--tapin-blue)", fontWeight: 600 }}>Invite a new user</a> to your organisation first.</>
            }
          </p>
        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--ink-600)" }}>{picked.size} selected</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button
              className="btn btn--primary"
              style={picked.size > 0 ? null : { opacity: 0.5, pointerEvents: "none" }}
              onClick={submit}>
              
              Add {picked.size > 0 ? picked.size : ""} {picked.size === 1 ? "user" : "users"}
            </button>
          </div>
        </div>
      </div>
    </div>);

}

// ============================================================
// Experience preview popup — quick info + go-to-edit button
// ============================================================
function ExperiencePreviewModal({ exp, space, onEdit, onClose }) {
  const tps = window.DATA.TAPPOINTS.filter((t) => t.experienceId === exp.id);
  const tags = Array.isArray(exp.tags) ? exp.tags : [];
  const typeTone = exp.type === "Hub" ? { bg: "rgba(0,125,249,0.10)", fg: "var(--tapin-blue)" } :
  exp.type === "Card" ? { bg: "rgba(138,82,234,0.14)", fg: "#7434c2" } :
  exp.type === "Sticker" ? { bg: "rgba(46,160,67,0.14)", fg: "#1c8a36" } :
  { bg: "rgba(20,29,35,0.06)", fg: "var(--ink-700)" };
  const delta = exp.delta || 0;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
            <h3 className="card-title" style={{ margin: 0 }}>{exp.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="pill" style={{ background: typeTone.bg, color: typeTone.fg, fontWeight: 600 }}>{exp.type}</span>
              {space && <span style={{ fontSize: 12, color: "var(--ink-600)" }}>in {space.name}</span>}
              <span style={{ fontSize: 12, color: "var(--ink-600)" }}>Updated {exp.updated}</span>
            </div>
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body" style={{ paddingTop: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
            { label: "Total taps", value: (exp.taps || 0).toLocaleString() },
            { label: "Visitors", value: (exp.visitors || 0).toLocaleString() },
            { label: "Leads", value: (exp.leads || 0).toLocaleString() }].
            map((s, i) =>
            <div key={i} style={{ background: "var(--offwhite, #F7F9FC)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-900)", marginTop: 2 }}>{s.value}</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: "var(--ink-600)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Trend</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: delta >= 0 ? "#1c8a36" : "#B00020" }}>
                {delta > 0 ? "+" : ""}{delta}% vs. previous period
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: "var(--ink-600)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Assigned TapPoints</span>
              <span style={{ fontSize: 13, color: "var(--ink-900)" }}>
                {tps.length === 0 ? <span className="muted">None</span> : tps.map((t) => t.name).join(", ")}
              </span>
            </div>
            {tags.length > 0 &&
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--ink-600)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Tags</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                  {tags.map((tg) => <span key={tg} className="tp-tag">{tg}</span>)}
                </div>
              </div>
            }
          </div>
        </div>
        <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 22px", borderTop: "1px solid var(--line)" }}>
          <button className="btn btn--sm" onClick={onClose}>Close</button>
          <button className="btn btn--primary btn--sm" onClick={onEdit}>
            <Icon.Edit /> Edit experience
          </button>
        </div>
      </div>
    </div>);

}

// ============================================================
// 6. Spaces - Selected (Edit Space)
// ============================================================
function SpaceEditScreen({ spaceId, onNav, onBack, onSelectExperience }) {
  const original = window.DATA.SPACES.find((s) => s.id === spaceId) || window.DATA.SPACES[0];
  if (!original) {
    return (
      <>
        <Topbar title="Spaces" subtitle="No spaces to edit." />
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 8px" }}>No spaces yet</p>
          <button className="btn btn--primary" onClick={onBack}>Back to Spaces</button>
        </div>
      </>);

  }
  const [form, setForm] = useState2({
    name: original.name,
    type: original.type,
    description: original.description,
    active: original.active
  });
  const [tab, setTab] = useState2("details");
  const [typeOpen, setTypeOpen] = useState2(false);
  const [editingTp, setEditingTp] = useState2(null);
  const [previewExp, setPreviewExp] = useState2(null); // experience-info popup state
  // Space Admins can view space details but not edit them.
  const spaceViewOnly = typeof window !== "undefined" && window.__viewerRole === "Space Admin";
  const lockedSpaceInput = spaceViewOnly ? { background: "var(--offwhite, #F7F9FC)", cursor: "not-allowed", color: "var(--ink-700)" } : null;
  const [removingPerson, setRemovingPerson] = useState2(null); // person being removed (confirm popup)
  const [editingPerson, setEditingPerson] = useState2(null); // person being edited (modal)
  const [removedEmails, setRemovedEmails] = useState2(() => new Set()); // locally hide removed people
  const [addingPerson, setAddingPerson] = useState2(false); // "Add user" modal
  const [addedPeople, setAddedPeople] = useState2([]); // locally appended people for this space
  const [tpRev, setTpRev] = useState2(0); // bump to force re-render when experiences are reassigned
  const assignTpExperience = (tpId, expId) => {
    const t = window.DATA.TAPPOINTS.find((x) => x.id === tpId);
    if (t) t.experienceId = expId || null;
    setTpRev((n) => n + 1);
  };
  const TP_TYPES_SE = ["Sticker", "Hub", "Card"];
  const typeFor = (id) => {
    const s = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return TP_TYPES_SE[s % TP_TYPES_SE.length];
  };
  const typeTone = (t) => t === "Hub" ? { bg: "rgba(0,125,249,0.10)", fg: "var(--tapin-blue)" } :
  t === "Card" ? { bg: "rgba(138,82,234,0.14)", fg: "#7434c2" } :
  t === "Sticker" ? { bg: "rgba(46,160,67,0.14)", fg: "#1c8a36" } :
  { bg: "rgba(20,29,35,0.06)", fg: "var(--ink-700)" };
  const upd = (k, v) => setForm({ ...form, [k]: v });

  // Sortable data for the three primary tab tables. Hooks declared at the top so
  // sort state is preserved across tab switches and complies with React hook rules.
  const peopleRows = [...window.DATA.PEOPLE_NHM, ...addedPeople].filter((p) => !removedEmails.has(p.name));
  const sortablePeople = useSortableData(peopleRows, null);
  const tpRows = window.DATA.TAPPOINTS.filter((t) => t.spaceId === original.id).map((t) => ({
    ...t,
    _type: typeFor(t.id),
    _expName: (window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId) || {}).name || ""
  }));
  const sortableTps = useSortableData(tpRows, null);
  const expRows = window.DATA.EXPERIENCES.filter((e) => e.spaceId === original.id).map((e) => ({
    ...e,
    _tps: window.DATA.TAPPOINTS.filter((tp) => tp.experienceId === e.id).length
  }));
  const sortableExps = useSortableData(expRows, null);

  return (
    <>
      <Topbar title="Spaces" subtitle="Manage your spaces here." />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button className="btn btn--sm" onClick={onBack}>← Back to Spaces</button>
        <span style={{ fontSize: 13, color: "var(--ink-600)" }}>Editing</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{original.name}</span>
      </div>
      <div className="tabs">
        {["details", "people", "tappoints", "experiences", "announcements"].map((t) =>
        <button key={t} className={"tab" + (tab === t ? " is-active" : "")} onClick={() => setTab(t)}>
            {t === "details" ? "Details" : t === "people" ? "Users" : t === "tappoints" ? "TapPoints" : t === "experiences" ? "Experiences" : "Announcements"}
          </button>
        )}
      </div>
      {tab === "details" &&
      <div className="grid-2">
          <div className="card" style={{ padding: 26 }}>
            <h3 className="card-title" style={{ marginBottom: 18 }}>Space details</h3>
            {spaceViewOnly &&
          <div className="locked-banner" style={{ marginBottom: 16 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <div>
                  <div className="locked-banner__title">Read-only for Space admins</div>
                  <div className="locked-banner__hint">Only Organization admins can edit space details. Ask your Org admin to make changes.</div>
                </div>
              </div>
          }
            <div className="logo-uploader">
              <div className="logo-uploader__avatar">
                {form.logo ? <img src={form.logo} alt="" /> : <span>{original.short}</span>}
              </div>
              <div className="logo-uploader__meta">
                <div className="logo-uploader__label">Logo image</div>
                <div className="logo-uploader__hint">PNG or JPG, at least 256×256px.</div>
                {!spaceViewOnly &&
              <div className="logo-uploader__actions">
                  <label className="btn btn--sm">
                    <Icon.Upload /> Upload new
                    <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => upd("logo", r.result);
                      r.readAsDataURL(f);
                    }} />
                  
                  </label>
                  {form.logo &&
                <button className="btn btn--sm" onClick={() => upd("logo", "")}>Remove</button>
                }
                </div>
              }
              </div>
            </div>
            <div className="field" style={{ position: "relative" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                Organization
              </label>
              {window.__viewerRole === "Space Admin" ?
            <div style={{ position: "relative" }}>
                <input
                value="Acme Museum Co."
                readOnly
                disabled
                style={{ paddingRight: 36, background: "var(--offwhite, #F7F9FC)", cursor: "not-allowed", color: "var(--ink-700)" }} />
              
                <span style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", color: "var(--ink-500)", pointerEvents: "none", display: "inline-flex" }} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </div> :

            <input
              defaultValue="Acme Museum Co."
              placeholder="Organization name" />

            }
            </div>
            <div className="field">
              <label>Space name</label>
              <div style={{ position: "relative" }}>
                <input value={form.name} onChange={(e) => upd("name", e.target.value)} readOnly={spaceViewOnly} disabled={spaceViewOnly} style={spaceViewOnly ? { ...lockedSpaceInput, paddingRight: 36 } : null} />
                {spaceViewOnly &&
              <span style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", color: "var(--ink-500)", pointerEvents: "none", display: "inline-flex" }} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              }
              </div>
            </div>
            <div className="field" style={{ position: "relative" }}>
              <label>Space type</label>
              <div className="select" onClick={() => {if (!spaceViewOnly) setTypeOpen(!typeOpen);}} style={spaceViewOnly ? { background: "var(--offwhite, #F7F9FC)", cursor: "not-allowed", paddingRight: 36 } : null}>
                <span>{form.type}</span>
                {spaceViewOnly ?
              <span style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", color: "var(--ink-500)", pointerEvents: "none", display: "inline-flex" }} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span> :

              <Icon.Caret />
              }
              </div>
              {typeOpen &&
            <div className="dropdown-menu" style={{ left: 0, right: 0, position: "absolute", top: "100%", marginTop: 4 }}>
                  {window.DATA.SPACE_TYPES.map((t) =>
              <div key={t} className={"item" + (form.type === t ? " is-selected" : "")} onClick={() => {upd("type", t);setTypeOpen(false);}}>{t}</div>
              )}
                </div>
            }
            </div>
            <div className="field">
              <label>Description</label>
              <div style={{ position: "relative" }}>
                <textarea value={form.description} onChange={(e) => upd("description", e.target.value)} readOnly={spaceViewOnly} disabled={spaceViewOnly} style={spaceViewOnly ? { ...lockedSpaceInput, paddingRight: 36 } : null} />
                {spaceViewOnly &&
              <span style={{ position: "absolute", top: 10, right: 12, color: "var(--ink-500)", pointerEvents: "none", display: "inline-flex" }} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
              }
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-800)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Active
                  {spaceViewOnly &&
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: "var(--ink-500)" }}>
                      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                }
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-600)" }}>Visible to associated devices and members</div>
              </div>
              <button className={"toggle" + (form.active ? " on" : "")} disabled={spaceViewOnly} style={spaceViewOnly ? { opacity: 0.6, cursor: "not-allowed" } : null} onClick={() => {if (!spaceViewOnly) upd("active", !form.active);}} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              {spaceViewOnly ?
            <button className="btn" onClick={onBack}>Back</button> :

            <>
                  <button className="btn btn--primary">Save changes</button>
                  <button className="btn" onClick={onBack}>Cancel</button>
                  <button className="btn btn--danger" style={{ marginLeft: "auto" }}>Archive space</button>
                </>
            }
            </div>
          </div>
          <div className="card" style={{ padding: 26 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>At a glance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="stat-card" style={{ padding: 14 }}>
                <div className="stat-icon stat-icon--green"><Icon.TapHand /></div>
                <div><p className="stat-label">Total taps</p><div className="stat-value" style={{ fontSize: 22 }}>{original.taps}</div></div>
              </div>
              <div className="stat-card" style={{ padding: 14 }}>
                <div className="stat-icon stat-icon--purple"><Icon.Users /></div>
                <div><p className="stat-label">Users</p><div className="stat-value" style={{ fontSize: 22 }}>{original.members}</div></div>
              </div>
              <div className="stat-card" style={{ padding: 14 }}>
                <div className="stat-icon stat-icon--blue"><Icon.TapPoints /></div>
                <div><p className="stat-label">TapPoints</p><div className="stat-value" style={{ fontSize: 22 }}>{original.devices}</div></div>
              </div>
              <div className="stat-card" style={{ padding: 14 }}>
                <div className="stat-icon stat-icon--orange"><Icon.Experiences /></div>
                <div><p className="stat-label">Experiences</p><div className="stat-value" style={{ fontSize: 22 }}>{original.experiences}</div></div>
              </div>
            </div>
            <div style={{ marginTop: 22 }}>
              <h3 className="card-title" style={{ marginBottom: 10 }}>Organization admins</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {original.admins.map((a) =>
              <div key={a} className="pill pill--soft-strong" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px" }}>
                    <span className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{a.split(" ").map((p) => p[0]).join("")}</span>
                    {a}
                  </div>
              )}
              </div>
            </div>
          </div>
        </div>
      }
      {tab === "people" &&
      <div className="card card-locked-h">
          <div className="card-header">
            <div><h3 className="card-title">Users in this space</h3><p className="card-subtitle">Admins and members of this space</p></div>
            {window.__viewerRole === "Space Admin" ?
          <span className="info-tip" tabIndex="0" aria-label="Only Organization admins can add users to a space" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", height: 30, borderRadius: 8, background: "rgba(20,29,35,0.06)", color: "var(--ink-600)", fontSize: 12, fontWeight: 600, cursor: "not-allowed" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Add user</span>
                <span className="info-tip__pop">Only Organization admins can add users to a space.</span>
              </span> :

          <button className="btn btn--primary btn--sm" onClick={() => setAddingPerson(true)}><Icon.Plus /> Add user</button>
          }
          </div>
          <Paginator items={sortablePeople.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50]} itemLabel="user">
            {(pageItems) =>
          <table className="table" style={{ marginTop: 16 }}>
              <thead><tr>
                <SortTh columnKey="name" sortKey={sortablePeople.sortKey} sortDir={sortablePeople.sortDir} onSort={sortablePeople.requestSort}>Name</SortTh>
                <th></th>
                <SortTh columnKey="type" sortKey={sortablePeople.sortKey} sortDir={sortablePeople.sortDir} onSort={sortablePeople.requestSort}>Role</SortTh>
                <SortTh columnKey="status" sortKey={sortablePeople.sortKey} sortDir={sortablePeople.sortDir} onSort={sortablePeople.requestSort}>Status</SortTh>
                <SortTh columnKey="updated" sortKey={sortablePeople.sortKey} sortDir={sortablePeople.sortDir} onSort={sortablePeople.requestSort}>Updated</SortTh>
              </tr></thead>
              <tbody>
                {pageItems.length === 0 &&
              <tr><td colSpan="5"><div className="empty-row">No users in this space yet.</div></td></tr>
              }
                {pageItems.map((p, i) =>
              <tr key={i}>
                    <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{p.name.split(" ").map((x) => x[0]).join("")}</span>
                      {p.name}
                    </td>
                    <td><div className="row-actions" style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn--xs" onClick={() => {
                      // Normalize PEOPLE_NHM item into the shape EditUserModal expects,
                      // pulling extra fields from window.DATA.PEOPLE when a match exists.
                      const full = (window.DATA.PEOPLE || []).find((x) => x.name === p.name);
                      setEditingPerson(full || {
                        name: p.name,
                        email: p.name.toLowerCase().replace(/[^a-z]+/g, ".") + "@" + original.id + ".org",
                        role: p.type || "Space Admin",
                        status: p.status || "Active",
                        spaceIds: [original.id],
                        updated: p.updated
                      });
                    }}><Icon.Edit /> Edit</button>
                      {window.__viewerRole !== "Space Admin" &&
                    <button className="btn btn--xs" onClick={() => setRemovingPerson(p)}><Icon.UserMinus /> Remove</button>
                    }
                    </div></td>
                    <td>{p.type}</td>
                    <td>{p.status === "Active" ? <span className="pill pill--green">Active</span> : <span className="pill pill--red">Inactive</span>}</td>
                    <td>{p.updated}</td>
                  </tr>
              )}
              </tbody>
            </table>
          }
          </Paginator>
        </div>
      }
      {tab === "tappoints" &&
      <div className="card card-locked-h">
          <div className="card-header">
            <div><h3 className="card-title">TapPoints in this space</h3><p className="card-subtitle">{window.DATA.TAPPOINTS.filter((t) => t.spaceId === original.id).length} devices</p></div>
            <button className="btn btn--sm" onClick={() => onNav("tappoints")}>Manage all</button>
          </div>
          <Paginator items={sortableTps.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50]} itemLabel="device">
            {(pageItems) =>
          <table className="table" style={{ marginTop: 16 }}>
              <thead><tr>
                <SortTh columnKey="name" sortKey={sortableTps.sortKey} sortDir={sortableTps.sortDir} onSort={sortableTps.requestSort}>Name</SortTh>
                <SortTh columnKey="xuid" sortKey={sortableTps.sortKey} sortDir={sortableTps.sortDir} onSort={sortableTps.requestSort}>XUID</SortTh>
                <SortTh columnKey="status" sortKey={sortableTps.sortKey} sortDir={sortableTps.sortDir} onSort={sortableTps.requestSort}>Status</SortTh>
                <SortTh columnKey="_type" sortKey={sortableTps.sortKey} sortDir={sortableTps.sortDir} onSort={sortableTps.requestSort}>Type</SortTh>
                <SortTh columnKey="_expName" sortKey={sortableTps.sortKey} sortDir={sortableTps.sortDir} onSort={sortableTps.requestSort}>Assigned Experience</SortTh>
              </tr></thead>
              <tbody>
                {pageItems.length === 0 &&
              <tr><td colSpan="5"><div className="empty-row">No TapPoints in this space yet.</div></td></tr>
              }
                {pageItems.map((t) => {
                const dt = typeFor(t.id);
                const tone = typeTone(dt);
                const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
                return (
                  <tr key={t.id}>
                      <td><span className="link" style={{ cursor: "pointer" }} onClick={() => setEditingTp(t)}>{t.name}</span></td>
                      <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "var(--ink-600)" }}>{t.xuid}</td>
                      <td><span className={"pill " + (t.status === "Active" ? "pill--green" : "pill--red")}>{t.status}</span></td>
                      <td><span className="pill" style={{ background: tone.bg, color: tone.fg, fontWeight: 600 }}>{dt}</span></td>
                      <td>{exp ? exp.name : <span className="muted">Unassigned</span>}</td>
                    </tr>);
              })}
              </tbody>
            </table>
          }
          </Paginator>
        </div>
      }
      {tab === "experiences" &&
      <div className="card card-locked-h">
          <div className="card-header">
            <div><h3 className="card-title">Experiences in this space</h3><p className="card-subtitle">{window.DATA.EXPERIENCES.filter((e) => e.spaceId === original.id).length} experiences</p></div>
            <button className="btn btn--primary btn--sm" onClick={() => {window.__openCreateExperience = true;onNav("experiences");}}><Icon.Plus /> Create new</button>
          </div>
          <Paginator items={sortableExps.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50]} itemLabel="experience">
            {(pageItems) =>
          <table className="table" style={{ marginTop: 16 }}>
              <thead><tr>
                <SortTh columnKey="name" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Name</SortTh>
                <SortTh columnKey="_tps" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Assigned TapPoints</SortTh>
                <SortTh columnKey="taps" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Total Taps</SortTh>
                <SortTh columnKey="visitors" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Visitors</SortTh>
                <SortTh columnKey="leads" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Leads</SortTh>
                <SortTh columnKey="updated" sortKey={sortableExps.sortKey} sortDir={sortableExps.sortDir} onSort={sortableExps.requestSort}>Updated</SortTh>
              </tr></thead>
              <tbody>
                {pageItems.length === 0 &&
              <tr><td colSpan="6"><div className="empty-row">No experiences in this space yet.</div></td></tr>
              }
                {pageItems.map((e) => {
                const tps = window.DATA.TAPPOINTS.filter((t) => t.experienceId === e.id);
                const tpLabel = tps.length === 0 ?
                <span className="muted">Unassigned</span> :
                tps.length <= 2 ?
                tps.map((t) => t.name).join(", ") :
                tps.slice(0, 2).map((t) => t.name).join(", ") + " +" + (tps.length - 2);
                return (
                  <tr key={e.id}>
                      <td><span className="link" style={{ cursor: "pointer" }} onClick={() => setPreviewExp(e)}>{e.name}</span></td>
                      <td>{tpLabel}</td>
                      <td>{e.taps}</td>
                      <td>{e.visitors}</td>
                      <td>{e.leads}</td>
                      <td>{e.updated}</td>
                    </tr>);
              })}
              </tbody>
            </table>
          }
          </Paginator>
        </div>
      }
      {tab === "announcements" &&
      <AnnouncementsTab space={original} />
      }
      {editingTp &&
      <EditTapPointModal
        tp={editingTp}
        spaces={window.DATA.SPACES}
        deviceType={typeFor(editingTp.id)}
        typeTone={typeTone(typeFor(editingTp.id))}
        onSave={(u) => {
          // Persist edits back to window.DATA so the table reflects them.
          const all = window.DATA.TAPPOINTS;
          const idx = all.findIndex((x) => x.id === u.id);
          if (idx >= 0) all[idx] = { ...all[idx], ...u };
          setEditingTp(null);
        }}
        onClose={() => setEditingTp(null)} />
      }
      {previewExp &&
      <ExperiencePreviewModal
        exp={previewExp}
        space={original}
        onEdit={() => {const id = previewExp.id;setPreviewExp(null);onSelectExperience && onSelectExperience(id);}}
        onClose={() => setPreviewExp(null)} />
      }
      {editingPerson && <EditUserModal user={editingPerson} spaces={window.DATA.SPACES} onClose={() => setEditingPerson(null)} />}
      {removingPerson && window.ConfirmModal &&
      <window.ConfirmModal
        title="Remove from space?"
        body={`Are you sure you want to remove ${removingPerson.name} from ${original.name}? They'll lose access to this space's devices, experiences, and reports. This can't be undone.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          setRemovedEmails((prev) => {const n = new Set(prev);n.add(removingPerson.name);return n;});
          setRemovingPerson(null);
        }}
        onCancel={() => setRemovingPerson(null)} />

      }
      {addingPerson &&
      <AddUserToSpaceModal
        space={original}
        existingNames={new Set([...window.DATA.PEOPLE_NHM, ...addedPeople].map((p) => p.name))}
        onCancel={() => setAddingPerson(false)}
        onConfirm={(picked) => {
          // Append picked org-people to the local list, mapping role -> type for this table.
          const adds = picked.map((p) => ({
            name: p.name,
            status: p.status || "Active",
            type: p.role || "Space Admin",
            updated: "just now"
          }));
          setAddedPeople((prev) => [...prev, ...adds]);
          setAddingPerson(false);
        }} />

      }
    </>);

}

// ============================================================
// Announcements tab (inside SpaceEditScreen)
// ============================================================
function AnnouncementsTab({ space }) {
  const storageKey = "tapin_announcements_" + space.id;
  const [items, setItems] = useState2(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {return [];}
  });
  React.useEffect(() => {
    try {localStorage.setItem(storageKey, JSON.stringify(items));} catch (e) {}
  }, [items, storageKey]);

  const [editing, setEditing] = useState2(null); // null = closed, {} = new, object = editing existing
  const [confirmDelete, setConfirmDelete] = useState2(null);

  const spaceExps = window.DATA.EXPERIENCES.filter((e) => e.spaceId === space.id);
  const today = new Date(2026, 4, 22);
  const todayISO = today.toISOString().slice(0, 10);

  const statusOf = (a) => {
    if (a.startDate && a.startDate > todayISO) return "scheduled";
    if (a.endDate && a.endDate < todayISO) return "expired";
    return "active";
  };
  const expNames = (a) => {
    if (!a.experienceIds || a.experienceIds.length === 0) return "All experiences";
    const list = a.experienceIds.
    map((id) => spaceExps.find((e) => e.id === id)).
    filter(Boolean).
    map((e) => e.name);
    if (list.length === 0) return "—";
    if (list.length <= 2) return list.join(", ");
    return list.slice(0, 2).join(", ") + " +" + (list.length - 2);
  };
  const fmtDate = (s) => {
    if (!s) return "—";
    const d = new Date(s + "T00:00:00");
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Decorate items with derived sortable fields, then make them sortable.
  const [statusFilter, setStatusFilter] = useState2("all");
  const decoratedAnns = items.map((a) => ({
    ...a,
    _status: statusOf(a),
    _expNames: expNames(a)
  })).filter((a) => statusFilter === "all" || a._status === statusFilter);
  const sortableAnns = useSortableData(decoratedAnns, null);
  const counts = items.reduce((acc, a) => {
    const st = statusOf(a);
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, { active: 0, scheduled: 0, expired: 0 });

  return (
    <div className="card card-locked-h">
      <div className="card-header">
        <div>
          <h3 className="card-title">Announcements in this space</h3>
          <p className="card-subtitle">Show banners to visitors on experiences in <strong style={{ color: "var(--ink-900)" }}>{space.name}</strong></p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="seg-toggle" role="tablist" aria-label="Filter announcements by status">
            {[
            { id: "all", label: "All", count: items.length },
            { id: "active", label: "Active", count: counts.active },
            { id: "scheduled", label: "Scheduled", count: counts.scheduled },
            { id: "expired", label: "Expired", count: counts.expired }].
            map((opt) =>
            <button
              key={opt.id}
              role="tab"
              aria-selected={statusFilter === opt.id}
              className={"seg-toggle__btn" + (statusFilter === opt.id ? " is-active" : "")}
              onClick={() => setStatusFilter(opt.id)}>
              
                <span>{opt.label}</span>
                <span className="seg-toggle__count">{opt.count}</span>
              </button>
            )}
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => setEditing({})}>
            <Icon.Plus /> Add announcement
          </button>
        </div>
      </div>
      <Paginator items={sortableAnns.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50]} itemLabel="announcement">
        {(pageItems) =>
        <div>
            <table className="table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <SortTh columnKey="title" sortKey={sortableAnns.sortKey} sortDir={sortableAnns.sortDir} onSort={sortableAnns.requestSort}>Title</SortTh>
                  <SortTh columnKey="_expNames" sortKey={sortableAnns.sortKey} sortDir={sortableAnns.sortDir} onSort={sortableAnns.requestSort}>Visible on</SortTh>
                  <SortTh columnKey="startDate" sortKey={sortableAnns.sortKey} sortDir={sortableAnns.sortDir} onSort={sortableAnns.requestSort}>Start</SortTh>
                  <SortTh columnKey="endDate" sortKey={sortableAnns.sortKey} sortDir={sortableAnns.sortDir} onSort={sortableAnns.requestSort}>End</SortTh>
                  <SortTh columnKey="_status" sortKey={sortableAnns.sortKey} sortDir={sortableAnns.sortDir} onSort={sortableAnns.requestSort}>Status</SortTh>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 &&
              <tr><td colSpan="6"><div className="empty-row">No announcements yet. Click "Add announcement" to create one.</div></td></tr>
              }
                {pageItems.map((a) => {
                const status = statusOf(a);
                return (
                  <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{a.title}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{a.content}</div>
                      </td>
                      <td>{expNames(a)}</td>
                      <td className="muted nowrap">{fmtDate(a.startDate)}</td>
                      <td className="muted nowrap">{fmtDate(a.endDate)}</td>
                      <td>
                        <span className={"pill " + (status === "active" ? "pill--green" : status === "scheduled" ? "pill--soft" : "pill--red")}>
                          {status === "active" ? "Active" : status === "scheduled" ? "Scheduled" : "Expired"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="row-actions row-actions--inline" style={{ opacity: 1 }}>
                          <button className="btn btn--xs" onClick={() => setEditing(a)}><Icon.Edit /> Edit</button>
                          <button className="btn btn--xs" onClick={() => setConfirmDelete(a)} style={{ color: "#B00020" }}>Delete</button>
                        </div>
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }
      </Paginator>

      {editing &&
      <AnnouncementModal
        initial={editing}
        spaceExps={spaceExps}
        onCancel={() => setEditing(null)}
        onSave={(saved) => {
          if (saved.id) {
            setItems((arr) => arr.map((x) => x.id === saved.id ? saved : x));
          } else {
            const next = { ...saved, id: "a" + Date.now() };
            setItems((arr) => [next, ...arr]);
          }
          setEditing(null);
        }} />

      }
      {confirmDelete &&
      <ConfirmModal
        title="Delete announcement?"
        body={"This will permanently remove \u201C" + confirmDelete.title + "\u201D. This can\u2019t be undone."}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setItems((arr) => arr.filter((x) => x.id !== confirmDelete.id));
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)} />

      }
    </div>);

}

// ============================================================
// Announcement create/edit modal
// ============================================================
function AnnouncementModal({ initial, spaceExps, onCancel, onSave }) {
  const [title, setTitle] = useState2(initial.title || "");
  const [content, setContent] = useState2(initial.content || "");
  const [startDate, setStartDate] = useState2(initial.startDate || "");
  const [endDate, setEndDate] = useState2(initial.endDate || "");
  const [scope, setScope] = useState2(initial.experienceIds && initial.experienceIds.length > 0 ? "select" : "all");
  const [selected, setSelected] = useState2(initial.experienceIds || []);

  const toggleExp = (id) => {
    setSelected((arr) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const canSave = title.trim().length > 0;
  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...initial,
      title: title.trim(),
      content: content.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      experienceIds: scope === "all" ? [] : selected
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>{initial.id ? "Edit announcement" : "New announcement"}</h3>
            <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Show a banner to visitors on selected experiences during a date range.</p>
          </div>
          <button className="btn btn--icon" onClick={onCancel} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Closed for renovations next week" />
          </div>
          <div className="field">
            <label>Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What you want visitors to see when they tap" rows={4} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Visible on</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <button type="button" className="exp-behavior" data-active={scope === "all"} onClick={() => setScope("all")}>
                <div className="exp-behavior__title">All experiences</div>
                <div className="exp-behavior__hint">Shows on every experience in this space</div>
              </button>
              <button type="button" className="exp-behavior" data-active={scope === "select"} onClick={() => setScope("select")}>
                <div className="exp-behavior__title">Selected experiences</div>
                <div className="exp-behavior__hint">Pick specific experiences below</div>
              </button>
            </div>
            {scope === "select" &&
            <div className="ann-exp-list">
                {spaceExps.length === 0 &&
              <div className="empty-row" style={{ padding: 16 }}>No experiences in this space yet.</div>
              }
                {spaceExps.map((e) => {
                const checked = selected.includes(e.id);
                return (
                  <label key={e.id} className={"ann-exp-row" + (checked ? " is-checked" : "")}>
                      <input type="checkbox" checked={checked} onChange={() => toggleExp(e.id)} />
                      <span className="ann-exp-row__name">{e.name}</span>
                    </label>);

              })}
              </div>
            }
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button className="btn btn--primary" disabled={!canSave} onClick={handleSave}>
              {initial.id ? "Save changes" : "Create announcement"}
            </button>
          </div>
        </div>
      </div>
    </div>);

}

// ============================================================
// 7. People
// ============================================================
function PeopleScreen({ onSelectSpace, ai, onNav }) {
  ai = ai || {};
  const [search, setSearch] = useState2("");
  const [roleFilter, setRoleFilter] = useState2("All roles");
  const [statusFilter, setStatusFilter] = useState2("All");
  const [editingUser, setEditingUser] = useState2(null);
  const [inviting, setInviting] = useState2(false);
  const [people, setPeople] = useState2(window.DATA.PEOPLE);
  const spaces = window.DATA.SPACES;
  // Honor cross-screen flag: opens InviteUserModal when arriving from AddUserToSpaceModal.
  React.useEffect(() => {
    if (window.__openInviteUser) {
      window.__openInviteUser = false;
      setInviting(true);
    }
  }, []);
  const [selected, setSelected] = useState2(() => new Set());
  const [tagDraft, setTagDraft] = useState2("");
  const [anchorId, setAnchorId] = useState2(null);

  const filtered = people.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const nameHit = p.name.toLowerCase().includes(q);
      const emailHit = p.email.toLowerCase().includes(q);
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const tagHit = tags.some((t) => String(t).toLowerCase().includes(q));
      if (!nameHit && !emailHit && !tagHit) return false;
    }
    if (roleFilter !== "All roles" && p.role !== roleFilter) return false;
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    return true;
  });
  const sortableUsers = useSortableData(filtered, null);

  const totals = {
    all: people.length,
    groupAdmins: people.filter((p) => p.role === "Space Admin").length,
    spaceAdmins: people.filter((p) => p.role === "Space Admin").length,
    members: people.filter((p) => p.role === "Space Admin").length,
    inactive: people.filter((p) => p.status === "Inactive").length
  };

  const rowsForBulk = sortableUsers.sorted;
  const toggleSelect = (id, opts = {}) => {
    setSelected((s) => {
      const n = new Set(s);
      if (opts.shiftKey && anchorId != null) {
        const ids = rowsForBulk.map((r) => r.email);
        const a = ids.indexOf(anchorId);
        const b = ids.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          const target = !s.has(id);
          for (let i = lo; i <= hi; i++) {
            if (target) n.add(ids[i]);else n.delete(ids[i]);
          }
          return n;
        }
      }
      if (n.has(id)) n.delete(id);else n.add(id);
      return n;
    });
    setAnchorId(id);
  };
  const clearSelection = () => setSelected(new Set());
  const visibleIds = rowsForBulk.map((r) => r.email);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleSelectAllVisible = () => setSelected((s) => {
    if (allVisibleSelected) {
      const n = new Set(s);visibleIds.forEach((id) => n.delete(id));return n;
    }
    const n = new Set(s);visibleIds.forEach((id) => n.add(id));return n;
  });
  const applyBulkRole = (role) => setPeople(people.map((p) => selected.has(p.email) ? { ...p, role } : p));
  const applyBulkStatus = (status) => setPeople(people.map((p) => selected.has(p.email) ? { ...p, status } : p));
  const addBulkTag = (tag) => {
    const v = (tag || "").trim();
    if (!v) return;
    setPeople(people.map((p) => {
      if (!selected.has(p.email)) return p;
      const cur = Array.isArray(p.tags) ? p.tags : [];
      if (cur.includes(v)) return p;
      return { ...p, tags: [...cur, v] };
    }));
    setTagDraft("");
  };
  const removeBulkTag = (tag) => {
    const v = (tag || "").trim();
    if (!v) return;
    setPeople(people.map((p) => {
      if (!selected.has(p.email)) return p;
      const cur = Array.isArray(p.tags) ? p.tags : [];
      if (!cur.includes(v)) return p;
      return { ...p, tags: cur.filter((x) => x !== v) };
    }));
    setTagDraft("");
  };
  const tagsOnAllSelected = (() => {
    const sel = people.filter((p) => selected.has(p.email));
    if (sel.length === 0) return [];
    let common = new Set(Array.isArray(sel[0].tags) ? sel[0].tags : []);
    for (let i = 1; i < sel.length; i++) {
      const next = new Set(Array.isArray(sel[i].tags) ? sel[i].tags : []);
      common = new Set([...common].filter((t) => next.has(t)));
    }
    return [...common];
  })();

  // Per-space counts for chart
  const perSpace = spaces.map((s) => {
    const inSpace = people.filter((p) => p.spaceIds.includes(s.id));
    return {
      space: s,
      admins: inSpace.filter((p) => p.role === "Space Admin" || p.role === "Space Admin").length,
      members: inSpace.filter((p) => p.role === "Space Admin").length
    };
  });
  const maxCount = Math.max(1, ...perSpace.map((r) => r.admins + r.members));

  const roleColor = (r) => r === "Space Admin" ? "pill--purple" : "pill--soft";

  const usersInsights = useMemo2(
    () => window.computeUsersInsights({ tone: ai.aiTone || "factual" }),
    [ai.aiTone, people, window.DATA.SPACES.length]
  );

  return (
    <>
      <Topbar title="Users" subtitle="Admins and members across your spaces." />

      {ai.aiPanel !== false && <AIInsightsPanel insights={usersInsights} onNav={onNav || window.__tapinNav} period={{ kind: "page", page: "people", rev: people.length }} sessionKey="people" />}

      <div className="card">
        <div className="card-header">
          <div><h3 className="card-title">All users</h3><p className="card-subtitle">{filtered.length} of {people.length}</p></div>
          <div style={{ display: "flex", gap: 10 }}>
            {window.__viewerRole !== "Space Admin" &&
            <button className="btn btn--primary btn--sm" onClick={() => setInviting(true)}><Icon.Plus /> Invite user</button>
            }
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, padding: "16px 26px 0", alignItems: "center" }}>
          <div className="input-search" style={{ flex: 1 }}>
            <span className="icon-search"><Icon.Search /></span>
            <input placeholder="Filter by name, email or tag" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dropdown trigger={<span style={{ flex: 1, textAlign: "left" }}>{roleFilter}</span>} width={180}>
            {["All roles", "Organization Admin", "Space Admin"].map((r) =>
            <div key={r} className="item" onClick={() => setRoleFilter(r)}>{r}</div>
            )}
          </Dropdown>
          <Dropdown trigger={<span style={{ flex: 1, textAlign: "left" }}>{statusFilter === "All" ? "All statuses" : statusFilter}</span>} width={160}>
            {["All", "Active", "Inactive"].map((s) =>
            <div key={s} className="item" onClick={() => setStatusFilter(s)}>{s === "All" ? "All statuses" : s}</div>
            )}
          </Dropdown>
        </div>
        {selected.size > 0 &&
        <div className="bulk-bar" style={{ marginTop: 14 }}>
            <div className="bulk-bar__count">
              <span className="bulk-bar__count-num">{selected.size}</span>
              <span>selected</span>
              <button className="bulk-bar__clear" onClick={clearSelection}>Clear</button>
            </div>
            <div className="bulk-bar__divider" />
            <div className="bulk-bar__group">
              <span className="bulk-bar__label">Role</span>
              {window.__viewerRole === "Space Admin" ?
            <span className="info-tip" tabIndex="0" aria-label="Only Organization admins can change roles" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", height: 30, borderRadius: 8, background: "rgba(20,29,35,0.06)", color: "var(--ink-600)", fontSize: 12, fontWeight: 600, cursor: "not-allowed" }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>Locked</span>
                  <span className="info-tip__pop">Only Organization admins can change a user's role.</span>
                </span> :

            <Dropdown trigger={<span>Change role</span>}>
                  {({ close }) =>
              <>
                      {["Organization Admin", "Space Admin"].map((r) =>
                <div key={r} className="item" onClick={() => {applyBulkRole(r);close();}}>{r}</div>
                )}
                    </>
              }
                </Dropdown>
            }
            </div>
            <div className="bulk-bar__group">
              <span className="bulk-bar__label">Status</span>
              {window.__viewerRole === "Space Admin" ?
            <span className="info-tip" tabIndex="0" aria-label="Only Organization admins can change user status" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", height: 30, borderRadius: 8, background: "rgba(20,29,35,0.06)", color: "var(--ink-600)", fontSize: 12, fontWeight: 600, cursor: "not-allowed" }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>Locked</span>
                  <span className="info-tip__pop">Only Organization admins can change user status.</span>
                </span> :

            <>
                  <button className="btn btn--sm" onClick={() => applyBulkStatus("Active")}>Activate</button>
                  <button className="btn btn--sm" onClick={() => applyBulkStatus("Inactive")}>Deactivate</button>
                </>
            }
            </div>
            <div className="bulk-bar__group bulk-bar__group--tags">
              <span className="bulk-bar__label">Tags</span>
              <div className="bulk-bar__tag-input">
                <input
                placeholder="Tag name…"
                value={tagDraft}
                onChange={(ev) => setTagDraft(ev.target.value)}
                onKeyDown={(ev) => {if (ev.key === "Enter") addBulkTag(tagDraft);}} />
              
                <button className="btn btn--xs btn--primary" onClick={() => addBulkTag(tagDraft)} disabled={!tagDraft.trim()}>Add</button>
              </div>
              {tagsOnAllSelected.length > 0 &&
            <div className="bulk-bar__tag-chips">
                  {tagsOnAllSelected.map((t) =>
              <span key={t} className="bulk-tag-chip">
                      <span>{t}</span>
                      <button onClick={() => removeBulkTag(t)} aria-label={"Remove " + t}>×</button>
                    </span>
              )}
                </div>
            }
            </div>
            <button className="btn btn--primary btn--sm bulk-bar__done" onClick={clearSelection}>Done</button>
          </div>
        }
        <Paginator items={sortableUsers.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50, 100]} itemLabel="user">
          {(pageItems) =>
          <table className="table" style={{ marginTop: 16 }}>
              <thead><tr>
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(el) => {if (el) el.indeterminate = !allVisibleSelected && rowsForBulk.some((r) => selected.has(r.email));}}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all on this page" />
                  
                </th>
                <SortTh columnKey="name" sortKey={sortableUsers.sortKey} sortDir={sortableUsers.sortDir} onSort={sortableUsers.requestSort}>Name</SortTh>
                <th></th>
                <SortTh columnKey="role" sortKey={sortableUsers.sortKey} sortDir={sortableUsers.sortDir} onSort={sortableUsers.requestSort}>Role</SortTh>
                <SortTh columnKey="status" sortKey={sortableUsers.sortKey} sortDir={sortableUsers.sortDir} onSort={sortableUsers.requestSort}>Status</SortTh>
                <th>Spaces</th>
                <SortTh columnKey="updated" sortKey={sortableUsers.sortKey} sortDir={sortableUsers.sortDir} onSort={sortableUsers.requestSort}>Updated</SortTh>
              </tr></thead>
              <tbody>
                {pageItems.length === 0 &&
              <tr><td colSpan="7"><div className="empty-row">No users match your filters.</div></td></tr>
              }
                {pageItems.map((p, i) => {
                const userTags = Array.isArray(p.tags) ? p.tags : [];
                const isSel = selected.has(p.email);
                return (
                  <tr key={i} className={isSel ? "is-selected" : ""}>
                  <td className="col-checkbox">
                    <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => {}}
                        onClick={(ev) => toggleSelect(p.email, { shiftKey: ev.shiftKey })}
                        aria-label={"Select " + p.name} />
                      
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{p.name.split(" ").map((x) => x[0]).join("")}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{p.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{p.email}</div>
                        {userTags.length > 0 &&
                          <div className="tp-tags">
                            {userTags.map((tag) =>
                            <span key={tag} className="tp-tag">{tag}</span>
                            )}
                          </div>
                          }
                      </div>
                    </div>
                  </td>
                  <td><div className="row-actions"><button className="btn btn--xs" onClick={() => setEditingUser(p)}><Icon.Edit /> Edit</button></div></td>
                  <td><span className={"pill " + roleColor(p.role)}>{p.role}</span></td>
                  <td>{p.status === "Active" ? <span className="pill pill--green">Active</span> : <span className="pill pill--red">Inactive</span>}</td>
                  <td>
                    {p.role === "Organization Admin" ?
                      <span className="space-chip" style={{ background: "var(--tapin-blue-100, rgba(176,216,255,0.45))", color: "var(--tapin-blue)", fontWeight: 600, padding: "3px 12px" }}>All</span> :

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 240 }}>
                      {p.spaceIds.slice(0, 3).map((sid) => {
                          const sp = spaces.find((s) => s.id === sid);
                          if (!sp) return null;
                          return (
                            <span key={sid} className="space-chip" onClick={(e) => {e.stopPropagation();onSelectSpace(sid);}}>
                            <SpaceAvatar space={sp} size={16} />
                            <span>{sp.name}</span>
                          </span>);

                        })}
                      {p.spaceIds.length > 3 && <span className="space-chip space-chip--more">+{p.spaceIds.length - 3}</span>}
                    </div>
                      }
                  </td>
                  <td className="muted">{p.updated}</td>
                </tr>);
              })}
              </tbody>
            </table>
          }
        </Paginator>
      </div>
      {editingUser && <EditUserModal user={editingUser} spaces={spaces} onClose={() => setEditingUser(null)} />}
      {inviting && <InviteUserModal spaces={spaces} onClose={() => setInviting(false)} />}
    </>);

}

// ============================================================
// 8. Reports
// ============================================================
function ReportsScreen({ spaceCtx, setSpaceCtx, period, setPeriod, frequency, setFrequency, onSelectExperience, ai, onNav }) {
  ai = ai || {};
  const scope = spaceCtx || "all";
  // Multi-select state (arrays of ids). Empty array = "all".
  const [spaceFilter, setSpaceFilter] = useState2([]);
  const [expFilter, setExpFilter] = useState2([]);
  const [tagFilter, setTagFilter] = useState2([]);
  const [visibleMetrics, setVisibleMetrics] = useState2({ totalTaps: true, uniqueVisitors: true, leadsCaptured: true, conversionRate: true });
  const toggleMetric = (k) => setVisibleMetrics((v) => ({ ...v, [k]: !v[k] }));

  const CONVERSION_GOALS = [
  { id: "form", label: "Form submission", desc: "Visitor submits any lead-capture form" },
  { id: "signup", label: "Event signup", desc: "Visitor registers for an event" },
  { id: "newsletter", label: "Newsletter join", desc: "Visitor joins a mailing list" },
  { id: "booking", label: "Booking made", desc: "Visitor books a tour, class, or appointment" },
  { id: "purchase", label: "Purchase", desc: "Visitor completes a transaction" },
  { id: "member-signup", label: "Member sign up", desc: "Visitor becomes a paid or registered member" },
  { id: "donation", label: "Donation", desc: "Visitor makes a charitable donation" },
  { id: "any", label: "Any lead capture", desc: "Any tracked goal counts as a conversion" }];

  const [conversionGoalId, setConversionGoalId] = useState2(() => localStorage.getItem("tapin_conv_goal") || "form");
  React.useEffect(() => {localStorage.setItem("tapin_conv_goal", conversionGoalId);}, [conversionGoalId]);
  const conversionGoal = CONVERSION_GOALS.find((g) => g.id === conversionGoalId) || CONVERSION_GOALS[0];
  const [goalPickerOpen, setGoalPickerOpen] = useState2(false);

  // Sync space filter -> dashboard space context when exactly one is picked.
  React.useEffect(() => {
    if (spaceFilter.length === 1) setSpaceCtx(spaceFilter[0]);else
    setSpaceCtx("all");
  }, [spaceFilter.length === 1 ? spaceFilter[0] : "all"]);

  const allSpaces = window.DATA.SPACES;
  const effectiveScope = spaceFilter.length === 1 ? spaceFilter[0] : "all";
  const availableExps = window.DATA.EXPERIENCES.filter(
    (e) => spaceFilter.length === 0 || spaceFilter.includes(e.spaceId)
  );

  // Build the tag pool from experiences in scope (and from tappoints in scope).
  const availableTags = (() => {
    const set = new Set();
    availableExps.forEach((e) => (Array.isArray(e.tags) ? e.tags : []).forEach((t) => set.add(t)));
    window.DATA.TAPPOINTS.
    filter((tp) => spaceFilter.length === 0 || spaceFilter.includes(tp.spaceId)).
    forEach((tp) => (Array.isArray(tp.tags) ? tp.tags : []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  })();

  // Reset experience + tag filters when spaces change; reset tags if their experiences leave scope.
  React.useEffect(() => {setExpFilter([]);setTagFilter([]);}, [spaceFilter.join(",")]);
  React.useEffect(() => {
    // drop selected tags that aren't available any more
    setTagFilter((cur) => cur.filter((t) => availableTags.includes(t)));
  }, [availableTags.join(",")]);

  const rawSeries = window.seriesForPeriod(period, effectiveScope);
  let { dates, values } = window.aggregateSeries(rawSeries, frequency);
  let multi = window.multiSeriesForPeriod(period, effectiveScope, frequency);
  let m = window.metricsForPeriod(period, effectiveScope);
  const vsLabel = window.previousPeriodLabel(period);
  const fmt = window.fmtDelta;
  let topExperiences = window.experiencesForPeriod(period, null);
  if (spaceFilter.length > 0) {
    topExperiences = topExperiences.filter((e) => spaceFilter.includes(e.spaceId));
  }

  // Apply experience + tag filter — scale series & metrics by the chosen experiences' share of total taps
  const hasExpFilter = expFilter.length > 0 || tagFilter.length > 0;
  if (hasExpFilter) {
    const allScoped = window.experiencesForPeriod(period, effectiveScope === "all" ? null : effectiveScope);
    // Augment scoped experiences with tags from the raw DATA so we can filter on them
    const tagsById = {};
    window.DATA.EXPERIENCES.forEach((e) => {tagsById[e.id] = Array.isArray(e.tags) ? e.tags : [];});
    const totalScopedTaps = allScoped.reduce((a, e) => a + e.taps, 0) || 1;
    const chosen = allScoped.filter((e) => {
      const okExp = expFilter.length === 0 || expFilter.includes(e.id);
      const okTag = tagFilter.length === 0 || (tagsById[e.id] || []).some((t) => tagFilter.includes(t));
      return okExp && okTag;
    });
    if (chosen.length) {
      const chosenTaps = chosen.reduce((a, e) => a + e.taps, 0);
      const frac = chosenTaps / totalScopedTaps;
      values = values.map((v) => Math.max(0, Math.round(v * frac)));
      const scaledTaps = Math.max(1, Math.round(m.totalTaps * frac));
      const scaledVisitors = Math.max(1, Math.round(m.uniqueVisitors * frac));
      const scaledLeads = Math.max(1, Math.round(m.leadsCaptured * frac));
      const scaledConv = scaledLeads / scaledVisitors * 100;
      const dAvg = chosen.reduce((a, e) => a + e.delta, 0) / chosen.length;
      m = { ...m, totalTaps: scaledTaps, uniqueVisitors: scaledVisitors, leadsCaptured: scaledLeads, conversionRate: scaledConv, tapsDelta: Math.round(dAvg), visitorsDelta: Math.round(dAvg - 2), leadsDelta: Math.round(dAvg + 1), conversionDelta: (dAvg % 4 - 1) / 2 };
      // Scale multi-series by frac so the multi-line chart matches the filtered totals.
      const scaledTapsArr = multi.totalTaps.map((v) => Math.max(0, Math.round(v * frac)));
      const scaledUniqArr = multi.uniqueVisitors.map((v) => Math.max(0, Math.round(v * frac)));
      const scaledLeadsArr = multi.leadsCaptured.map((v) => Math.max(0, Math.round(v * frac)));
      const scaledConvArr = scaledUniqArr.map((u, i) => u > 0 ? scaledLeadsArr[i] / u * 100 : 0);
      multi = { ...multi, totalTaps: scaledTapsArr, uniqueVisitors: scaledUniqArr, leadsCaptured: scaledLeadsArr, conversionRate: scaledConvArr };
    }
  }

  const reportsInsights = React.useMemo(
    () => window.computeDashboardInsights({
      period,
      spaceCtx: effectiveScope,
      frequency,
      tone: ai.aiTone || "factual"
    }),
    [period, frequency, effectiveScope, ai.aiTone, expFilter.join(","), tagFilter.join(","), window.DATA.SPACES.length, window.DATA.EXPERIENCES.length, window.DATA.TAPPOINTS.length]
  );

  const stats = [
  { statKey: "totalTaps", label: "Total Taps", value: m.totalTaps.toLocaleString(), delta: fmt(m.tapsDelta), icon: <Icon.TapHand />, kind: "green" },
  { statKey: "uniqueVisitors", label: "Unique Taps", value: m.uniqueVisitors.toLocaleString(), delta: fmt(m.visitorsDelta), icon: <Icon.Users />, kind: "purple" },
  { statKey: "leadsCaptured", label: "Leads Captured", value: m.leadsCaptured.toLocaleString(), delta: fmt(m.leadsDelta), icon: <Icon.Doc />, kind: "blue", tooltip: "Form submissions and contact details captured from visitors — e.g. logins, sign-ups, and other identifying info." },
  {
    statKey: "conversionRate",
    label: "Conversion Rate",
    value: m.conversionRate.toFixed(1) + "%",
    delta: fmt(m.conversionDelta.toFixed(1), "pp"),
    icon: <Icon.Trend />,
    kind: "orange",
    tooltip: "The percentage of visitors who completed a selected goal, such as joining, signing up for an event, or submitting a form.",
    goal: conversionGoal
  }];


  return (
    <>
      <Topbar title="Reports" subtitle="Insights across your spaces, experiences, and devices." />
      <div className="reports-toolbar">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <MultiSelect
            label="Spaces"
            allLabel="All spaces"
            placeholder="Search spaces"
            options={allSpaces.map((s) => ({ id: s.id, label: s.name }))}
            values={spaceFilter}
            onChange={setSpaceFilter} />
          
          <MultiSelect
            label="Experiences"
            allLabel="All experiences"
            placeholder="Search experiences"
            options={availableExps.map((e) => ({ id: e.id, label: e.name }))}
            values={expFilter}
            onChange={setExpFilter} />
          
          <MultiSelect
            label="Tags"
            allLabel="All tags"
            placeholder="Search tags"
            options={availableTags.map((t) => ({ id: t, label: t }))}
            values={tagFilter}
            onChange={setTagFilter} />
          
          <PeriodControl value={period} onChange={setPeriod} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ExportButton />
          <button className="btn btn--primary">Request detailed report</button>
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((s, i) =>
        <div className="stat-card" key={i} style={{ position: "relative" }}>
            {ai.aiChips !== false && s.statKey && <span style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}><ExplainChip statKey={s.statKey} insights={reportsInsights} /></span>}
            <div className={"stat-icon stat-icon--" + s.kind}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{s.label}</span>
                {s.tooltip &&
              <span className="info-tip" tabIndex="0" aria-label={s.tooltip}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                      <circle cx="6.5" cy="6.5" r="5.6" stroke="currentColor" strokeWidth="1.1" fill="none" />
                      <circle cx="6.5" cy="3.7" r="0.85" fill="currentColor" />
                      <path d="M6.5 5.7v4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span className="info-tip__pop">{s.tooltip}</span>
                  </span>
              }
              </p>
              <div className="stat-value">{s.value}<span className={"delta " + (String(s.delta).startsWith("-") ? "delta--down" : "delta--up")}>{s.delta}</span></div>
              {s.goal ?
            <button
              type="button"
              className="stat-goal"
              onClick={() => setGoalPickerOpen(true)}
              title="Change the goal counted as a conversion">
              
                  <span className="stat-goal__label">Goal:</span>
                  <span className="stat-goal__value">{s.goal.label}</span>
                  <Icon.Caret />
                </button> :

            <p className="stat-foot">{vsLabel}</p>
            }
            </div>
          </div>
        )}
      </div>
      {ai.aiPanel !== false && <AIInsightsPanel insights={reportsInsights} onNav={onNav || window.__tapinNav} period={period} sessionKey={"reports-" + effectiveScope + "-" + expFilter.join(",") + "-t:" + tagFilter.join(",")} />}
      {goalPickerOpen &&
      <div className="modal-overlay" onClick={() => setGoalPickerOpen(false)}>
          <div className="modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Choose conversion goal</h3>
                <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Pick the action that counts as a "conversion" in your reports.</p>
              </div>
              <button className="btn btn--icon" onClick={() => setGoalPickerOpen(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="goal-list">
                {CONVERSION_GOALS.map((g) =>
              <button
                key={g.id}
                type="button"
                className={"goal-option" + (g.id === conversionGoalId ? " is-selected" : "")}
                onClick={() => {setConversionGoalId(g.id);setGoalPickerOpen(false);}}>
                
                    <span className="goal-option__radio">
                      <span className="goal-option__dot" />
                    </span>
                    <div className="goal-option__main">
                      <div className="goal-option__label">{g.label}</div>
                      <div className="goal-option__desc">{g.desc}</div>
                    </div>
                  </button>
              )}
              </div>
            </div>
          </div>
        </div>
      }
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Taps over time</h3>
            <p className="card-subtitle">Overlay metrics across the selected period — toggle any to focus</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(() => {
              const r = window.periodRange(period);
              return (
                <span className="report-range-chip" title="Date range for the data shown">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>{window.formatRange(r.startISO, r.endISO)}</span>
                </span>);

            })()}
            <FrequencyControl value={frequency} onChange={setFrequency} />
          </div>
        </div>
        <div style={{ padding: "0 26px" }}>
          <LegendChips
            metrics={TAPS_METRICS}
            visible={visibleMetrics}
            totals={{
              totalTaps: m.totalTaps.toLocaleString(),
              uniqueVisitors: m.uniqueVisitors.toLocaleString(),
              leadsCaptured: m.leadsCaptured.toLocaleString(),
              conversionRate: m.conversionRate.toFixed(1) + "%"
            }}
            onToggle={toggleMetric} />
          
        </div>
        <div className="chart-wrap" style={{ paddingTop: 6, paddingBottom: 18 }}>
          <MultiLineChart data={multi} metrics={TAPS_METRICS} visible={visibleMetrics} frequency={frequency} height={320} />
        </div>
      </div>
      <div className="dash-grid-equal" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <div className="card dash-equal-card dash-fixed-card">
          <div className="card-header">
            <div style={{ minWidth: 0 }}>
              <h3 className="card-title">
                Top performers
                {spaceFilter.length === 1 && (() => {
                  const s = allSpaces.find((sp) => sp.id === spaceFilter[0]);
                  return s ? <span style={{ fontWeight: 400, color: "var(--ink-600)" }}> in {s.name}</span> : null;
                })()}
              </h3>
              <p className="card-subtitle">Experiences with the most engagement</p>
              {spaceFilter.length > 1 &&
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {spaceFilter.map((sid) => {
                  const s = allSpaces.find((sp) => sp.id === sid);
                  if (!s) return null;
                  return (
                    <span key={sid} className="pill pill--soft" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px" }}>
                        <SpaceAvatar space={s} size={16} />
                        <span>{s.name}</span>
                      </span>);

                })}
                </div>
              }
            </div>
            {(() => {const r = window.periodRange(period);return <span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>;})()}
          </div>
          <Paginator items={topExperiences} defaultPerPage={5} perPageOptions={[5, 10, 25, 50]} itemLabel="experience">
            {(pageItems, info) =>
            <div className="top-exp">
                {pageItems.length === 0 && <div className="empty-row">No experiences match your filters.</div>}
                {pageItems.map((e, i) =>
              <div className="row-exp" key={e.id} onClick={() => onSelectExperience && onSelectExperience(e.id)} style={{ cursor: "pointer" }}>
                    <span className="rank">#{info.start + i + 1}</span>
                    <div>
                      <div className="exp-name exp-name--link">{e.name}</div>
                      <div className="exp-type">{(() => {const sp = allSpaces.find((s) => s.id === e.spaceId);return sp ? sp.name : "";})()}</div>
                    </div>
                    <div className="exp-spark"><Sparkline data={[6, 9, 7, 12, 14, 16, Math.max(4, 22 - i * 2)]} /></div>
                    <div><div className="exp-count">{e.taps}</div><div className={"exp-delta " + (e.delta > 0 ? "delta--up" : "delta--down")}>{e.delta > 0 ? "+" : ""}{e.delta}%</div></div>
                  </div>
              )}
              </div>
            }
          </Paginator>
        </div>
        <HeatmapCard period={period} spaceCtx={spaceCtx} spaceFilter={spaceFilter} />
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        {spaceFilter.length === 0 ?
        <>
            <div className="card-header"><div><h3 className="card-title">Breakdown by space</h3><p className="card-subtitle">Taps, visitors, leads and conversion per space — for the selected period</p></div>{(() => {const r = window.periodRange(period);return <span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>;})()}</div>
            {(() => {
            const enrichedSpaces = window.DATA.SPACES.map((s) => {
              const sm = window.metricsForPeriod(period, s.id);
              return { ...s, _taps: sm.totalTaps, _visitors: sm.uniqueVisitors, _leads: sm.leadsCaptured, _conv: sm.conversionRate };
            });
            return <BreakdownBySpace items={enrichedSpaces} />;
          })()}
          </> :

        (() => {
          const RecentTapsTable = window.RecentTapsTable;
          const selectedSpaces = spaceFilter.
          map((id) => allSpaces.find((s) => s.id === id)).
          filter(Boolean);
          const spaceTaps = window.DATA.RECENT_TAPS.filter((t) => {
            const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
            return exp && spaceFilter.includes(exp.spaceId);
          }).map((t) => {
            const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
            const sp = exp ? allSpaces.find((s) => s.id === exp.spaceId) : null;
            return { ...t, expName: exp ? exp.name : "", spaceName: sp ? sp.name : "", deviceName: t.deviceId.replace("tp", "TapPoint ") };
          });
          return (
            <>
                <div className="card-header">
                  <div style={{ minWidth: 0 }}>
                    <h3 className="card-title">
                      Recent taps
                      {selectedSpaces.length === 1 &&
                    <span style={{ fontWeight: 400, color: "var(--ink-600)" }}> in {selectedSpaces[0].name}</span>
                    }
                    </h3>
                    <p className="card-subtitle">Latest visitor activity{selectedSpaces.length > 1 ? " across selected spaces" : ""}</p>
                    {selectedSpaces.length > 1 &&
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {selectedSpaces.map((s) =>
                    <span key={s.id} className="pill pill--soft" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px" }}>
                            <SpaceAvatar space={s} size={16} />
                            <span>{s.name}</span>
                          </span>
                    )}
                      </div>
                  }
                  </div>
                  {(() => {const r = window.periodRange(period);return <span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>;})()}
                </div>
                <RecentTapsTable items={spaceTaps} columns={selectedSpaces.length > 1 ? "all" : "space"} />
              </>);

        })()
        }
      </div>
    </>);

}

// ============================================================
// 8. Edit Space Type Dropdown (modal)
// ============================================================
function BreakdownBySpace({ items }) {
  const sortable = useSortableData(items, null);
  return (
    <Paginator items={sortable.sorted} defaultPerPage={5} perPageOptions={[5, 10, 25, 50]} itemLabel="space">
      {(pageItems) =>
      <div style={{ padding: "12px 26px 18px", overflowX: "auto" }}>
        <table className="table">
          <thead><tr>
            <SortTh columnKey="name" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Space</SortTh>
            <SortTh columnKey="_taps" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Taps</SortTh>
            <SortTh columnKey="_visitors" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Visitors</SortTh>
            <SortTh columnKey="_leads" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Leads</SortTh>
            <SortTh columnKey="_conv" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Conv.</SortTh>
            <SortTh columnKey="devices" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>TapPoints</SortTh>
            <SortTh columnKey="experiences" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Experiences</SortTh>
          </tr></thead>
          <tbody>
            {pageItems.map((s) =>
            <tr key={s.id}>
                <td style={{ display: "flex", alignItems: "center", gap: 12 }}><SpaceAvatar space={s} size={28} />{s.name}</td>
                <td>{s._taps.toLocaleString()}</td>
                <td>{s._visitors.toLocaleString()}</td>
                <td>{s._leads.toLocaleString()}</td>
                <td>{s._conv.toFixed(1)}%</td>
                <td>{s.devices}</td>
                <td>{s.experiences}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      }
    </Paginator>);

}

function EditSpaceTypeModal({ onClose, current, onSelect }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,13,50,0.40)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div className="card" style={{ width: 480, padding: 26, background: "#fff" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px" }}>Edit space type</h3>
        <p style={{ fontSize: 13, color: "var(--ink-600)", margin: "0 0 18px" }}>Pick the type that best describes this space. Used for reporting and templates.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {window.DATA.SPACE_TYPES.map((t) =>
          <button key={t} className={"btn" + (current === t ? " btn--primary" : "")} style={{ justifyContent: "flex-start", height: 44 }} onClick={() => {onSelect(t);onClose();}}>{t}</button>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22, gap: 10 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>);

}

// ============================================================
// 9. Edit User (modal)
// ============================================================
function EditUserModal({ user, spaces, onClose }) {
  const nameParts = user.name.split(" ");
  const [firstName, setFirstName] = useState2(nameParts[0] || "");
  const [lastName, setLastName] = useState2(nameParts.slice(1).join(" ") || "");
  const [displayName, setDisplayName] = useState2(user.name);
  const [email, setEmail] = useState2(user.email);
  const [role, setRole] = useState2(user.role === "Organization Admin" ? "Organization Admin" : "Space Admin");
  const [status, setStatus] = useState2(user.status);
  const [selectedSpaces, setSelectedSpaces] = useState2(user.spaceIds || []);
  const [canOrderRaw, setCanOrder] = useState2(!!user.canOrder);
  // Org Admins inherently can manage orders, so the checkbox always reflects checked for them.
  const canOrder = role === "Organization Admin" ? true : canOrderRaw;
  const [roleOpen, setRoleOpen] = useState2(false);
  const [spacesOpen, setSpacesOpen] = useState2(false);

  const userId = String(Math.abs(user.email.split("").reduce((a, c) => a + c.charCodeAt(0) * 7, 0)) % 90000 + 10000);
  const roleOptions = ["Organization Admin", "Space Admin"];

  const toggleSpace = (sid) => {
    setSelectedSpaces(selectedSpaces.includes(sid) ? selectedSpaces.filter((x) => x !== sid) : [...selectedSpaces, sid]);
  };

  // Space Admins can view but not edit other users.
  const viewOnly = typeof window !== "undefined" && window.__viewerRole === "Space Admin";
  const lockedInputStyle = viewOnly ? { background: "var(--offwhite, #F7F9FC)", cursor: "not-allowed", color: "var(--ink-700)" } : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--icon" onClick={onClose} aria-label="Back" style={{ transform: "rotate(90deg)" }}><Icon.Caret /></button>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>{viewOnly ? "View User" : "Edit User"}</h3>
              <p className="card-subtitle" style={{ margin: "2px 0 0" }}>{viewOnly ? "Only Organization admins can edit a user's profile." : "Update profile, role and space access"}</p>
            </div>
          </div>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {viewOnly &&
          <div className="locked-banner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <div className="locked-banner__title">View only for Space admins</div>
                <div className="locked-banner__hint">Only Organization admins can edit user profiles, roles, and permissions.</div>
              </div>
            </div>
          }
          <div className="field">
            <label>User ID</label>
            <input value={userId} readOnly style={{ background: "var(--ink-50)", color: "var(--ink-600)", cursor: "not-allowed" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field"><label>First name *</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} readOnly={viewOnly} disabled={viewOnly} style={lockedInputStyle} /></div>
            <div className="field"><label>Last name *</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} readOnly={viewOnly} disabled={viewOnly} style={lockedInputStyle} /></div>
          </div>
          <div className="field"><label>Display name *</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} readOnly={viewOnly} disabled={viewOnly} style={lockedInputStyle} /></div>
          <div className="field"><label>Email *</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" readOnly={viewOnly} disabled={viewOnly} style={lockedInputStyle} /></div>
          {window.__viewerRole === "Space Admin" ?
          <div className="field" style={{ position: "relative" }}>
            <label>Role</label>
            <input
              value={role}
              readOnly
              disabled
              style={{ background: "var(--offwhite, #F7F9FC)", cursor: "not-allowed", color: "var(--ink-700)" }} />
            
          </div> :

          <div className="field" style={{ position: "relative" }}>
            <label>Role</label>
            <div className="select" onClick={() => setRoleOpen(!roleOpen)}>
              <span>{role}</span>
              <Icon.Caret />
            </div>
            {roleOpen &&
            <div className="dropdown-menu" style={{ position: "relative", top: 0, left: 0, right: 0, marginTop: 6, minWidth: "auto", boxShadow: "0 6px 18px rgba(0,13,50,0.10)" }}>
                {roleOptions.map((r) =>
              <div
                key={r}
                className={"item" + (r === role ? " is-selected" : "")}
                onClick={() => {setRole(r);setRoleOpen(false);}}>
                
                    <span style={{ flex: 1 }}>{r}</span>
                  </div>
              )}
              </div>
            }
          </div>
          }
          <div className="field">
            <label>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Active", "Inactive"].map((s) =>
              <button
                key={s}
                className={"btn btn--sm" + (status === s ? " btn--primary" : "")}
                style={{ flex: 1, ...(viewOnly && status !== s ? { opacity: 0.5, cursor: "not-allowed" } : viewOnly ? { cursor: "not-allowed" } : {}) }}
                disabled={viewOnly}
                onClick={() => {if (!viewOnly) setStatus(s);}}>
                {s}</button>
              )}
            </div>
          </div>
          <div className="field">
            <label>Permissions</label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", cursor: viewOnly ? "not-allowed" : "pointer" }}>
              <input type="checkbox" checked={canOrder} disabled={viewOnly || role === "Organization Admin"} onChange={(e) => setCanOrder(e.target.checked)} style={{ accentColor: "var(--tapin-blue)", width: 16, height: 16, margin: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Manage orders</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-600)", marginTop: 2 }}>{role === "Space Admin" ? "Allow this Space admin to place TapPoint orders for their spaces." : "Organization admins can already manage orders."}</div>
              </div>
            </label>
          </div>
          <div className="field" style={{ position: "relative" }}>
            <label>Spaces</label>
            {role === "Organization Admin" ?
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: 999,
              background: "var(--tapin-blue-50, #F7FCFF)",
              color: "var(--ink-800)"
            }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: "var(--tapin-blue)" }}>
                  <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Organization admins have access to all spaces.</span>
              </div> :

            <>
            <div className="select" onClick={() => {if (!viewOnly) setSpacesOpen(!spacesOpen);}} style={{ minHeight: 40, height: "auto", padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", ...(viewOnly ? { background: "var(--offwhite, #F7F9FC)", cursor: "not-allowed" } : {}), borderRadius: "10px" }}>
              {selectedSpaces.length === 0 && <span className="muted">Select spaces…</span>}
              {selectedSpaces.map((sid) => {
                  const sp = spaces.find((s) => s.id === sid);
                  if (!sp) return null;
                  return (
                    <span key={sid} className="space-chip" onClick={(e) => {e.stopPropagation();if (!viewOnly) toggleSpace(sid);}} style={viewOnly ? { cursor: "not-allowed", opacity: 0.85 } : null}>
                    <SpaceAvatar space={sp} size={16} />
                    <span>{sp.name}</span>
                    <span style={{ marginLeft: 4, fontWeight: 600 }}>×</span>
                  </span>);

                })}
              <Icon.Caret />
            </div>
            {spacesOpen &&
              <div className="dropdown-menu" style={{ position: "relative", top: 0, left: 0, right: 0, marginTop: 6, maxHeight: 220, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)" }}>
                {spaces.map((s) => {
                  const on = selectedSpaces.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={"item" + (on ? " is-selected" : "")}
                      style={{ display: "grid", gridTemplateColumns: "18px 22px 1fr", columnGap: 10, alignItems: "center", padding: "8px 12px", textAlign: "left", justifyContent: "flex-start", width: "100%", ...(viewOnly ? { cursor: "not-allowed", opacity: 0.85 } : {}) }}
                      onClick={() => {if (!viewOnly) toggleSpace(s.id);}}>
                    
                      <input type="checkbox" checked={on} readOnly style={{ pointerEvents: "none", margin: 0, width: 16, height: 16, accentColor: "var(--tapin-blue)" }} />
                      <SpaceAvatar space={s} size={22} />
                      <span style={{ textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-800)" }}>{s.name}</span>
                    </div>);

                })}
              </div>
              }
            </>
            }
          </div>
        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose}>{viewOnly ? "Close" : "Cancel"}</button>
          {!viewOnly && <button className="btn btn--primary" onClick={onClose}>Update User</button>}
        </div>
      </div>
    </div>);

}

// ============================================================
// Create Space (modal)
// ============================================================
function CreateSpaceModal({ onClose }) {
  const [name, setName] = useState2("");
  const [description, setDescription] = useState2("");
  const [type, setType] = useState2(window.DATA.SPACE_TYPES[1] || "Business");
  const [typeOpen, setTypeOpen] = useState2(false);
  const [memberIds, setMemberIds] = useState2([]);
  const [membersOpen, setMembersOpen] = useState2(false);
  const [memberSearch, setMemberSearch] = useState2("");
  const [adminEmail, setAdminEmail] = useState2("");
  const membersRef = React.useRef(null);
  React.useEffect(() => {
    if (!membersOpen) return;
    const onDoc = (e) => {if (membersRef.current && !membersRef.current.contains(e.target)) setMembersOpen(false);};
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [membersOpen]);

  const people = window.DATA.PEOPLE || [];
  const filteredPeople = people.filter((p) =>
  !memberSearch ||
  p.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
  p.email.toLowerCase().includes(memberSearch.toLowerCase())
  );
  const toggleMember = (email) => {
    setMemberIds(memberIds.includes(email) ? memberIds.filter((x) => x !== email) : [...memberIds, email]);
  };
  const canSubmit = name.trim() && type;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--icon" onClick={onClose} aria-label="Back" style={{ transform: "rotate(90deg)" }}><Icon.Caret /></button>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Create Space</h3>
              <p className="card-subtitle" style={{ margin: "2px 0 0" }}>A space groups experiences, devices, and members</p>
            </div>
          </div>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Natural History Museum" />
          </div>

          <div className="field">
            <label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" />
          </div>

          <div className="field" style={{ position: "relative" }}>
            <label>Type *</label>
            <div className="select" onClick={() => setTypeOpen(!typeOpen)}>
              <span>{type}</span>
              <Icon.Caret />
            </div>
            {typeOpen &&
            <div className="dropdown-menu" style={{ position: "relative", top: 0, left: 0, right: 0, marginTop: 6, maxHeight: 240, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)" }}>
                {window.DATA.SPACE_TYPES.map((t) =>
              <div key={t} className={"item" + (t === type ? " is-selected" : "")} style={{ padding: "8px 12px" }} onClick={() => {setType(t);setTypeOpen(false);}}>
                    {t}
                  </div>
              )}
              </div>
            }
          </div>

          <div className="field" style={{ position: "relative" }} ref={membersRef}>
            <label>Add existing users</label>
            <div className="select" onClick={() => setMembersOpen(!membersOpen)} style={{ minHeight: 40, height: "auto", padding: memberIds.length ? "8px 12px" : "0 12px", flexWrap: "wrap", gap: 6 }}>
              {memberIds.length === 0 && <span style={{ color: "var(--ink-500)" }}>Select users from your organization</span>}
              {memberIds.map((email) => {
                const u = people.find((p) => p.email === email);
                if (!u) return null;
                return (
                  <span key={email} className="pill pill--soft" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }} onClick={(e) => e.stopPropagation()}>
                    {u.name}
                    <span
                      onClick={(e) => {e.stopPropagation();toggleMember(email);}}
                      style={{ cursor: "pointer", color: "var(--ink-600)", fontSize: 14, lineHeight: 1, marginLeft: 2 }}
                      aria-label={"Remove " + u.name}>
                      ×</span>
                  </span>);

              })}
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center" }}><Icon.Caret /></span>
            </div>
            {membersOpen &&
            <div className="dropdown-menu" style={{ position: "relative", top: 0, left: 0, right: 0, marginTop: 6, maxHeight: 260, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)" }}>
                <div style={{ padding: "6px 8px 8px", borderBottom: "1px solid var(--line)" }}>
                  <input
                  autoFocus
                  placeholder="Search users by name or email"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  style={{ width: "100%", height: 32, padding: "0 10px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 13, fontFamily: "inherit" }} />
                
                </div>
                {filteredPeople.length === 0 &&
              <div className="item" style={{ color: "var(--ink-500)", padding: "10px 12px" }}>No users match</div>
              }
                {filteredPeople.map((p) => {
                const on = memberIds.includes(p.email);
                return (
                  <div key={p.email} className={"item" + (on ? " is-selected" : "")} style={{ display: "grid", gridTemplateColumns: "18px 1fr auto", columnGap: 10, alignItems: "center", padding: "8px 12px" }} onClick={() => toggleMember(p.email)}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: 4, border: "1.5px solid " + (on ? "var(--tapin-blue)" : "var(--line)"), background: on ? "var(--tapin-blue)" : "#fff", color: "#fff", fontSize: 11, fontWeight: 700 }}>{on ? "✓" : ""}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</div>
                      </div>
                      <span className="pill pill--soft" style={{ fontSize: 10, fontWeight: 500 }}>{p.role}</span>
                    </div>);

              })}
              </div>
            }
            {memberIds.length > 0 &&
            <p className="card-subtitle" style={{ margin: "6px 0 0" }}>{memberIds.length} {memberIds.length === 1 ? "user" : "users"} will be added to this space.</p>
            }
          </div>

          <div className="field">
            <label>Invite admin</label>
            <input type="email" placeholder="admin@example.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <p className="card-subtitle" style={{ margin: "6px 0 0" }}>We'll email them an invitation to manage this space.</p>
          </div>
        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            style={canSubmit ? null : { opacity: 0.5, pointerEvents: "none" }}
            onClick={onClose}>
            Create Space</button>
        </div>
      </div>
    </div>);

}

// ============================================================
// View TapPoint Activity (modal)
// ============================================================
function TapPointActivityModal({ tp, spaces, deviceType, typeTone, onClose }) {
  const exp = window.DATA.EXPERIENCES.find((e) => e.id === tp.experienceId);
  const space = spaces.find((s) => s.id === tp.spaceId);

  // Seeded "fake-but-stable" activity timeline derived from the device id.
  const seedFor = (id) => id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = seedFor(tp.id);
  let s = seed;
  const next = () => {s = (s * 9301 + 49297) % 233280;return s / 233280;};

  // Generate dates working backwards from "today" (May 22, 2026).
  const now = new Date(2026, 4, 22, 14, 32);
  const subtractDays = (base, days, hour, minute) => {
    const d = new Date(base);
    d.setDate(d.getDate() - days);
    if (hour != null) d.setHours(hour, minute || 0, 0, 0);
    return d;
  };
  const fmt = (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  const events = [];
  // Most recent → oldest
  if (tp.status === "Inactive") {
    events.push({
      icon: "pause",
      title: "Deactivated",
      sub: "Device removed from active rotation.",
      tone: "red",
      date: subtractDays(now, Math.floor(next() * 8) + 1, 11, Math.floor(next() * 60))
    });
  }
  if (exp) {
    events.push({
      icon: "exp",
      title: "Assigned to experience",
      sub: exp.name,
      tone: "purple",
      date: subtractDays(now, Math.floor(next() * 30) + 4, 9, Math.floor(next() * 60))
    });
  }
  events.push({
    icon: "lastTap",
    title: "Last visitor tap",
    sub: "Recorded by visitor analytics.",
    tone: "green",
    date: subtractDays(now, Math.floor(next() * 5), 10 + Math.floor(next() * 8), Math.floor(next() * 60))
  });
  events.push({
    icon: "status",
    title: "Marked active",
    sub: "Device came online and reported in.",
    tone: "green",
    date: subtractDays(now, Math.floor(next() * 60) + 30, 14, Math.floor(next() * 60))
  });
  if (space) {
    events.push({
      icon: "space",
      title: "Assigned to space",
      sub: space.name,
      tone: "blue",
      date: subtractDays(now, Math.floor(next() * 60) + 60, 9, Math.floor(next() * 60))
    });
  }
  events.push({
    icon: "ship",
    title: "Shipped to customer",
    sub: "Sent via tracked courier.",
    tone: "blue",
    date: subtractDays(now, Math.floor(next() * 30) + 120, 16, Math.floor(next() * 60))
  });
  events.push({
    icon: "order",
    title: "Order placed",
    sub: "Device manufactured and added to inventory.",
    tone: "orange",
    date: subtractDays(now, Math.floor(next() * 30) + 150, 11, Math.floor(next() * 60))
  });

  events.sort((a, b) => b.date - a.date);

  const dotClass = (tone) => "activity-dot activity-dot--" + tone;
  const Glyph = ({ kind }) => {
    if (kind === "order") return <Icon.Plus />;
    if (kind === "ship") return <Icon.TapHand />;
    if (kind === "space") return <Icon.Spaces />;
    if (kind === "exp") return <Icon.Experiences />;
    if (kind === "status") return <Icon.Trend />;
    if (kind === "lastTap") return <Icon.TapHand />;
    if (kind === "pause") return <Icon.Trend />;
    return <Icon.Doc />;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Device activity</h3>
            <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Full history for <strong style={{ color: "var(--ink-900)" }}>{tp.name}</strong></p>
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="account-grid" style={{ marginBottom: 16 }}>
            <div className="readonly-field">
              <div className="readonly-field__label">XUID</div>
              <div className="readonly-field__value">
                <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "var(--ink-800)" }}>{tp.xuid}</span>
              </div>
            </div>
            <div className="readonly-field">
              <div className="readonly-field__label">Type</div>
              <div className="readonly-field__value">
                <span className="pill" style={{ background: typeTone.bg, color: typeTone.fg, fontWeight: 600 }}>{deviceType}</span>
              </div>
            </div>
            <div className="readonly-field">
              <div className="readonly-field__label">Space</div>
              <div className="readonly-field__value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {space && <SpaceAvatar space={space} size={18} />}
                <span>{space ? space.name : "—"}</span>
              </div>
            </div>
            <div className="readonly-field">
              <div className="readonly-field__label">Status</div>
              <div className="readonly-field__value">
                <span className={"pill " + (tp.status === "Active" ? "pill--green" : "pill--red")}>{tp.status}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-800)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "4px 0 6px" }}>Activity log</div>
          <div className="activity-list">
            {events.map((e, i) =>
            <div className="activity-item" key={i}>
                <div className={dotClass(e.tone)}><Glyph kind={e.icon} /></div>
                <div>
                  <p className="activity-title">{e.title}</p>
                  <p className="activity-sub">{e.sub}</p>
                </div>
                <span className="activity-time">{fmt(e.date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}

// ============================================================
// Edit TapPoint (modal)
// ============================================================
function EditTapPointModal({ tp, spaces, deviceType, typeTone, onSave, onClose }) {
  const [name, setName] = useState2(tp.name);
  const [spaceId, setSpaceId] = useState2(tp.spaceId);
  const [status, setStatus] = useState2(tp.status);
  const [experienceId, setExperienceId] = useState2(tp.experienceId || null);
  const [tags, setTags] = useState2(Array.isArray(tp.tags) ? tp.tags.slice() : []);
  const [tagDraft, setTagDraft] = useState2("");
  const addTag = (raw) => {
    const v = (raw || "").trim();
    if (!v) return;
    setTags((cur) => cur.includes(v) ? cur : [...cur, v]);
    setTagDraft("");
  };
  const removeTag = (t) => setTags((cur) => cur.filter((x) => x !== t));
  const [spaceOpen, setSpaceOpen] = useState2(false);
  const [expOpen, setExpOpen] = useState2(false);
  const spaceRef = React.useRef(null);
  const expRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => {
      if (spaceRef.current && !spaceRef.current.contains(e.target)) setSpaceOpen(false);
      if (expRef.current && !expRef.current.contains(e.target)) setExpOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedSpace = spaces.find((s) => s.id === spaceId);
  const expsInSpace = window.DATA.EXPERIENCES.filter((e) => e.spaceId === spaceId);
  const selectedExp = window.DATA.EXPERIENCES.find((e) => e.id === experienceId);
  const canSubmit = name.trim() && spaceId;

  // Clear experience if it doesn't belong to the new space
  React.useEffect(() => {
    if (experienceId && selectedExp && selectedExp.spaceId !== spaceId) {
      setExperienceId(null);
    }
  }, [spaceId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--icon" onClick={onClose} aria-label="Back" style={{ transform: "rotate(90deg)" }}><Icon.Caret /></button>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Edit TapPoint</h3>
              <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Update device details and assignment</p>
            </div>
          </div>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Read-only meta row */}
          <div className="account-grid">
            <div className="readonly-field">
              <div className="readonly-field__label">XUID</div>
              <div className="readonly-field__value">
                <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "var(--ink-800)" }}>{tp.xuid}</span>
              </div>
            </div>
            <div className="readonly-field">
              <div className="readonly-field__label">Type</div>
              <div className="readonly-field__value">
                <span className="pill" style={{ background: typeTone.bg, color: typeTone.fg, fontWeight: 600 }}>{deviceType}</span>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="field">
            <label>Device name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TapPoint 1" />
          </div>

          {/* Space */}
          <div className="field" style={{ position: "relative" }} ref={spaceRef}>
            <label>Space *</label>
            <div className="select" onClick={() => setSpaceOpen(!spaceOpen)}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {selectedSpace && <SpaceAvatar space={selectedSpace} size={18} />}
                <span>{selectedSpace ? selectedSpace.name : spaceId === "__unassigned__" ? "Unassigned" : "Select a space"}</span>
              </span>
              <Icon.Caret />
            </div>
            {spaceOpen &&
            <div className="dropdown-menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, marginTop: 0, maxHeight: 240, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)", zIndex: 10 }}>
                <div className={"item" + (spaceId === "__unassigned__" ? " is-selected" : "")} style={{ display: "grid", gridTemplateColumns: "22px 1fr", columnGap: 10, alignItems: "center", padding: "8px 12px" }} onClick={() => {setSpaceId("__unassigned__");setSpaceOpen(false);}}>
                    <span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ink-500)" }}>—</span>
                    <span style={{ color: "var(--ink-700)" }}>Unassigned</span>
                  </div>
                {spaces.map((s) =>
              <div key={s.id} className={"item" + (s.id === spaceId ? " is-selected" : "")} style={{ display: "grid", gridTemplateColumns: "22px 1fr", columnGap: 10, alignItems: "center", padding: "8px 12px" }} onClick={() => {setSpaceId(s.id);setSpaceOpen(false);}}>
                    <SpaceAvatar space={s} size={22} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  </div>
              )}
              </div>
            }
          </div>

          {/* Status */}
          <div className="field">
            <label>Status</label>
            <div className="radio-group">
              {["Active", "Inactive"].map((s) =>
              <button
                key={s}
                type="button"
                className={"radio-card" + (status === s ? " is-on" : "")}
                onClick={() => setStatus(s)}>
                
                  <span className="radio-card__dot"></span>
                  <span className="radio-card__label">{s}</span>
                  <span className="radio-card__hint">{s === "Active" ? "Accepting taps" : "Paused — not routing"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Experience assignment */}
          <div className="field" style={{ position: "relative" }} ref={expRef}>
            <label>Assigned experience</label>
            <div className="select" onClick={() => setExpOpen(!expOpen)}>
              <span style={{ color: selectedExp ? "var(--ink-900)" : "var(--ink-500)" }}>
                {selectedExp ? selectedExp.name : experienceId === null ? "Unassigned" : "Select an experience"}
              </span>
              <Icon.Caret />
            </div>
            {expOpen &&
            <div className="dropdown-menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, marginTop: 0, maxHeight: 240, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)", zIndex: 10 }}>
                <div className={"item" + (!experienceId ? " is-selected" : "")} style={{ padding: "8px 12px", color: "var(--ink-600)" }} onClick={() => {setExperienceId(null);setExpOpen(false);}}>
                  Unassigned
                </div>
                {expsInSpace.length === 0 &&
              <div className="item" style={{ padding: "8px 12px", color: "var(--ink-500)", pointerEvents: "none" }}>No experiences in this space yet</div>
              }
                {expsInSpace.map((e) =>
              <div key={e.id} className={"item" + (e.id === experienceId ? " is-selected" : "")} style={{ padding: "8px 12px" }} onClick={() => {setExperienceId(e.id);setExpOpen(false);}}>
                    {e.name}
                  </div>
              )}
              </div>
            }
            <p className="card-subtitle" style={{ margin: "6px 0 0" }}>
              {experienceId ?
              "Taps from this device will route to the selected experience." :
              "Unassigned devices show a default landing page when tapped."}
            </p>
          </div>

          {/* Tags */}
          <div className="field">
            <label>Tags</label>
            <div className="tp-tag-editor">
              {tags.map((t) =>
              <span key={t} className="tp-tag-chip">
                  <span>{t}</span>
                  <button type="button" onClick={() => removeTag(t)} aria-label={"Remove " + t}>×</button>
                </span>
              )}
              <input
                className="tp-tag-input"
                placeholder={tags.length ? "Add another tag…" : "Add a tag…"}
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagDraft);
                  } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                    removeTag(tags[tags.length - 1]);
                  }
                }}
                onBlur={() => addTag(tagDraft)} />
              
            </div>
            <p className="card-subtitle" style={{ margin: "6px 0 0" }}>
              Use tags to group devices (e.g. “entry”, “till”, “seasonal”). Press Enter or comma to add.
            </p>
          </div>

        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            style={canSubmit ? null : { opacity: 0.5, pointerEvents: "none" }}
            onClick={() => onSave({ id: tp.id, name: name.trim(), spaceId, status, experienceId, tags, updated: "just now" })}>
            Save changes</button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { ExperiencesScreen, ExperienceEditScreen, CreateExperienceModal, CreateSpaceModal, EditTapPointModal, TapPointsScreen, SpacesScreen, SpaceEditScreen, PeopleScreen, ReportsScreen, EditSpaceTypeModal, EditUserModal, InviteUserModal, TapHistoryTab, DevicesTab });

// ============================================================
// Create Experience (modal)
// ============================================================
function BusyStep({ label, delay = 0 }) {
  const [phase, setPhase] = useState2("pending"); // pending → active → done
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase("active"), delay);
    const t2 = setTimeout(() => setPhase("done"), delay + 850);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);
  return (
    <div className={"create-exp-busy__step create-exp-busy__step--" + phase}>
      <span className="create-exp-busy__step-dot" aria-hidden="true">
        {phase === "done" ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="m1.5 5 2.2 2.2L8.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : phase === "active" ? (
          <span className="create-exp-busy__step-pulse" />
        ) : null}
      </span>
      <span className="create-exp-busy__step-label">{label}</span>
    </div>
  );
}

function CreateExperienceModal({ spaces, onClose, mode = "create", source = null, initialMode = "blank", initialTemplateId = null, onSelectExperience }) {
  const isClone = mode === "clone" && source;
  const [name, setName] = useState2(isClone ? source.name + " Copy" : "");
  const [desc, setDesc] = useState2("");
  const [spaceId, setSpaceId] = useState2(isClone ? source.spaceId : spaces[0]?.id || "");
  const [type, setType] = useState2(isClone ? source.type : "Hub");
  const [requireLogin, setRequireLogin] = useState2(false);
  const [redirectOnly, setRedirectOnly] = useState2(false);
  const [redirectUrl, setRedirectUrl] = useState2("");
  const [spaceOpen, setSpaceOpen] = useState2(false);
  // Creation mode: how the user is sourcing the experience.
  // Clones always use the blank path with the source's values pre-filled.
  const [creationMode, setCreationMode] = useState2(isClone ? "blank" : initialMode);
  // AI generation state
  const [aiUrl, setAiUrl] = useState2("");
  const [aiInstructions, setAiInstructions] = useState2("");
  const [aiInclude, setAiInclude] = useState2({ colors: true, text: true, images: true, links: false });
  // Pretend user templates — in a real app these would come from the user's saved templates
  const TEMPLATES = [
  { id: "tpl-hub", name: "Exhibit", updated: "2 weeks ago", description: "Multi-section landing page with hero, links, and contact" },
  { id: "tpl-card", name: "Promo", updated: "1 month ago", description: "Single-offer card with CTA and image" },
  { id: "tpl-sticker", name: "Event", updated: "1 month ago", description: "Lightweight QR/NFC redirect with event details" },
  { id: "tpl-form", name: "Lead capture", updated: "3 months ago", description: "Form-first hub for collecting visitor info" }];

  const [selectedTemplate, setSelectedTemplate] = useState2(initialTemplateId);
  // When a specific template was pre-selected (e.g. user clicked "Use template" from the
  // templates grid), lock the modal to the template flow and hide the mode picker.
  const lockedToTemplate = !!initialTemplateId;

  // Submission state — while busy, an overlay shows a spinner + status copy
  // and after 3s the new experience is created and we route to its edit page.
  const [busy, setBusy] = useState2(null); // null | "ai" | "template" | "blank"
  const busyTimerRef = React.useRef(null);
  React.useEffect(() => () => { if (busyTimerRef.current) clearTimeout(busyTimerRef.current); }, []);

  const handleSubmit = () => {
    if (!canSubmit || busy) return;
    const submitMode = isClone ? "blank" : creationMode;
    setBusy(submitMode);
    busyTimerRef.current = setTimeout(() => {
      // Push a synthesized experience into the dataset so the edit screen has
      // something to render. Fields mirror the existing schema in data.jsx.
      const newId = "exp-" + Date.now().toString(36);
      const newExp = {
        id: newId,
        name: name.trim() || (submitMode === "ai" ? "AI-generated experience" : submitMode === "template" ? "From template" : "Untitled experience"),
        type: type || "Hub",
        spaceId,
        taps: 0, visitors: 0, leads: 0,
        updated: "just now",
        delta: 0,
        tags: submitMode === "ai" ? ["ai-generated", "new"] : submitMode === "template" ? ["new"] : ["new"],
      };
      try {
        if (window.DATA && Array.isArray(window.DATA.EXPERIENCES)) {
          window.DATA.EXPERIENCES = [newExp, ...window.DATA.EXPERIENCES];
        }
      } catch (e) { /* no-op */ }
      // Hand off to parent: open the edit/configure page for the new experience.
      if (onSelectExperience) {
        onSelectExperience(newId);
      } else {
        onClose();
      }
    }, 3000);
  };

  const selectedSpace = spaces.find((s) => s.id === spaceId);
  const canSubmit = (() => {
    if (creationMode === "ai") return aiUrl.trim() && name.trim() && spaceId;
    if (creationMode === "template") return selectedTemplate && name.trim() && spaceId;
    return name.trim() && spaceId && (!redirectOnly || redirectUrl.trim());
  })();

  const typeTone = (t) => t === "Hub" ? { bg: "rgba(0,125,249,0.10)", fg: "var(--tapin-blue)" } :
  t === "Card" ? { bg: "rgba(138,82,234,0.14)", fg: "#7434c2" } :
  t === "Sticker" ? { bg: "rgba(46,160,67,0.14)", fg: "#1c8a36" } :
  { bg: "rgba(20,29,35,0.06)", fg: "var(--ink-700)" };

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="modal" style={{ width: 580, position: "relative", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--icon" onClick={onClose} aria-label="Back" style={{ transform: "rotate(90deg)" }}><Icon.Caret /></button>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>{isClone ? "Clone Experience" : "Create Experience"}</h3>
              <p className="card-subtitle" style={{ margin: "2px 0 0" }}>{isClone ? "Duplicate the design — content stays blank and no devices are linked." : "Choose how you'd like to start"}</p>
            </div>
          </div>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Creation-mode picker — hidden when cloning or when a template was pre-selected */}
          {!isClone && !lockedToTemplate &&
          <div className="create-mode-grid">
              {[
            {
              id: "blank",
              title: "Blank",
              hint: "Start from scratch",
              icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M6 6.5h6M6 9h6M6 11.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            },
            {
              id: "ai",
              title: "AI generate",
              hint: "From a website URL",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2.5L13.6 9.2C13.85 10.25 14.7 11.06 15.76 11.27L22 12.5L15.76 13.73C14.7 13.94 13.85 14.75 13.6 15.8L12 22.5L10.4 15.8C10.15 14.75 9.3 13.94 8.24 13.73L2 12.5L8.24 11.27C9.3 11.06 10.15 10.25 10.4 9.2L12 2.5Z" fill="currentColor" /></svg>
            },
            {
              id: "template",
              title: "From template",
              hint: "Reuse a saved design",
              icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><rect x="10.5" y="2.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><rect x="10.5" y="8.5" width="4.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /><rect x="2.5" y="10.5" width="6.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" /></svg>
            }].
            map((opt) =>
            <button
              key={opt.id}
              type="button"
              className={"create-mode-card" + (creationMode === opt.id ? " is-active" : "")}
              onClick={() => setCreationMode(opt.id)}>
              
                  <span className="create-mode-card__icon">{opt.icon}</span>
                  <span className="create-mode-card__title">{opt.title}</span>
                  <span className="create-mode-card__hint">{opt.hint}</span>
                </button>
            )}
            </div>
          }

          <div className="field"><label>Name *</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dinosaur Discoveries" /></div>
          <div className="field"><label>Description <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>(optional)</span></label><input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short summary visible in lists and reports" /></div>
          {lockedToTemplate && (() => {
            const tpl = TEMPLATES.find((t) => t.id === selectedTemplate);
            if (!tpl) return null;
            return (
              <div className="tpl-locked-banner">
                <span className="tpl-locked-banner__thumb">
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                    <path d="m5 11.738h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3zm-1-6.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v3.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                    <path d="m15 27v-10.63c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3zm-11 0v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v10.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                    <path d="m27 20.262h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3zm1 6.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-3.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
                    <path d="m27 2h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-10.63c0-1.654-1.346-3-3-3zm1 13.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
                  </svg>
                </span>
                <div className="tpl-locked-banner__main">
                  <div className="tpl-locked-banner__label">Using template</div>
                  <div className="tpl-locked-banner__name">{tpl.name}</div>
                  <div className="tpl-locked-banner__desc">{tpl.description}</div>
                </div>
              </div>);

          })()}

          <div className="field" style={{ position: "relative" }}>
            <label>Space *</label>
            <div className="select" onClick={() => setSpaceOpen(!spaceOpen)}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {selectedSpace && <SpaceAvatar space={selectedSpace} size={18} />}
                <span>{selectedSpace ? selectedSpace.name : spaceId === "__unassigned__" ? "Unassigned" : "Select a space"}</span>
              </span>
              <Icon.Caret />
            </div>
            {spaceOpen &&
            <div className="dropdown-menu" style={{ position: "relative", top: 0, left: 0, right: 0, marginTop: 6, maxHeight: 220, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)" }}>
                {spaces.map((s) =>
              <div key={s.id} className={"item" + (s.id === spaceId ? " is-selected" : "")} style={{ display: "grid", gridTemplateColumns: "22px 1fr", columnGap: 10, alignItems: "center", padding: "8px 12px" }} onClick={() => {setSpaceId(s.id);setSpaceOpen(false);}}>
                    <SpaceAvatar space={s} size={22} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  </div>
              )}
              </div>
            }
          </div>

          {/* ── AI generate mode ── */}
          {!isClone && creationMode === "ai" &&
          <>
              <div className="ai-gen-section">
                <div className="ai-gen-section__title">Generate from website</div>
                <p className="ai-gen-section__sub">Enter a website URL and AI will analyze its design to create a template.</p>
                <div className="field">
                  <label>Website URL *</label>
                  <input type="url" value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} placeholder="https://example.com" />
                </div>
                <div className="field">
                  <label>Additional instructions <span style={{ color: "var(--ink-500)", fontWeight: 400 }}>(optional)</span></label>
                  <textarea
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g. Focus on the services section, use a professional tone…"
                  rows={3}
                  style={{ width: "100%", minHeight: 80, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "var(--ink-900)", resize: "vertical" }} />
                
                </div>
              </div>

              <div className="ai-gen-section">
                <div className="ai-gen-section__title">Include from website</div>
                <p className="ai-gen-section__sub">Choose what content from the website to use. Unchecked items will use placeholder values.</p>
                <div className="ai-gen-include">
                  {[
                { id: "colors", label: "Colors", hint: "Palette, accents, brand tones" },
                { id: "text", label: "Text content", hint: "Headlines, body copy, CTAs" },
                { id: "images", label: "Images", hint: "Hero photos and inline imagery" },
                { id: "links", label: "Links", hint: "External URLs and anchors" }].
                map((opt) => {
                  const on = !!aiInclude[opt.id];
                  return (
                    <label key={opt.id} className={"ai-gen-include__row" + (on ? " is-on" : "")}>
                        <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setAiInclude((cur) => ({ ...cur, [opt.id]: !cur[opt.id] }))} />
                      
                        <div className="ai-gen-include__main">
                          <div className="ai-gen-include__label">{opt.label}</div>
                          <div className="ai-gen-include__hint">{opt.hint}</div>
                        </div>
                      </label>);

                })}
                </div>
              </div>
            </>
          }

          {/* ── Template mode ── */}
          {!isClone && creationMode === "template" && !lockedToTemplate &&
          <div className="ai-gen-section">
              <div className="ai-gen-section__title">Pick a template</div>
              <p className="ai-gen-section__sub">Start from one of your saved designs. You can still tweak everything after.</p>
              <div className="tpl-list">
                {TEMPLATES.length === 0 &&
              <div style={{ padding: 24, textAlign: "center", color: "var(--ink-600)", fontSize: 13 }}>
                    You haven't saved any templates yet.
                  </div>
              }
                {TEMPLATES.map((tpl) => {
                const isSel = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    className={"tpl-card" + (isSel ? " is-active" : "")}
                    onClick={() => setSelectedTemplate(tpl.id)}>
                    
                      <div className="tpl-card__thumb">
                        <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                          <path d="m5 11.738h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3zm-1-6.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v3.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                          <path d="m15 27v-10.63c0-1.654-1.346-3-3-3h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3zm-11 0v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1v10.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1z" />
                          <path d="m27 20.262h-7c-1.654 0-3 1.346-3 3v3.738c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-3.738c0-1.654-1.346-3-3-3zm1 6.738c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-3.738c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
                          <path d="m27 2h-7c-1.654 0-3 1.346-3 3v10.63c0 1.654 1.346 3 3 3h7c1.654 0 3-1.346 3-3v-10.63c0-1.654-1.346-3-3-3zm1 13.63c0 .551-.448 1-1 1h-7c-.552 0-1-.449-1-1v-10.63c0-.551.448-1 1-1h7c.552 0 1 .449 1 1z" />
                        </svg>
                      </div>
                      <div className="tpl-card__body">
                        <div className="tpl-card__name">{tpl.name}</div>
                        <div className="tpl-card__desc">{tpl.description}</div>
                        <div className="tpl-card__meta">Updated {tpl.updated}</div>
                      </div>
                      <span className="tpl-card__check" aria-hidden="true">
                        {isSel && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                    </button>);

              })}
              </div>
            </div>
          }

          {/* ── Blank mode (existing flow) ── */}
          {(isClone || creationMode === "blank") &&
          <>
              <div className="field">
                <label>Behavior</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                { id: false, label: "Standard page", hint: "Show a TapIn page with content" },
                { id: true, label: "URL redirect", hint: "Send taps straight to a URL" }].
                map((opt) =>
                <button
                  key={String(opt.id)}
                  type="button"
                  className="exp-behavior"
                  data-active={redirectOnly === opt.id}
                  onClick={() => setRedirectOnly(opt.id)}>
                    
                      <div className="exp-behavior__title">{opt.label}</div>
                      <div className="exp-behavior__hint">{opt.hint}</div>
                    </button>
                )}
                </div>
              </div>

              {redirectOnly ?
            <div className="field">
                  <label>Destination URL *</label>
                  <input
                type="url"
                placeholder="https://example.com/landing"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)} />
                
                  <p className="card-subtitle" style={{ margin: "6px 0 0" }}>Visitors who tap will be sent directly to this URL. No other settings needed.</p>
                </div> :

            <>
                  <div className="exp-config-row" style={{ borderTop: 0, padding: 0 }}>
                    <div className="exp-config-row__text">
                      <div className="exp-config-row__title">Require login</div>
                      <div className="exp-config-row__hint">Visitors must sign in before viewing</div>
                    </div>
                    <button className={"toggle" + (requireLogin ? " on" : "")} onClick={() => setRequireLogin((v) => !v)} />
                  </div>
                </>
            }
            </>
          }
        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose} disabled={!!busy}>Cancel</button>
          <button
            className="btn btn--primary"
            style={(canSubmit && !busy) ? null : { opacity: 0.5, pointerEvents: "none" }}
            onClick={handleSubmit}>
            {creationMode === "ai" ? "Generate experience" : creationMode === "template" ? "Use template" : "Create"}
          </button>
        </div>
        {busy && (
          <div className="create-exp-busy" role="status" aria-live="polite">
            <div className="create-exp-busy__panel">
              <div className="create-exp-busy__visual">
                {busy === "ai" ? (
                  <div className="create-exp-busy__ai">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2.5L13.6 9.2C13.85 10.25 14.7 11.06 15.76 11.27L22 12.5L15.76 13.73C14.7 13.94 13.85 14.75 13.6 15.8L12 22.5L10.4 15.8C10.15 14.75 9.3 13.94 8.24 13.73L2 12.5L8.24 11.27C9.3 11.06 10.15 10.25 10.4 9.2L12 2.5Z" fill="currentColor"/>
                    </svg>
                    <span className="create-exp-busy__spark create-exp-busy__spark--a" />
                    <span className="create-exp-busy__spark create-exp-busy__spark--b" />
                    <span className="create-exp-busy__spark create-exp-busy__spark--c" />
                  </div>
                ) : (
                  <div className="create-exp-busy__spinner" aria-hidden="true">
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                      <circle cx="28" cy="28" r="22" stroke="rgba(0,125,249,0.18)" strokeWidth="4"/>
                      <circle cx="28" cy="28" r="22" stroke="var(--tapin-blue)" strokeWidth="4" strokeLinecap="round" strokeDasharray="38 200"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="create-exp-busy__title">
                {busy === "ai" ? "Generating experience…" : "Opening experience builder…"}
              </div>
              <div className="create-exp-busy__sub">
                {busy === "ai" ? (() => {
                  let host = "the page";
                  try {
                    const u = aiUrl && aiUrl.trim();
                    if (u) host = new URL(u.startsWith("http") ? u : "https://" + u).hostname;
                  } catch (e) { host = "the page"; }
                  return `Reading ${host} and drafting sections, copy${aiInclude.images ? ", and imagery" : ""}.`;
                })()
                  : busy === "template"
                  ? "Cloning the saved layout and preparing the editor."
                  : "Setting up a blank canvas and routing the new experience."}
              </div>
              <div className="create-exp-busy__steps">
                <BusyStep label={busy === "ai" ? "Analyzing source" : "Creating record"} delay={0} />
                <BusyStep label={busy === "ai" ? "Drafting sections" : busy === "template" ? "Applying template" : "Configuring defaults"} delay={900} />
                <BusyStep label="Loading builder" delay={1900} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

}

// ============================================================
// Invite User (modal)
// ============================================================
function InviteUserModal({ spaces, onClose }) {
  const [firstName, setFirstName] = useState2("");
  const [lastName, setLastName] = useState2("");
  const [displayName, setDisplayName] = useState2("");
  const [email, setEmail] = useState2("");
  const [role, setRole] = useState2("Space Admin");
  const [status, setStatus] = useState2("Active");
  const [selectedSpaces, setSelectedSpaces] = useState2([]);
  const [canOrderRaw, setCanOrder] = useState2(false);
  const canOrder = role === "Organization Admin" ? true : canOrderRaw;
  const [roleOpen, setRoleOpen] = useState2(false);
  const [spacesOpen, setSpacesOpen] = useState2(false);

  const roleOptions = ["Organization Admin", "Space Admin"];

  const toggleSpace = (sid) => {
    setSelectedSpaces(selectedSpaces.includes(sid) ? selectedSpaces.filter((x) => x !== sid) : [...selectedSpaces, sid]);
  };

  const canSubmit = firstName.trim() && lastName.trim() && email.trim();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn btn--icon" onClick={onClose} aria-label="Back" style={{ transform: "rotate(90deg)" }}><Icon.Caret /></button>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Invite User</h3>
              <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Send an invitation with role and space access</p>
            </div>
          </div>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field"><label>First name *</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" /></div>
            <div className="field"><label>Last name *</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" /></div>
          </div>
          <div className="field"><label>Display name</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Auto-generated if blank" /></div>
          <div className="field"><label>Email *</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@example.com" /></div>
          {window.__viewerRole === "Space Admin" ?
          <div className="field" style={{ position: "relative" }}>
            <label>Role</label>
            <input
              value={role}
              readOnly
              disabled
              style={{ background: "var(--offwhite, #F7F9FC)", cursor: "not-allowed", color: "var(--ink-700)" }} />
            
          </div> :

          <div className="field" style={{ position: "relative" }}>
            <label>Role</label>
            <div className="select" onClick={() => setRoleOpen(!roleOpen)}>
              <span>{role}</span>
              <Icon.Caret />
            </div>
            {roleOpen &&
            <div className="dropdown-menu" style={{ position: "relative", top: 0, left: 0, right: 0, marginTop: 6, minWidth: "auto", boxShadow: "0 6px 18px rgba(0,13,50,0.10)" }}>
                {roleOptions.map((r) =>
              <div
                key={r}
                className={"item" + (r === role ? " is-selected" : "")}
                onClick={() => {setRole(r);setRoleOpen(false);}}>
                
                    <span style={{ flex: 1 }}>{r}</span>
                  </div>
              )}
              </div>
            }
          </div>
          }
          <div className="field">
            <label>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Active", "Inactive"].map((s) =>
              <button
                key={s}
                className={"btn btn--sm" + (status === s ? " btn--primary" : "")}
                style={{ flex: 1 }}
                onClick={() => setStatus(s)}>
                {s}</button>
              )}
            </div>
          </div>
          <div className="field">
            <label>Permissions</label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, background: role === "Space Admin" ? "#fff" : "var(--offwhite, #F7F9FC)", cursor: role !== "Space Admin" ? "not-allowed" : "pointer" }}>
              <input type="checkbox" checked={canOrder} disabled={role !== "Space Admin"} onChange={(e) => setCanOrder(e.target.checked)} style={{ accentColor: "var(--tapin-blue)", width: 16, height: 16, margin: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Manage orders</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-600)", marginTop: 2 }}>{role === "Space Admin" ? "Allow this Space admin to place TapPoint orders for their spaces." : "Organization admins can already manage orders."}</div>
              </div>
            </label>
          </div>
          <div className="field" style={{ position: "relative" }}>
            <label>Spaces</label>
            <div className="select" onClick={() => setSpacesOpen(!spacesOpen)} style={{ minHeight: 40, height: "auto", padding: "6px 12px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {selectedSpaces.length === 0 && <span className="muted">Select spaces…</span>}
              {selectedSpaces.map((sid) => {
                const sp = spaces.find((s) => s.id === sid);
                if (!sp) return null;
                return (
                  <span key={sid} className="space-chip" onClick={(e) => {e.stopPropagation();toggleSpace(sid);}}>
                    <SpaceAvatar space={sp} size={16} />
                    <span>{sp.name}</span>
                    <span style={{ marginLeft: 4, fontWeight: 600 }}>×</span>
                  </span>);

              })}
              <Icon.Caret />
            </div>
            {spacesOpen &&
            <div className="dropdown-menu" style={{ position: "relative", top: 0, left: 0, right: 0, marginTop: 6, maxHeight: 220, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)" }}>
                {spaces.map((s) => {
                const on = selectedSpaces.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className={"item" + (on ? " is-selected" : "")}
                    style={{ display: "grid", gridTemplateColumns: "18px 22px 1fr", columnGap: 10, alignItems: "center", padding: "8px 12px", textAlign: "left", justifyContent: "flex-start", width: "100%" }}
                    onClick={() => toggleSpace(s.id)}>
                    
                      <input type="checkbox" checked={on} readOnly style={{ pointerEvents: "none", margin: 0, width: 16, height: 16, accentColor: "var(--tapin-blue)" }} />
                      <SpaceAvatar space={s} size={22} />
                      <span style={{ textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-800)" }}>{s.name}</span>
                    </div>);

              })}
              </div>
            }
          </div>
        </div>
        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className={"btn btn--primary" + (canSubmit ? "" : " is-disabled")} style={canSubmit ? null : { opacity: 0.5, pointerEvents: "none" }} onClick={onClose}>Send Invite</button>
        </div>
      </div>
    </div>);

}

// ============================================================
// Devices tab (inside ExperienceEditScreen)
// ============================================================
function DevicesTab({ exp, onToast }) {
  const [editingTp, setEditingTp] = useState2(null);
  const [activityTp, setActivityTp] = useState2(null);
  const [assignOpen, setAssignOpen] = useState2(false);
  const [, setRev] = useState2(0);
  const allSpaces = window.DATA.SPACES;
  const assigned = window.DATA.TAPPOINTS.filter((tp) => tp.experienceId === exp.id);
  const seed = exp.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i) => {const v = Math.sin(seed * 7919 + i * 6151) * 10000;return v - Math.floor(v);};
  const DEVICE_TYPES = ["Sticker", "Hub", "Card"];
  const typeTone = (t) => t === "Hub" ? { bg: "rgba(0,125,249,0.10)", fg: "var(--tapin-blue)" } :
  t === "Card" ? { bg: "rgba(138,82,234,0.14)", fg: "#7434c2" } :
  t === "Sticker" ? { bg: "rgba(46,160,67,0.14)", fg: "#1c8a36" } :
  { bg: "rgba(20,29,35,0.06)", fg: "var(--ink-700)" };
  const rows = assigned.map((tp, i) => {
    const isActive = tp.status === "Active";
    const taps = Math.max(0, Math.round(exp.taps * (0.18 + rand(i + 1) * 0.45)));
    const lastDays = Math.floor(rand(i + 5) * 6);
    const battery = isActive ? 60 + Math.floor(rand(i + 9) * 38) : Math.floor(rand(i + 9) * 30);
    const fw = "v2.4." + (3 + Math.floor(rand(i + 13) * 5));
    const deviceType = DEVICE_TYPES[Math.floor(rand(i + 17) * DEVICE_TYPES.length)];
    return { ...tp, taps, lastDays, battery, fw, isActive, deviceType };
  });
  const totalTaps = rows.reduce((a, r) => a + r.taps, 0);
  const activeCount = rows.filter((r) => r.isActive).length;
  const ago = (d) => d === 0 ? "just now" : d === 1 ? "yesterday" : d + "d ago";
  const saveTp = (updated) => {
    const target = window.DATA.TAPPOINTS.find((t) => t.id === updated.id);
    if (target) Object.assign(target, updated);
    setRev((r) => r + 1);
    setEditingTp(null);
    if (onToast) onToast("TapPoint updated");
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
        {[
        { label: "Devices assigned", value: rows.length },
        { label: "Active", value: activeCount, hint: activeCount === rows.length ? "All online" : rows.length - activeCount + " inactive" },
        { label: "Taps from these devices", value: totalTaps.toLocaleString(), hint: "this period" }].
        map((s, i) =>
        <div key={i} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--ink-900)", marginTop: 2 }}>{s.value}</div>
            {s.hint && <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 2 }}>{s.hint}</div>}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Assigned TapPoints</h3>
            <p className="card-subtitle">Devices currently routing taps to {exp.name}</p>
          </div>
          <button className="btn btn--primary btn--sm" onClick={() => setAssignOpen(true)}><Icon.Plus /> Assign TapPoint</button>
        </div>
        {rows.length === 0 ?
        <div style={{ padding: 48, textAlign: "center", color: "var(--ink-600)", fontSize: 13 }}>
            No TapPoints are assigned to this experience yet.
          </div> :

        <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>Name</th><th></th><th>Type</th><th>XUID</th><th>Status</th><th>Taps</th><th>Last tap</th></tr>
            </thead>
            <tbody>
              {rows.map((r) =>
            <tr key={r.id}>
                  <td><span className="link" style={{ cursor: "pointer", fontWeight: 600, color: "var(--ink-900)" }} onClick={() => setEditingTp(r)}>{r.name}</span></td>
                  <td>
                    <div className="row-actions row-actions--inline">
                      <button className="btn btn--xs row-action-btn" onClick={() => setEditingTp(r)}><Icon.Edit /> Edit</button>
                      <Dropdown trigger={<span>Actions</span>}>
                        <div className="item" onClick={() => setActivityTp(r)}>View activity</div>
                        <div
                      className={"item" + (r.isActive ? " is-destructive" : "")}
                      style={!r.isActive ? { color: "#0B6A00" } : null}
                      onClick={() => {
                        const target = window.DATA.TAPPOINTS.find((t) => t.id === r.id);
                        if (target) target.status = target.status === "Active" ? "Inactive" : "Active";
                        setRev((rev) => rev + 1);
                        if (onToast) onToast(target && target.status === "Active" ? r.name + " reactivated" : r.name + " deactivated");
                      }}>{r.isActive ? "Deactivate" : "Activate"}</div>
                      </Dropdown>
                    </div>
                  </td>
                  <td>{(() => {const tone = typeTone(r.deviceType);return <span className="pill" style={{ background: tone.bg, color: tone.fg, fontWeight: 600 }}>{r.deviceType}</span>;})()}</td>
                  <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "var(--ink-700, #475569)" }}>{r.xuid}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: r.isActive ? "#1E9C3A" : "#9CA3AF" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: r.isActive ? "#1E9C3A" : "#CBD5E1", boxShadow: r.isActive ? "0 0 0 3px rgba(30,156,58,0.18)" : "none" }}></span>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{r.taps.toLocaleString()}</td>
                  <td>{ago(r.lastDays)}</td>
                </tr>
            )}
            </tbody>
          </table>
        }
      </div>
      {editingTp &&
      <EditTapPointModal
        tp={editingTp}
        spaces={allSpaces}
        deviceType={editingTp.deviceType}
        typeTone={typeTone(editingTp.deviceType)}
        onSave={saveTp}
        onClose={() => setEditingTp(null)} />
      }
      {activityTp &&
      <TapPointActivityModal
        tp={activityTp}
        spaces={allSpaces}
        deviceType={activityTp.deviceType}
        typeTone={typeTone(activityTp.deviceType)}
        onClose={() => setActivityTp(null)} />
      }
      {assignOpen &&
      <AssignTapPointModal
        exp={exp}
        onCancel={() => setAssignOpen(false)}
        onConfirm={(tpId) => {
          const target = window.DATA.TAPPOINTS.find((t) => t.id === tpId);
          if (target) target.experienceId = exp.id;
          setRev((r) => r + 1);
          setAssignOpen(false);
          if (onToast) onToast((target ? target.name : "TapPoint") + " assigned to " + exp.name);
        }} />
      }
    </>);

}

// ============================================================
// Tap History tab (inside ExperienceEditScreen)
// ============================================================

// Small click-to-collapse chevron used in card headers.
// The whole header should be wrapped so clicks anywhere on it toggle —
// action controls inside should stop propagation.
function CardChevron({ open }) {
  return (
    <span className={"card-chev" + (open ? " is-open" : "")} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>);

}

function TapHistoryTab({ exp, period: periodProp }) {
  const [period, setPeriod] = useState2(periodProp || { kind: "28" });
  React.useEffect(() => {if (periodProp) setPeriod(periodProp);}, [periodProp && periodProp.kind, periodProp && periodProp.n, periodProp && periodProp.startISO, periodProp && periodProp.endISO]);
  const [frequency, setFrequency] = useState2("daily");
  const [visibleMetrics, setVisibleMetrics] = useState2({ taps: true, clicks: true });
  const toggleMetric = (k) => setVisibleMetrics((v) => ({ ...v, [k]: !v[k] }));
  const [viewingVisitor, setViewingVisitor] = useState2(null);
  const [perfOpen, setPerfOpen] = useState2(false);
  const [heatOpen, setHeatOpen] = useState2(false);
  const [tapsOpen, setTapsOpen] = useState2(false);
  const [interOpen, setInterOpen] = useState2(false);
  const [tapFilter, setTapFilter] = useState2("all"); // "all" | "identified" | "anonymous"
  const [actionFilter, setActionFilter] = useState2([]); // multi-select of action labels

  // Seeded sample data based on exp.id
  const seed = exp.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i) => {const v = Math.sin(seed * 9301 + i * 49297) * 10000;return v - Math.floor(v);};

  const rawSeries = window.seriesForPeriod(period, exp.spaceId);
  const { dates, values } = window.aggregateSeries(rawSeries, frequency);
  const totalTaps = values.reduce((a, b) => a + b, 0);
  const identifiedCount = Math.round(totalTaps * 0.34);
  const anonymousCount = totalTaps - identifiedCount;

  // Visitors (mix identified + anonymous)
  const NAMES = [
  ["Sarah Chen", "sarah.chen@example.com"],
  ["Marcus Williams", "m.williams@gmail.com"],
  ["Priya Patel", "priya.p@outlook.com"],
  ["Daniel Okafor", "d.okafor@example.org"],
  ["Emma Thompson", "emma.t@example.com"],
  ["Lucas Müller", "lucas.m@example.de"],
  ["Yuki Tanaka", "y.tanaka@example.jp"],
  ["Olivia Rossi", "o.rossi@example.it"],
  ["Aiden Wright", "aiden.w@example.com"],
  ["Zara Khan", "zara.k@example.co.uk"]];

  const spaceTps = window.DATA.TAPPOINTS.filter((tp) => tp.spaceId === exp.spaceId);
  const tpNameOptions = spaceTps.length > 0 ? spaceTps.map((tp) => tp.name) : ["TapPoint 1", "TapPoint 2", "TapPoint 3"];
  // Form rotation so identified visitors map to a real form on the experience
  const FORM_IDS = ["form-newsletter", "form-book-visit", "form-get-in-touch"];
  const FORM_TITLES = {
    "form-newsletter": "Newsletter signup",
    "form-book-visit": "Book a guided visit",
    "form-get-in-touch": "Get in touch"
  };
  const visitors = [];
  for (let i = 0; i < 12; i++) {
    const r = rand(i + 1);
    const isIdentified = r > 0.70;
    // A subset of identified visitors logged in BEFORE viewing the experience,
    // so we have their account + their past interactions across other experiences.
    const isLoggedIn = isIdentified && rand(i + 901) > 0.45;
    const name = isIdentified ? NAMES[i % NAMES.length][0] : null;
    const email = isIdentified ? NAMES[i % NAMES.length][1] : null;
    const daysAgo = Math.floor(rand(i + 11) * 27);
    // Anonymous visitors are single-visit (one tap) since we can't link separate sessions.
    const taps = isIdentified ? 1 + Math.floor(rand(i + 21) * 5) : 1;
    const firstAgo = daysAgo + Math.floor(rand(i + 31) * 4);
    // Build individual tap events for this visitor (newest → oldest)
    const tapEvents = [];
    for (let j = 0; j < taps; j++) {
      const spread = (firstAgo - daysAgo) * (j / Math.max(1, taps - 1));
      const dayOffset = daysAgo + spread;
      const dt = new Date(2026, 4, 22 - Math.floor(dayOffset), 9 + Math.floor(rand(i + j * 13 + 51) * 9), Math.floor(rand(i + j * 17 + 61) * 60));
      const deviceName = tpNameOptions[Math.floor(rand(i + j * 19 + 71) * tpNameOptions.length)];
      tapEvents.push({ dateTime: dt, deviceName });
    }
    tapEvents.sort((a, b) => b.dateTime - a.dateTime);
    const lastDeviceName = tapEvents[0] ? tapEvents[0].deviceName : tpNameOptions[0];
    const lastDateTime = tapEvents[0] ? tapEvents[0].dateTime : new Date(2026, 4, 22 - daysAgo);
    visitors.push({
      id: "v" + i,
      name,
      email,
      isIdentified,
      isLoggedIn,
      formId: isIdentified ? FORM_IDS[i % FORM_IDS.length] : null,
      formTitle: isIdentified ? FORM_TITLES[FORM_IDS[i % FORM_IDS.length]] : null,
      taps,
      interactions: 1 + Math.floor(rand(i + 81) * 8),
      timeSpent: 20 + Math.floor(rand(i + 91) * 220), // 20s..4m on the experience
      lastSeen: daysAgo,
      firstSeen: firstAgo,
      lastDateTime,
      lastDeviceName,
      tapEvents,
      source: isIdentified ? rand(i + 41) > 0.5 ? "Form: Newsletter" : "Form: Lead capture" : "—"
    });
  }
  visitors.sort((a, b) => b.lastDateTime - a.lastDateTime);

  // Interactions — one row per element, with most-recent date/time
  const INTERACTIONS = [
  { action: "Watched video", element: "Roar of the Tyrannosaurus", detail: "vimeo.com/928374" },
  { action: "Played audio", element: "Curator commentary — Stegosaurus", detail: "2:14" },
  { action: "File download", element: "Educator-Guide.pdf", detail: "1.2 MB · PDF" },
  { action: "Link click", element: "Read the full story", detail: "nhm.ac.uk/discover/dinosaurs" },
  { action: "Donated", element: "Support our research", detail: "£10 average" },
  { action: "Flashcard click", element: "What did dinosaurs eat?", detail: null },
  { action: "Link click", element: "Plan your visit", detail: "nhm.ac.uk/visit" },
  { action: "File download", element: "Field-Notes-Worksheet.pdf", detail: "640 KB · PDF" },
  { action: "Watched video", element: "Inside the fossil lab", detail: "youtu.be/abc123" },
  { action: "Played audio", element: "Mary Anning narration", detail: "3:42" }];

  const ACTION_TONES = {
    "Watched video": { bg: "#EEF2FF", fg: "#4F46E5" },
    "Played audio": { bg: "#FDF2F8", fg: "#BE185D" },
    "File download": { bg: "#FEF3C7", fg: "#B45309" },
    "Link click": { bg: "#ECFDF5", fg: "#059669" },
    "Donated": { bg: "#FCE7F3", fg: "#A21CAF" },
    "Flashcard click": { bg: "#E0F2FE", fg: "#0369A1" }
  };
  const interactionsData = INTERACTIONS.map((it, i) => {
    const clicks = Math.max(1, Math.round(totalTaps * (0.04 + rand(i + 60) * 0.12)));
    const daysAgo = Math.floor(rand(i + 70) * 10);
    const dateTime = new Date(2026, 4, 22 - daysAgo, 9 + Math.floor(rand(i + 80) * 9), Math.floor(rand(i + 90) * 60));
    return { ...it, clicks, daysAgo, dateTime };
  }).sort((a, b) => b.dateTime - a.dateTime);

  const totalClicks = interactionsData.reduce((a, x) => a + x.clicks, 0);

  // Build per-visitor interaction events — one row per real action taken by
  // a specific visitor. Used by the Interactions table.
  const interactionEvents = (() => {
    const events = [];
    visitors.forEach((v, vi) => {
      for (let j = 0; j < v.interactions; j++) {
        const pickIdx = Math.floor(rand(vi * 31 + j * 7 + 101) * INTERACTIONS.length);
        const pick = INTERACTIONS[pickIdx];
        const offsetSec = 5 + Math.floor(rand(vi * 37 + j * 13 + 201) * 240);
        const dateTime = new Date(v.lastDateTime.getTime() + offsetSec * 1000);
        events.push({ ...pick, dateTime, visitor: v });
      }
    });
    events.sort((a, b) => b.dateTime - a.dateTime);
    return events;
  })();

  // ── Build the multi-series chart data: Taps, Avg. time on page, Clicks ──
  // Derive per-period clicks and avg time from per-period tap volume so they move together.
  const clicksSeries = values.map((v, i) => Math.max(0, Math.round(v * (0.55 + rand(i + 200) * 0.30))));
  // Avg time on page in seconds, varies 35–145s with mild correlation to traffic.
  const avgTimeSeries = values.map((v, i) => {
    const base = 60 + rand(i + 300) * 70;
    const lift = v > 0 ? Math.min(25, v * 0.6) : 0;
    return Math.round(base + lift);
  });

  const overallAvgTime = avgTimeSeries.length ?
  Math.round(avgTimeSeries.reduce((a, b) => a + b, 0) / avgTimeSeries.length) :
  0;
  const fmtTime = (s) => {
    const sec = Math.round(s || 0);
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return m > 0 ? m + "m " + r + "s" : r + "s";
  };

  const PERF_METRICS = [
  { key: "taps", label: "Taps", color: "#007DF9", axis: "left", fmt: (v) => Math.round(v).toLocaleString() },
  { key: "clicks", label: "Clicks", color: "#1c8a36", axis: "left", fmt: (v) => Math.round(v).toLocaleString() }];

  const perfData = { dates, taps: values, clicks: clicksSeries };
  const perfTotals = {
    taps: totalTaps.toLocaleString(),
    clicks: totalClicks.toLocaleString()
  };

  const ago = (d) => d === 0 ? "today" : d === 1 ? "yesterday" : d + "d ago";

  const InteractionIcon = ({ kind }) => {
    const bg = kind === "button" ? "#EEF2FF" : kind === "link" ? "#ECFDF5" : "#FEF3C7";
    const fg = kind === "button" ? "#4F46E5" : kind === "link" ? "#059669" : "#B45309";
    const path = kind === "button" ?
    <rect x="3" y="6" width="14" height="8" rx="2" stroke={fg} strokeWidth="1.5" fill="none" /> :
    kind === "link" ?
    <path d="M8 12a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1M12 8a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" stroke={fg} strokeWidth="1.5" fill="none" strokeLinecap="round" /> :
    <path d="M10 3v9m-3-3 3 3 3-3M4 14v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" stroke={fg} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    return (
      <span style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <svg width="20" height="20" viewBox="0 0 20 20">{path}</svg>
      </span>);

  };

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {(() => {
          const d1 = Math.round(rand(500) * 30 - 8);
          const d2 = Math.round(rand(501) * 28 - 10);
          const d3 = Math.round(rand(502) * 20 - 6);
          const d4 = Math.round(rand(503) * 18 - 8);
          const scrollDepth = 48 + Math.round(rand(504) * 30); // %
          const fmt = window.fmtDelta;
          const pctTxt = (n) => (n >= 0 ? "up " : "down ") + Math.abs(n) + "%";
          const expName = exp.name;
          const expInsights = {
            explains: {
              taps: `${expName} ${pctTxt(d1)} vs. the previous period — ${d1 >= 0 ? "consistent growth, suggesting placement is working." : "softening volume; check device status and signage."}`,
              clicks: `Clicks ${pctTxt(d2)}. Click-through ratio is ${(totalClicks / Math.max(1, totalTaps) * 100).toFixed(1)}% of taps — ${totalClicks / Math.max(1, totalTaps) > 0.4 ? "above the typical 30–40% range." : "in line with the typical 30–40% range."}`,
              avgTime: `Visitors spend ${fmtTime(overallAvgTime)} on average, ${pctTxt(d3)}. Sessions over 45s strongly correlate with form submissions.`,
              scrollDepth: `Average scroll depth is ${scrollDepth}%, ${d4 >= 0 ? "improving" : "slipping"} ${Math.abs(d4)}pp. ${scrollDepth < 60 ? "Consider tightening copy above the fold." : "Your content keeps visitors engaged through most of the page."}`
            }
          };
          const tiles = [
          { statKey: "taps", label: "Taps", value: totalTaps.toLocaleString(), delta: fmt(d1), icon: <Icon.TapHand />, kind: "green" },
          { statKey: "clicks", label: "Clicks", value: totalClicks.toLocaleString(), delta: fmt(d2), icon: <Icon.Trend />, kind: "blue" },
          { statKey: "avgTime", label: "Avg. time spent", value: fmtTime(overallAvgTime), delta: fmt(d3), icon: <Icon.Doc />, kind: "purple" },
          { statKey: "scrollDepth", label: "Avg. scroll depth", value: scrollDepth + "%", delta: fmt(d4, "pp"), icon: <Icon.Users />, kind: "orange" }];

          return tiles.map((s, i) => {
            const ExplainChip = window.ExplainChip;
            return (
              <div className="stat-card" key={i} style={{ position: "relative" }}>
              <span style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}>
                <ExplainChip statKey={s.statKey} insights={expInsights} />
              </span>
              <div className={"stat-icon stat-icon--" + s.kind}>{s.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="stat-label">{s.label}</p>
                <div className="stat-value">{s.value}<span className={"delta " + (String(s.delta).startsWith("-") ? "delta--down" : "delta--up")}>{s.delta}</span></div>
                <p className="stat-foot">vs. previous period</p>
              </div>
            </div>);

          });
        })()}
      </div>
      <div className="card taphist-card">
        <div className="taphist-card__head card-head--clickable" onClick={() => setPerfOpen((v) => !v)}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 2 }}>Tap Performance</h3>
            <p className="card-subtitle">{totalTaps.toLocaleString()} taps</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            <span className="report-range-chip report-range-chip--clickable" title="Date range for the data shown — click to expand" onClick={() => setPerfOpen((v) => !v)} role="button" tabIndex={0}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{window.formatRange(window.periodRange(period).startISO, window.periodRange(period).endISO)}</span>
            </span>
            {perfOpen && <FrequencyControl value={frequency} onChange={setFrequency} />}
            <span onClick={() => setPerfOpen((v) => !v)} style={{ cursor: "pointer" }}><CardChevron open={perfOpen} /></span>
          </div>
        </div>
        {perfOpen &&
        <>
            <div style={{ padding: "0 26px" }}>
              <LegendChips
              metrics={PERF_METRICS}
              visible={visibleMetrics}
              totals={perfTotals}
              onToggle={toggleMetric} />
            </div>
            <div className="taphist-card__chart" style={{ paddingTop: 6 }}>
              <MultiLineChart data={perfData} metrics={PERF_METRICS} visible={visibleMetrics} frequency={frequency} height={300} />
            </div>
          </>
        }
      </div>

      <ExperienceHeatmapCard exp={exp} title={exp.name} period={period} taps={totalTaps} clicks={totalClicks} collapsible open={heatOpen} onToggle={() => setHeatOpen((v) => !v)} />

      <div className="card" style={{ marginTop: 20, marginBottom: 18 }}>
        <div className="card-header card-head--clickable" onClick={() => setTapsOpen((v) => !v)}>
          <div>
            <h3 className="card-title">Taps in this experience</h3>
            <p className="card-subtitle">Every tap on this experience, grouped by visitor — most recent first</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <span className="report-range-chip report-range-chip--clickable" title="Date range for the data shown — click to expand" onClick={() => setTapsOpen((v) => !v)} role="button" tabIndex={0}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{window.formatRange(window.periodRange(period).startISO, window.periodRange(period).endISO)}</span>
            </span>
            {tapsOpen &&
            <div role="tablist" aria-label="Filter taps by visitor type" style={{
              display: "inline-flex",
              background: "rgba(20,29,35,0.06)",
              borderRadius: 8,
              padding: 3,
              gap: 2
            }}>
                {[
              { id: "all", label: "All", count: visitors.length },
              { id: "identified", label: "Identified", count: visitors.filter((v) => v.isIdentified).length },
              { id: "anonymous", label: "Anonymous", count: visitors.filter((v) => !v.isIdentified).length }].
              map((o) => {
                const active = tapFilter === o.id;
                return (
                  <button
                    key={o.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTapFilter(o.id)}
                    style={{
                      appearance: "none",
                      border: "none",
                      background: active ? "#fff" : "transparent",
                      color: active ? "var(--ink-900)" : "var(--ink-600)",
                      boxShadow: active ? "0 1px 2px rgba(11,27,51,0.10)" : "none",
                      fontWeight: 600,
                      fontSize: 12,
                      padding: "5px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}>
                    
                      {o.label}
                      <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: active ? "var(--tapin-blue)" : "var(--ink-500)",
                      background: active ? "rgba(0,125,249,0.10)" : "rgba(20,29,35,0.08)",
                      padding: "1px 6px",
                      borderRadius: 999,
                      minWidth: 16,
                      textAlign: "center"
                    }}>{o.count}</span>
                    </button>);

              })}
              </div>
            }
            {tapsOpen && <ExportButton />}
            <span onClick={() => setTapsOpen((v) => !v)} style={{ cursor: "pointer" }}><CardChevron open={tapsOpen} /></span>
          </div>
        </div>
        {tapsOpen && <TapsByVisitorTable
          visitors={tapFilter === "all" ? visitors : visitors.filter((v) => tapFilter === "identified" ? v.isIdentified : !v.isIdentified)}
          onView={setViewingVisitor} />
        }
      </div>
      {viewingVisitor &&
      <VisitorTapsModal visitor={viewingVisitor} exp={exp} expName={exp.name} onClose={() => setViewingVisitor(null)} />
      }

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header card-head--clickable" onClick={() => setInterOpen((v) => !v)}>
          <div>
            <h3 className="card-title">Interactions</h3>
            <p className="card-subtitle">In-experience actions visitors took — most recent first</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <span className="report-range-chip report-range-chip--clickable" title="Date range for the data shown — click to expand" onClick={() => setInterOpen((v) => !v)} role="button" tabIndex={0}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>{window.formatRange(window.periodRange(period).startISO, window.periodRange(period).endISO)}</span>
            </span>
            {interOpen &&
            <MultiSelect
              label="Action"
              allLabel="All actions"
              placeholder="Filter actions"
              options={Array.from(new Set(interactionEvents.map((d) => d.action))).map((a) => ({ id: a, label: a }))}
              values={actionFilter}
              onChange={setActionFilter} />

            }
            {interOpen && <ExportButton />}
            <span onClick={() => setInterOpen((v) => !v)} style={{ cursor: "pointer" }}><CardChevron open={interOpen} /></span>
          </div>
        </div>
        {interOpen && <InteractionsTable
          items={actionFilter.length === 0 ? interactionEvents : interactionEvents.filter((d) => actionFilter.includes(d.action))}
          actionTones={ACTION_TONES}
          onView={setViewingVisitor} />
        }
      </div>
    </>);

}

// ============================================================
// Forms tab (inside ExperienceEditScreen)
// ============================================================
const FORM_FIELD_TYPES = [
{ id: "name", label: "Name", glyph: "U" },
{ id: "email", label: "Email", glyph: "@" },
{ id: "phone", label: "Phone", glyph: "☎" },
{ id: "short", label: "Short text", glyph: "T" },
{ id: "long", label: "Long text", glyph: "¶" },
{ id: "select", label: "Dropdown", glyph: "▾" },
{ id: "checkbox", label: "Checkbox", glyph: "✓" },
{ id: "date", label: "Date", glyph: "📅" }];


function FormsTab({ exp, onToast }) {
  const storageKey = "tapin_form_" + exp.id;
  const [viewingForm, setViewingForm] = useState2(null);
  const defaultForms = [
  {
    id: "form-newsletter",
    title: "Newsletter signup",
    description: "Join " + exp.name + " for updates and exclusive content",
    submitLabel: "Sign up now",
    fields: [
    { id: "f1", type: "name", label: "Your name", required: true, placeholder: "Jane Doe" },
    { id: "f2", type: "email", label: "Email address", required: true, placeholder: "you@example.com" }]

  },
  {
    id: "form-book-visit",
    title: "Book a guided visit",
    description: "Reserve a slot with one of our hosts",
    submitLabel: "Request booking",
    fields: [
    { id: "f1", type: "name", label: "Full name", required: true, placeholder: "Alex Morgan" },
    { id: "f2", type: "email", label: "Email", required: true, placeholder: "you@example.com" },
    { id: "f3", type: "select", label: "Preferred date", required: true },
    { id: "f4", type: "long", label: "Anything we should know?", required: false }]

  },
  {
    id: "form-get-in-touch",
    title: "Get in touch",
    description: "Have a question about " + exp.name + "? We'll get back to you within one business day.",
    submitLabel: "Send message",
    fields: [
    { id: "f1", type: "text", label: "First name", required: true, placeholder: "Jane" },
    { id: "f2", type: "text", label: "Last name", required: true, placeholder: "Doe" },
    { id: "f3", type: "email", label: "Email address", required: true, placeholder: "you@company.com" },
    { id: "f4", type: "text", label: "Company name", required: false, placeholder: "Acme Inc." },
    { id: "f5", type: "long", label: "Message", required: false, placeholder: "Tell us what you'd like to know…" }]

  }];

  // IDs that earlier versions seeded but the current sample no longer ships.
  const REMOVED_DEFAULT_IDS = new Set(["form-feedback", "form-learn-more", "form-1"]);

  // Forwards-compat: previous version stored a single form object — convert it.
  // Drop forms whose IDs are in REMOVED_DEFAULT_IDS (so we can retire old samples),
  // dedupe by id, and merge in any defaultForms missing from the saved list.
  const [forms, setForms] = useState2(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultForms;
      let parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) parsed = [{ ...parsed, id: parsed.id || "form-1" }];
      // Drop retired defaults
      parsed = parsed.filter((f) => !REMOVED_DEFAULT_IDS.has(f.id));
      // Dedupe by id, keeping the first occurrence
      const seen = new Set();
      parsed = parsed.filter((f) => {if (seen.has(f.id)) return false;seen.add(f.id);return true;});
      // Merge in any new defaults
      const savedIds = new Set(parsed.map((f) => f.id));
      const missing = defaultForms.filter((f) => !savedIds.has(f.id));
      return missing.length ? [...parsed, ...missing] : parsed;
    } catch (e) {return defaultForms;}
  });
  React.useEffect(() => {
    try {localStorage.setItem(storageKey, JSON.stringify(forms));} catch (e) {}
  }, [forms, storageKey]);

  // Date range filter (locally scoped)
  const [range, setRange] = useState2({ kind: "all" });

  // Seeded submission counts per form, scaled by the period length
  const days = (() => {
    const r = window.periodRange(range);
    return Math.max(1, Math.round((new Date(r.endISO + "T00:00:00") - new Date(r.startISO + "T00:00:00")) / 86400000) + 1);
  })();
  const seed = exp.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const subForForm = (formId, idx) => {
    let h = (seed + idx * 9301 + formId.length * 49297) % 233280;
    const base = 4 + Math.floor(h / 233280 * 24);
    return Math.max(0, Math.round(base * (days / 28)));
  };

  const rows = forms.map((f, i) => ({
    ...f,
    submissions: subForForm(f.id, i),
    last: i === 0 ? "2h ago" : i === 1 ? "yesterday" : "last week"
  }));
  const totalSubs = rows.reduce((a, r) => a + r.submissions, 0);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Submissions in</span>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-600)" }}>{totalSubs.toLocaleString()} total submissions in this range</div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              Forms on this experience
              <span className="info-tip info-tip--below" tabIndex="0" aria-label="To edit any of these forms, open the experience builder from the Configure tab." style={{ fontWeight: 400 }}>
                <svg width="14" height="14" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5.6" stroke="currentColor" strokeWidth="1.1" fill="none" />
                  <circle cx="6.5" cy="3.7" r="0.85" fill="currentColor" />
                  <path d="M6.5 5.7v4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span className="info-tip__pop">To edit any of these forms, open the experience builder from the Configure tab.</span>
              </span>
            </h3>
            <p className="card-subtitle">Submissions roll up here. To edit any of these forms, open the experience builder.</p>
          </div>
        </div>
        <Paginator items={rows} defaultPerPage={10} perPageOptions={[10, 25, 50]} itemLabel="form">
          {(pageItems) =>
          <div>
              <table className="table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>Form name</th>
                    <th style={{ width: 160 }}>Form submissions</th>
                    <th style={{ width: 140 }}>Last submission</th>
                    <th style={{ width: 1 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 &&
                <tr><td colSpan="4"><div className="empty-row">No forms on this experience yet.</div></td></tr>
                }
                  {pageItems.map((f) =>
                <tr key={f.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{f.title}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{f.fields.length} {f.fields.length === 1 ? "field" : "fields"} · {f.description}</div>
                      </td>
                      <td className="muted">
                        {f.submissions.toLocaleString()}
                      </td>
                      <td className="muted">{f.submissions === 0 ? "—" : f.last}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn--xs" onClick={() => setViewingForm(f)}>View submissions</button>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </Paginator>
      </div>
      {viewingForm &&
      <FormSubmissionsModal
        form={viewingForm}
        exp={exp}
        onClose={() => setViewingForm(null)}
        onExport={() => onToast && onToast("Exported submissions for " + viewingForm.title)} />

      }
    </>);

}

// ============================================================
// Form submissions (modal) — view sample submissions for a form
// ============================================================
function FormSubmissionsModal({ form, exp, onClose, onExport }) {
  const seed = (exp.id + ":" + form.id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (i) => {const v = Math.sin(seed * 9301 + i * 49297) * 10000;return v - Math.floor(v);};
  const FIRST = ["Alex", "Jordan", "Sam", "Riley", "Casey", "Morgan", "Taylor", "Jamie", "Avery", "Robin", "Drew", "Quinn", "Reese", "Skylar", "Harper", "Logan", "Rowan", "Sage", "Emerson", "Hayden"];
  const LAST = ["Carter", "Patel", "Nguyen", "Garcia", "Chen", "Wright", "Hughes", "Rivera", "Bennett", "Kim", "Foster", "Reyes", "Walker", "Adams", "Lee", "Brooks", "Cole", "Hayes", "Lane", "Ward"];
  const INTERESTS = ["General visit", "School group", "Birthday party", "Corporate event", "Private tour", "Membership info", "Volunteering", "Press / media"];
  const RATINGS = ["5 — Loved it", "4 — Liked it", "5 — Loved it", "5 — Loved it", "3 — It was OK", "4 — Liked it"];
  const COMMENTS = [
  "Loved the interactive parts — kids didn't want to leave.",
  "Great staff, very helpful.",
  "Would come again next month.",
  "A little crowded mid-afternoon, otherwise excellent.",
  "Wish there was more seating around the central hall.",
  "Best museum visit we've had this year.",
  "Easy to find, clear signage, fun for the whole family.",
  "",
  "The QR experience was a nice surprise.",
  "Could use better wifi but content was great."];

  const DATE_FMT = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const count = Math.max(0, form.submissions || 0);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[Math.floor(rand(i * 3 + 1) * FIRST.length)];
    const last = LAST[Math.floor(rand(i * 3 + 2) * LAST.length)];
    const offsetDays = Math.floor(rand(i * 3 + 3) * 28);
    const row = { i, offsetDays, submitted: DATE_FMT(offsetDays), values: {} };
    form.fields.forEach((field, fi) => {
      const r = rand(i * 7 + fi + 5);
      if (field.type === "name") row.values[field.id] = first + " " + last;else
      if (field.type === "text") {
        if (/first/i.test(field.label)) row.values[field.id] = first;else
        if (/last|surname/i.test(field.label)) row.values[field.id] = last;else
        if (/company|organi[sz]ation/i.test(field.label)) {
          const COMPANIES = ["Acme Inc.", "Northwind", "Globex", "Initech", "Umbrella", "Stark Industries", "Wayne Enterprises", "Soylent Corp", "Vandelay Industries", "Hooli", "Pied Piper"];
          row.values[field.id] = COMPANIES[Math.floor(r * COMPANIES.length)];
        } else row.values[field.id] = first;
      } else
      if (field.type === "email") row.values[field.id] = (first + "." + last).toLowerCase() + "@example.com";else
      if (field.type === "long") row.values[field.id] = COMMENTS[Math.floor(r * COMMENTS.length)];else
      if (field.type === "select") {
        const pool = /interested|interest/i.test(field.label) ? INTERESTS :
        /rate|rating/i.test(field.label) ? RATINGS :
        /date/i.test(field.label) ? ["Sat, Jun 6", "Sun, Jun 14", "Sat, Jun 20", "Sun, Jun 28", "Sat, Jul 4"] :
        INTERESTS;
        row.values[field.id] = pool[Math.floor(r * pool.length)];
      } else row.values[field.id] = "—";
    });
    rows.push(row);
  }

  const [search, setSearch] = useState2("");
  const [sortDir, setSortDir] = useState2("desc"); // newest first
  const [selected, setSelected] = useState2(() => new Set());
  const [deletedIds, setDeletedIds] = useState2(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState2(false);

  const liveRows = rows.filter((r) => !deletedIds.has(r.i));
  const matched = liveRows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r.values).some((v) => String(v).toLowerCase().includes(q)) || r.submitted.toLowerCase().includes(q);
  });
  const filtered = matched.slice().sort((a, b) =>
  sortDir === "desc" ? a.offsetDays - b.offsetDays : b.offsetDays - a.offsetDays
  );

  const toggleSelect = (i) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i);else next.add(i);
    return next;
  });
  const visibleIds = filtered.map((r) => r.i);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((i) => selected.has(i));
  const someVisibleSelected = visibleIds.some((i) => selected.has(i));
  const toggleSelectAll = () => setSelected((prev) => {
    if (allVisibleSelected) {
      const next = new Set(prev);
      visibleIds.forEach((i) => next.delete(i));
      return next;
    }
    const next = new Set(prev);
    visibleIds.forEach((i) => next.add(i));
    return next;
  });
  const confirmDelete = () => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      selected.forEach((i) => next.add(i));
      return next;
    });
    const n = selected.size;
    setSelected(new Set());
    setConfirmOpen(false);
    onExport && false; // no-op
    if (typeof window !== "undefined" && window.__tapinToast) {
      window.__tapinToast(`Deleted ${n} ${n === 1 ? "submission" : "submissions"}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>{form.title}</h3>
            <p className="card-subtitle" style={{ margin: "2px 0 0" }}>
              {count.toLocaleString()} {count === 1 ? "submission" : "submissions"}{form.last && form.last !== "—" ? <> · Last on {form.last}</> : null}
            </p>
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body">
          {count === 0 ?
          <div className="empty-row" style={{ padding: 60, textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 6px" }}>No submissions yet</p>
              <p style={{ fontSize: 12, color: "var(--ink-600)", margin: 0 }}>Once visitors start filling out this form, their responses will appear here.</p>
            </div> :

          <>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <div className="input-search" style={{ flex: 1 }}>
                  <span className="icon-search"><Icon.Search /></span>
                  <input placeholder="Search submissions" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {selected.size > 0 &&
              <button
                type="button"
                className="btn"
                onClick={() => setConfirmOpen(true)}
                style={{
                  background: "var(--red-bg-soft, #FBE2E2)",
                  color: "var(--red-text-soft, #B12C2C)",
                  borderColor: "transparent",
                  fontWeight: 600
                }}>
                
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6 }} aria-hidden="true">
                      <path d="M2 3.5h9M5 1.5h3M3.5 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete {selected.size} selected
                  </button>
              }
                <ExportButton tooltip="Download submissions" />
              </div>
              <Paginator items={filtered} defaultPerPage={10} perPageOptions={[10, 25, 50]} itemLabel="submission">
                {(pageItems) =>
              <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--line)" }}>
                    <table className="subtable">
                      <thead>
                        <tr>
                          <th style={{ width: 36, paddingRight: 0 }}>
                            <input
                          type="checkbox"
                          aria-label={allVisibleSelected ? "Deselect all" : "Select all"}
                          checked={allVisibleSelected}
                          ref={(el) => {if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;}}
                          onChange={toggleSelectAll}
                          style={{ accentColor: "var(--tapin-blue)", width: 14, height: 14, cursor: "pointer" }} />
                        
                          </th>
                          <th
                        onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
                        style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                        aria-sort={sortDir === "desc" ? "descending" : "ascending"}>
                        
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              Submitted
                              <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 0.7, fontSize: 9, color: "var(--tapin-blue)" }}>
                                <span style={{ opacity: sortDir === "asc" ? 1 : 0.30 }}>▲</span>
                                <span style={{ opacity: sortDir === "desc" ? 1 : 0.30 }}>▼</span>
                              </span>
                            </span>
                          </th>
                          {form.fields.map((field) =>
                      <th key={field.id}>{field.label}</th>
                      )}
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.length === 0 &&
                    <tr><td colSpan={2 + form.fields.length} className="empty-row" style={{ textAlign: "center", padding: 24 }}>No submissions match your search.</td></tr>
                    }
                        {pageItems.map((r) =>
                    <tr key={r.i} className={selected.has(r.i) ? "is-selected" : ""}>
                            <td style={{ width: 36, paddingRight: 0 }}>
                              <input
                          type="checkbox"
                          aria-label="Select submission"
                          checked={selected.has(r.i)}
                          onChange={() => toggleSelect(r.i)}
                          style={{ accentColor: "var(--tapin-blue)", width: 14, height: 14, cursor: "pointer" }} />
                        
                            </td>
                            <td className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{r.submitted}</td>
                            {form.fields.map((field) => {
                        const val = r.values[field.id] || "—";
                        const isLong = field.type === "long";
                        return (
                          <td key={field.id} style={{ maxWidth: isLong ? 280 : 200, whiteSpace: isLong ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={val}>
                                  {val}
                                </td>);

                      })}
                          </tr>
                    )}
                      </tbody>
                    </table>
                  </div>
              }
              </Paginator>
            </>
          }
        </div>
      </div>
      {confirmOpen &&
      <div
        className="modal-overlay"
        onClick={() => setConfirmOpen(false)}
        style={{ zIndex: 1100, background: "rgba(11,27,51,0.55)" }}>
        
          <div
          className="modal"
          style={{ width: 420 }}
          onClick={(e) => e.stopPropagation()}>
          
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--red-bg-soft, #FBE2E2)",
                color: "var(--red-text-soft, #B12C2C)",
                display: "inline-flex", alignItems: "center", justifyContent: "center"
              }}>
                  <svg width="18" height="18" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M2 3.5h9M5 1.5h3M3.5 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>Delete {selected.size} {selected.size === 1 ? "submission" : "submissions"}?</h3>
                  <p className="card-subtitle" style={{ margin: "2px 0 0" }}>This can't be undone.</p>
                </div>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: "var(--ink-700)", margin: 0, lineHeight: 1.55 }}>
                The selected {selected.size === 1 ? "submission" : "submissions"} will be permanently removed from <strong>{form.title}</strong>. Visitor data and any uploaded attachments will also be deleted.
              </p>
            </div>
            <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button
              className="btn"
              onClick={confirmDelete}
              style={{
                background: "var(--red-text-soft, #B12C2C)",
                color: "#fff",
                borderColor: "transparent",
                fontWeight: 600
              }}>
              
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}

// ============================================================
// Taps-by-visitor table (inside TapHistoryTab card)
// ============================================================
function TapsByVisitorTable({ visitors, onView }) {
  const enriched = visitors.map((v) => ({
    ...v,
    _visitorSort: v.isIdentified ? v.name.toLowerCase() : "zz_" + v.id
  }));
  const sortable = useSortableData(enriched, "lastDateTime", "desc");
  const fmtDateTime = (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const ago = (d) => d === 0 ? "today" : d === 1 ? "yesterday" : d + "d ago";
  const fmtSecs = (s) => {
    const sec = Math.round(s || 0);
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  return (
    <Paginator items={sortable.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50, 100]} itemLabel="visitor">
      {(pageItems) =>
      <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <SortTh columnKey="lastDateTime" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Date / Time</SortTh>
              <SortTh columnKey="_visitorSort" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Visitor</SortTh>
              <SortTh columnKey="lastDeviceName" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Device name</SortTh>
              <SortTh columnKey="timeSpent" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Time spent</SortTh>
              <SortTh columnKey="interactions" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Interactions</SortTh>
              <SortTh columnKey="formTitle" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Form submitted</SortTh>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((v) =>
          <tr key={v.id}>
                <td className="nowrap">{fmtDateTime(v.lastDateTime)}</td>
                <td>
                  {v.isIdentified ?
              <div>
                      <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{v.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-600)" }}>{v.email}</div>
                    </div> :

              <span style={{ color: "var(--ink-600)", fontStyle: "italic" }}>Anonymous visitor</span>
              }
                </td>
                <td>{v.lastDeviceName}</td>
                <td className="muted nowrap">{fmtSecs(v.timeSpent)}</td>
                <td>{v.interactions}</td>
                <td>
                  <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                    {v.isLoggedIn && (
                      <span className="pill pill--purple" style={{ fontSize: 11, gap: 4, padding: "2px 8px" }} title="Signed in before viewing — past interactions available">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                          <rect x="2.25" y="5" width="7.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/>
                        </svg>
                        Logged in
                      </span>
                    )}
                    {v.formTitle ? <span className="pill pill--soft-strong" style={{ fontSize: 11 }}>{v.formTitle}</span> : (!v.isLoggedIn && <span style={{ color: "var(--ink-400, #CBD5E1)" }}>—</span>)}
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn--xs" onClick={() => onView && onView(v)}>View</button>
                </td>
              </tr>
          )}
          </tbody>
        </table>
      }
    </Paginator>);

}

// ============================================================
// Interactions table (inside TapHistoryTab card)
// ============================================================
function InteractionsTable({ items, actionTones, onView }) {
  const enriched = items.map((it) => ({
    ...it,
    _visitorSort: it.visitor ? it.visitor.isIdentified ? it.visitor.name.toLowerCase() : "zz_" + it.visitor.id : "zz"
  }));
  const sortable = useSortableData(enriched, "dateTime", "desc");
  const fmtDateTime = (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <Paginator items={sortable.sorted} defaultPerPage={10} perPageOptions={[10, 25, 50, 100]} itemLabel="interaction">
      {(pageItems) =>
      <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <SortTh columnKey="dateTime" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Date / Time</SortTh>
              <SortTh columnKey="action" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Action</SortTh>
              <SortTh columnKey="element" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Element</SortTh>
              <SortTh columnKey="_visitorSort" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Visitor</SortTh>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((it, i) => {
            const tone = actionTones[it.action] || { bg: "rgba(20,29,35,0.06)", fg: "var(--ink-700)" };
            const v = it.visitor;
            return (
              <tr key={i}>
                <td className="nowrap">{fmtDateTime(it.dateTime)}</td>
                <td><span className="pill" style={{ background: tone.bg, color: tone.fg, fontWeight: 600 }}>{it.action}</span></td>
                <td>
                  <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{it.element}</div>
                  {it.detail && <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 2 }}>{it.detail}</div>}
                </td>
                <td>
                  {v ? v.isIdentified ?
                  <div>
                      <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{v.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-600)" }}>{v.email}</div>
                    </div> :

                  <span style={{ color: "var(--ink-600)", fontStyle: "italic" }}>Anonymous visitor</span> :
                  <span style={{ color: "var(--ink-400, #CBD5E1)" }}>—</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  {v ? <button className="btn btn--xs" onClick={() => onView && onView(v)}>View</button> : null}
                </td>
              </tr>);

          })}
          </tbody>
        </table>
      }
    </Paginator>);

}

// ============================================================
// Visitor taps modal — shows individual taps for one identified visitor
// ============================================================
function VisitorTapsModal({ visitor, exp, expName, onClose }) {
  const fmt = (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const fmtSecs = (s) => {
    const sec = Math.round(s || 0);
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };
  const [enriched, setEnriched] = useState2(false);
  const [enriching, setEnriching] = useState2(false);
  const [aiOpen, setAiOpen] = useState2(false);
  const AISparkle = window.AISparkle;
  const enrich = () => {
    setEnriching(true);
    setTimeout(() => {setEnriching(false);setEnriched(true);}, 900);
  };
  // Seeded "form data the visitor submitted" derived from their id so it's stable.
  const seedV = (visitor.id || "v").split("").reduce((a, c) => a + c.charCodeAt(0), 5);
  let sv = seedV;
  const nextV = () => {sv = (sv * 9301 + 49297) % 233280;return sv / 233280;};

  // Load this experience's actual forms (matches FormsTab) — falls back
  // to a generic set if exp isn't provided.
  const formsForExp = (() => {
    const expName2 = exp && exp.name || expName || "this experience";
    const defaults = [
    { id: "form-newsletter", title: "Newsletter signup", fields: [
      { id: "f1", type: "name", label: "Your name" },
      { id: "f2", type: "email", label: "Email address" }]
    },
    { id: "form-book-visit", title: "Book a guided visit", fields: [
      { id: "f1", type: "name", label: "Full name" },
      { id: "f2", type: "email", label: "Email" },
      { id: "f3", type: "select", label: "Preferred date" },
      { id: "f4", type: "long", label: "Anything we should know?" }]
    },
    { id: "form-get-in-touch", title: "Get in touch", fields: [
      { id: "f1", type: "text", label: "First name" },
      { id: "f2", type: "text", label: "Last name" },
      { id: "f3", type: "email", label: "Email address" },
      { id: "f4", type: "text", label: "Company name" },
      { id: "f5", type: "long", label: "Message" }]
    }];

    if (!exp) return defaults;
    try {
      const raw = localStorage.getItem("tapin_form_" + exp.id);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr.length ? arr : defaults;
    } catch (e) {return defaults;}
  })();
  const form = visitor.formId && formsForExp.find((f) => f.id === visitor.formId) || formsForExp[Math.floor(nextV() * formsForExp.length)];
  const formName = form.title || "Form submission";

  // Build per-field values matching the form schema.
  const firstName = visitor.name ? visitor.name.split(" ")[0] : "Jane";
  const lastName = visitor.name ? visitor.name.split(" ").slice(1).join(" ") || "Doe" : "Doe";
  const COMPANIES = ["Acme Inc.", "Northwind", "Globex", "Initech", "Umbrella", "Stark Industries"];
  const DATES = ["Sat, Jun 6", "Sun, Jun 14", "Sat, Jun 20", "Sun, Jun 28", "Sat, Jul 4"];
  const PICKS = ["General visit", "School group", "Birthday party", "Corporate event", "Membership info"];
  const MESSAGES = [
  "Loved the experience — would come again next month.",
  "A little crowded mid-afternoon, otherwise excellent.",
  "Wish there was more seating around the central hall.",
  "The QR experience was a nice surprise."];

  const valueFor = (field) => {
    const r = nextV();
    switch (field.type) {
      case "name":return visitor.name || firstName + " " + lastName;
      case "email":return visitor.email || (firstName + "." + lastName).toLowerCase() + "@example.com";
      case "long":return MESSAGES[Math.floor(r * MESSAGES.length)];
      case "select":return /date/i.test(field.label) ? DATES[Math.floor(r * DATES.length)] : PICKS[Math.floor(r * PICKS.length)];
      case "text":
        if (/first/i.test(field.label)) return firstName;
        if (/last|surname/i.test(field.label)) return lastName;
        if (/company|organi[sz]ation/i.test(field.label)) return COMPANIES[Math.floor(r * COMPANIES.length)];
        return firstName;
      default:return "—";
    }
  };
  const submitted = form.fields.map((f) => ({ label: f.label, value: valueFor(f), type: f.type }));
  const submittedAt = visitor.tapEvents && visitor.tapEvents[visitor.tapEvents.length - 1] ?
  visitor.tapEvents[visitor.tapEvents.length - 1].dateTime :
  visitor.lastDateTime;
  const enrichedData = [
  { label: "Location", value: ["London, UK", "Brighton, UK", "Manchester, UK", "Edinburgh, UK"][Math.floor(nextV() * 4)] },
  { label: "Estimated age", value: ["18–24", "25–34", "35–44", "45–54", "55+"][Math.floor(nextV() * 5)] },
  { label: "Likely interest", value: ["Natural history", "Family activities", "Education", "Photography"][Math.floor(nextV() * 4)] },
  { label: "Social signal", value: nextV() > 0.5 ? "Active on Instagram" : "Active on LinkedIn" }];

  React.useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") onClose();};
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {visitor.isIdentified ?
            <span className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{visitor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span> :

            <span className="avatar" style={{ width: 36, height: 36, background: "rgba(20,29,35,0.08)", color: "var(--ink-600)" }} aria-label="Anonymous visitor">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.7-8 6v2h16v-2c0-3.3-3.6-6-8-6Z" opacity="0.6" />
                </svg>
              </span>
            }
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                {visitor.isIdentified ? visitor.name : <span style={{ fontStyle: "italic", color: "var(--ink-700)" }}>Anonymous visitor</span>}
              </h3>
              <p className="card-subtitle" style={{ margin: "2px 0 0" }}>
                {visitor.isIdentified ? <>{visitor.email} · </> : null}{visitor.interactions} {visitor.interactions === 1 ? "interaction" : "interactions"} on {expName}
              </p>
            </div>
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body">
          {(() => {
            // Compute visitor-specific AI insights
            const t = visitor.timeSpent || 0;
            const ints = visitor.interactions || 0;
            const id = visitor.isIdentified;
            const fid = visitor.formId;
            let intentLevel = "Casual";
            if (id && (fid === "form-get-in-touch" || fid === "form-book-visit") || t > 90 && ints >= 4) intentLevel = "High";else
            if (t > 45 || ints >= 3 || id) intentLevel = "Engaged";

            const intent = [];
            if (id && fid === "form-get-in-touch") {
              intent.push({ kind: "up", text: "Highest-intent signal — visitor used the 'Get in touch' form, explicitly asking to be contacted." });
            } else if (id && fid === "form-book-visit") {
              intent.push({ kind: "up", text: "Strong intent — visitor booked a guided visit, a high-commitment action." });
            } else if (id && fid === "form-newsletter") {
              intent.push({ kind: "neutral", text: "Passive interest — newsletter signup indicates curiosity but no immediate buying intent." });
            } else {
              intent.push({ kind: "neutral", text: "Anonymous tap — visitor engaged with the experience but did not identify themselves." });
            }
            if (t > 90) intent.push({ kind: "up", text: `${fmtSecs(t)} on the experience — well above the typical 45s engaged session.` });else
            if (t < 30) intent.push({ kind: "down", text: `Only ${fmtSecs(t)} on the experience — short, low-commitment session.` });else
            intent.push({ kind: "neutral", text: `${fmtSecs(t)} on the experience — typical engaged session.` });
            if (ints >= 5) intent.push({ kind: "up", text: `${ints} interactions on a single visit — suggests deep exploration.` });else
            if (ints <= 2) intent.push({ kind: "down", text: `Only ${ints} interaction${ints === 1 ? "" : "s"} — visitor mostly skimmed.` });

            const actions = [];
            if (id && fid === "form-get-in-touch") {
              actions.push("Reach out within 1 hour — same-day response lifts qualified-meeting rate ~7×.");
              actions.push("Personalise outreach with the videos and sections they engaged with.");
            } else if (id && fid === "form-book-visit") {
              actions.push("Confirm the booking with a calendar invite and parking details.");
              actions.push("Send a 24-hour reminder with a related read to prime their visit.");
            } else if (id && fid === "form-newsletter") {
              actions.push("Add to the welcome nurture; lead with the most-watched video.");
              actions.push("Only trigger sales follow-up if they re-engage in the next 7 days.");
            } else if (!id && t > 60) {
              actions.push("Anonymous but engaged — show a low-friction lead capture (email-only) on their next tap.");
            } else {
              actions.push("No urgent follow-up — keep this visitor in standard nurture cadence.");
            }

            const improvements = [];
            if (ints >= 5 && t > 60) {
              improvements.push("Visitors who go this deep convert well — ensure your primary CTA sits above the average fold (~75%).");
            }
            if (t < 30) {
              improvements.push("Short sessions like this often mean the hook isn't landing — test a stronger headline or video preview at the top.");
            }
            if (fid === "form-get-in-touch" && t < 60) {
              improvements.push("They submitted a high-intent form quickly — consider shortening the form to reduce friction further.");
            }
            if (!id && ints >= 4) {
              improvements.push("Deeply engaged but anonymous — add a soft email capture after key interactions to convert intent into a lead.");
            }
            if (improvements.length === 0) {
              improvements.push("No specific tweaks suggested — this visitor's path looks healthy.");
            }

            const Bullet = ({ kind, text }) =>
            <li className={"ai-panel-bullet" + (kind === "up" ? " ai-panel-bullet--up" : kind === "down" ? " ai-panel-bullet--down" : "")}>
                <span className="ai-panel-bullet-dot" />
                <span className="ai-panel-bullet-text">{text}</span>
              </li>;


            return (
              <div className={"ai-panel" + (aiOpen ? " ai-panel--open" : " ai-panel--closed")} style={{ marginBottom: 16 }}>
                <button type="button" className="ai-panel-head" onClick={() => setAiOpen((v) => !v)} aria-expanded={aiOpen}>
                  <span className="ai-panel-title">
                    <span className="ai-panel-mark"><AISparkle size={12} color="#fff" /></span>
                    <h3>AI insights on this visitor</h3>
                    <span className="ai-panel-count" style={{ background: intentLevel === "High" ? "rgba(11,106,0,0.12)" : intentLevel === "Engaged" ? "rgba(0,125,249,0.14)" : "rgba(20,29,35,0.08)", color: intentLevel === "High" ? "#0B6A00" : intentLevel === "Engaged" ? "var(--tapin-blue)" : "var(--ink-700)" }}>
                      {intentLevel} intent
                    </span>
                  </span>
                  <span className="ai-panel-meta">
                    <span className="ai-panel-period">{actions.length + improvements.length} suggestions</span>
                    <span className={"ai-panel-chev" + (aiOpen ? " ai-panel-chev--open" : "")}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="m2.5 4 3.5 4 3.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </span>
                </button>
                {aiOpen &&
                <div className="ai-panel-scroll" style={{ padding: "16px 22px" }}>
                    <div className="ai-panel-section">
                      <p className="ai-panel-label">Intent assessment</p>
                      <ul className="ai-panel-bullets">
                        {intent.map((b, i) => <Bullet key={i} kind={b.kind} text={b.text} />)}
                      </ul>
                    </div>
                    <div className="ai-panel-section">
                      <p className="ai-panel-label">Suggested actions</p>
                      <ul className="ai-panel-bullets">
                        {actions.map((a, i) => <Bullet key={i} kind="neutral" text={a} />)}
                      </ul>
                    </div>
                    <div className="ai-panel-section">
                      <p className="ai-panel-label">Improvements for this experience</p>
                      <ul className="ai-panel-bullets">
                        {improvements.map((s, i) => <Bullet key={i} kind="neutral" text={s} />)}
                      </ul>
                    </div>
                  </div>
                }
              </div>);

          })()}
          {visitor.isIdentified ?
          <div className="visitor-form-card">
            <div className="visitor-form-card__head">
              <div>
                <div className="visitor-form-card__title">{formName}</div>
                <div className="visitor-form-card__sub">Submitted {fmt(submittedAt)}</div>
              </div>
              <button
                className={"visitor-enrich-btn" + (enriched ? " is-on" : "")}
                onClick={enrich}
                disabled={enriching || enriched}>
                
                {enriching ?
                <>
                    <svg className="visitor-enrich-btn__spinner" width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeDasharray="20 8" /></svg>
                    Enriching…
                  </> :
                enriched ?
                <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="m2 7 3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Enriched
                  </> :

                <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5 8.5 5.5 12.5 7 8.5 8.5 7 12.5 5.5 8.5 1.5 7 5.5 5.5Z" fill="currentColor" /></svg>
                    Enrich
                  </>
                }
              </button>
            </div>
            <div className="visitor-form-card__fields">
              {submitted.map((f, i) =>
              <div className="visitor-form-card__row" key={"s" + i}>
                  <span className="visitor-form-card__label">{f.label}</span>
                  <span className="visitor-form-card__value">{f.value}</span>
                </div>
              )}
              {enriched && enrichedData.map((f, i) =>
              <div className="visitor-form-card__row visitor-form-card__row--ai" key={"e" + i}>
                  <span className="visitor-form-card__label">
                    <span className="visitor-ai-pill">AI</span>
                    {f.label}
                  </span>
                  <span className="visitor-form-card__value">{f.value}</span>
                </div>
              )}
            </div>
          </div> :
          null}

          {visitor.isLoggedIn && (() => {
            // Past interactions across OTHER experiences — only available because
            // this visitor was logged in before they tapped this experience.
            const PAST_POOL = [
              { exp: "Stegosaurus exhibit", action: "Form submission", element: "Newsletter signup", daysAgo: 12 },
              { exp: "Tyrannosaurus rex", action: "Watched video", element: "Roar of the T-Rex (full)", daysAgo: 18 },
              { exp: "Mary Anning gallery", action: "File download", element: "Educator-Guide.pdf", daysAgo: 23 },
              { exp: "Curator's choice", action: "Link click", element: "Book a guided visit", daysAgo: 34 },
              { exp: "Fossil lab tour", action: "Played audio", element: "Curator commentary — Diplodocus", daysAgo: 41 },
              { exp: "Membership desk", action: "Donated", element: "Support our research", daysAgo: 56 },
            ];
            const seedP = (visitor.id || "v").split("").reduce((a, c) => a + c.charCodeAt(0), 23);
            let sp = seedP;
            const rp = () => { sp = (sp * 9301 + 49297) % 233280; return sp / 233280; };
            const rows = Math.max(2, Math.min(5, 2 + Math.floor(rp() * 4)));
            const past = Array.from({ length: rows }, (_, i) => {
              const pick = PAST_POOL[Math.floor(rp() * PAST_POOL.length)];
              return { ...pick, daysAgo: pick.daysAgo + Math.floor(rp() * 8) };
            }).sort((a, b) => a.daysAgo - b.daysAgo);
            return (
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-800)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Past interactions
                  </div>
                  <span className="pill pill--purple" style={{ fontSize: 10, padding: "2px 8px", gap: 4 }} title="Available because this visitor was logged in">
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                      <rect x="2.25" y="5" width="7.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/>
                    </svg>
                    Logged-in user
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ink-600)" }}>What this visitor did on other experiences before today</span>
                </div>
                <table className="table" style={{ marginBottom: 18 }}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Experience</th>
                      <th>Action</th>
                      <th>Element</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((p, i) => (
                      <tr key={i}>
                        <td className="nowrap" style={{ color: "var(--ink-600)", fontSize: 12 }}>
                          {p.daysAgo === 0 ? "today" : p.daysAgo === 1 ? "yesterday" : p.daysAgo + "d ago"}
                        </td>
                        <td><span style={{ fontWeight: 600, color: "var(--ink-900)" }}>{p.exp}</span></td>
                        <td><span className="pill pill--soft-strong" style={{ fontSize: 11 }}>{p.action}</span></td>
                        <td><span style={{ color: "var(--ink-800)" }}>{p.element}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-800)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            Interactions during this visit
          </div>
          {(() => {
            const INT_POOL = [
            { action: "Watched video", element: "Roar of the Tyrannosaurus", detail: "0:48 of 1:24" },
            { action: "Watched video", element: "What killed the dinosaurs?", detail: "Full play" },
            { action: "Played audio", element: "Curator commentary", detail: "1:32" },
            { action: "File download", element: "Educator-Guide.pdf", detail: "1.2 MB" },
            { action: "Link click", element: "Read the full story", detail: "nhm.ac.uk/discover" },
            { action: "Image expand", element: "Skeleton diagram", detail: "" },
            { action: "Scroll depth", element: "Reached 80% of page", detail: "" },
            { action: "Section view", element: "Diet & habitat", detail: "12s dwell" },
            { action: "Map interaction", element: "Found-locations map", detail: "Zoom +2" },
            { action: "Share", element: "Page link", detail: "Copy" }];

            // Always anchor to the most recent tap visit only.
            const visitStart = visitor.lastDateTime;
            const events = [];
            for (let j = 0; j < visitor.interactions; j++) {
              const pick = INT_POOL[Math.floor(nextV() * INT_POOL.length)];
              const offsetSec = 5 + Math.floor(nextV() * 240); // 5s..4m after tap
              const dt = new Date(visitStart.getTime() + offsetSec * 1000);
              events.push({ ...pick, dateTime: dt });
            }
            events.sort((a, b) => a.dateTime - b.dateTime);
            return (
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Element</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) =>
                  <tr key={i}>
                      <td className="nowrap" style={{ color: "var(--ink-600)", fontSize: 12 }}>
                        +{Math.round((e.dateTime - visitStart) / 1000)}s
                      </td>
                      <td>
                        <span className="pill pill--soft-strong" style={{ fontSize: 11 }}>{e.action}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{e.element}</div>
                        {e.detail && <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>{e.detail}</div>}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>);

          })()}
        </div>
      </div>
    </div>);

}

// ============================================================
// Experience Edit Screen
// ============================================================
function ExperienceEditScreen({ expId, onNav, onBack, onToast, initialTab }) {
  const exp = window.DATA.EXPERIENCES.find((e) => e.id === expId) || window.DATA.EXPERIENCES[0];
  if (!exp) {
    return (
      <>
        <Topbar title="Experiences" subtitle="No experiences to edit." />
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 8px" }}>No experiences yet</p>
          <button className="btn btn--primary" onClick={onBack}>Back to Experiences</button>
        </div>
      </>);

  }
  const [spaceId, setSpaceId] = useState2(exp.spaceId);
  React.useEffect(() => {setSpaceId(exp.spaceId);}, [exp.id]);
  const space = window.DATA.SPACES.find((s) => s.id === spaceId);
  const [tab, setTab] = useState2(initialTab || "configure");
  const [reassignOpen, setReassignOpen] = useState2(false);
  const [title, setTitle] = useState2(exp.name);
  const [description, setDescription] = useState2("Example Exhibit information");
  React.useEffect(() => {setTitle(exp.name);setDescription("Example Exhibit information");}, [exp.id]);
  const [requireLogin, setRequireLogin] = useState2(false);
  const [redirectOnly, setRedirectOnly] = useState2(false);
  const [period, setPeriod] = useState2({ kind: "lastN", n: 7 });
  return (
    <>
      <Topbar title="Experiences" subtitle="Manage and track the performance of all experiences." />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button className="btn btn--sm" onClick={onBack}>← Back to Experiences</button>
        <span style={{ fontSize: 13, color: "var(--ink-600)" }}>Editing</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{title}</span>
      </div>

      <div className="exp-edit-hero">
        <div className="exp-edit-hero__main">
          <div className="exp-edit-hero__meta">
            <span className="pill pill--soft" style={{ fontWeight: 600 }}>{exp.type}</span>
            {space && <span style={{ fontSize: 12, color: "var(--ink-600)" }}>· {space.name}</span>}
          </div>
          <label className="exp-edit-field">
            <span className="exp-edit-field__label">Experience name</span>
            <div className="exp-edit-field__inputwrap">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled experience"
                className="exp-edit-hero__title" />
              
              <Icon.Edit className="exp-edit-field__pencil" />
            </div>
          </label>
          <label className="exp-edit-field">
            <span className="exp-edit-field__label">Short description</span>
            <div className="exp-edit-field__inputwrap">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a short description visitors will see at the top"
                className="exp-edit-hero__desc" />
              
              <Icon.Edit className="exp-edit-field__pencil" />
            </div>
          </label>
        </div>
        <div className="exp-edit-hero__actions">
          <button className="btn btn--primary" onClick={() => onToast && onToast("Opening builder…")}>
            <Icon.Edit /> Edit Experience
          </button>
        </div>
      </div>

      <div className="exp-edit-tabs-row">
        <div className="exp-edit-tabs" role="tablist">
          {[
          { id: "configure", label: "Configure" },
          { id: "forms", label: "Forms" },
          { id: "history", label: "Insights" },
          { id: "devices", label: "Devices" }].
          map((t) =>
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={"exp-edit-tab" + (tab === t.id ? " is-active" : "")}
            onClick={() => setTab(t.id)}>
            {t.label}</button>
          )}
        </div>
        {tab === "history" &&
        <DateRangePicker value={period} onChange={setPeriod} />
        }
      </div>

      {tab === "configure" &&
      <div className="exp-edit-grid">
          <div className="exp-edit-col">
            <div className="card exp-config-card">
              <div className="exp-config-card__head">
                <div>
                  <h3 className="card-title">Settings</h3>
                  <p className="card-subtitle">How visitors interact with this experience</p>
                </div>
              </div>
              <div className="exp-config-list">
                <div className="exp-config-row">
                  <div className="exp-config-row__text">
                    <div className="exp-config-row__title">Space</div>
                    <div className="exp-config-row__hint">{space ? space.name : "Unassigned"}</div>
                  </div>
                  <button className="btn btn--sm" onClick={() => setReassignOpen(true)}>Reassign</button>
                </div>
                <div className="exp-config-row">
                  <div className="exp-config-row__text">
                    <div className="exp-config-row__title">Require Login</div>
                    <div className="exp-config-row__hint">Visitors must sign in before viewing</div>
                  </div>
                  <button className={"toggle" + (requireLogin ? " on" : "")} onClick={() => setRequireLogin((v) => !v)} />
                </div>
                <div className="exp-config-row">
                  <div className="exp-config-row__text">
                    <div className="exp-config-row__title">Lead capture</div>
                    <div className="exp-config-row__hint">Show a form to collect visitor info</div>
                  </div>
                  <span className="pill pill--soft" style={{ fontWeight: 500 }}>2 forms</span>
                </div>
                <div className="exp-config-row">
                  <div className="exp-config-row__text">
                    <div className="exp-config-row__title">Status</div>
                    <div className="exp-config-row__hint">Live and accepting taps</div>
                  </div>
                  <span className="pill pill--green">Active</span>
                </div>
              </div>
              <div className="exp-config-card__footer">
                <button className="btn" onClick={() => onToast && onToast("Cloned " + (title || exp.name))}>
                  <Icon.Copy /> Clone experience
                </button>
                <button className="btn btn--danger" onClick={() => onToast && onToast("Removed " + (title || exp.name))}>
                  <Icon.Trash /> Delete experience
                </button>
              </div>
            </div>
          </div>

          <div className="exp-edit-col exp-edit-col--preview">
            <div className="exp-preview-card">
              <div className="exp-preview-card__head">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-800)" }}>Experience Preview</span>
                <span style={{ fontSize: 11, color: "var(--ink-600)" }}>Mobile, live render</span>
              </div>
              <div className="exp-preview-card__body">
                <ExperiencePreviewFrame title={title || exp.name} subtitle={description} />
              </div>
            </div>
          </div>
        </div>
      }

      {tab === "history" &&
      <TapHistoryTab exp={exp} period={period} />
      }
      {tab === "devices" &&
      <DevicesTab exp={exp} onToast={onToast} />
      }
      {tab === "forms" &&
      <FormsTab exp={exp} onToast={onToast} />
      }
      {reassignOpen &&
      <ReassignSpaceModal
        currentSpaceId={spaceId}
        spaces={window.DATA.SPACES}
        onCancel={() => setReassignOpen(false)}
        onConfirm={(newId) => {
          setSpaceId(newId);
          setReassignOpen(false);
          const newSpace = window.DATA.SPACES.find((s) => s.id === newId);
          onToast && onToast("Moved \u201C" + (title || exp.name) + "\u201D to " + (newSpace ? newSpace.name : "—"));
        }} />

      }
    </>);

}

// ============================================================
// Assign TapPoint (modal) — choose a TapPoint to route to this experience
// ============================================================
function AssignTapPointModal({ exp, onCancel, onConfirm }) {
  const [selectedId, setSelectedId] = useState2(null);
  const [search, setSearch] = useState2("");
  const spaceTps = window.DATA.TAPPOINTS.filter((t) => t.spaceId === exp.spaceId);
  const candidates = spaceTps.filter((t) => t.experienceId !== exp.id);
  const filtered = candidates.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.xuid || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Assign a TapPoint</h3>
            <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Pick a device from this space to route taps to <strong style={{ color: "var(--ink-900)" }}>{exp.name}</strong>.</p>
          </div>
          <button className="btn btn--icon" onClick={onCancel} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="input-search" style={{ marginBottom: 10 }}>
            <span className="icon-search"><Icon.Search /></span>
            <input placeholder="Search by name or XUID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="reassign-space-list" style={{ maxHeight: 320, overflowY: "auto" }}>
            {filtered.length === 0 &&
            <div className="empty-row" style={{ padding: 20, textAlign: "center" }}>
                {candidates.length === 0 ?
              "All TapPoints in this space are already assigned to this experience." :
              "No TapPoints match your search."}
              </div>
            }
            {filtered.map((t) => {
              const currentExp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
              const isActive = (t.status || "").toLowerCase() === "active";
              return (
                <button
                  key={t.id}
                  type="button"
                  className={"reassign-space-row" + (t.id === selectedId ? " is-selected" : "")}
                  onClick={() => setSelectedId(t.id)}>
                  <div className="tp-avatar" aria-hidden="true" style={{ width: 32, height: 32 }}>
                    <Icon.TapPoints />
                  </div>
                  <div className="reassign-space-row__main">
                    <div className="reassign-space-row__name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{t.name}</span>
                      <span className={"pill " + (isActive ? "pill--green" : "pill--red")} style={{ fontSize: 10 }}>{t.status}</span>
                    </div>
                    <div className="reassign-space-row__meta">
                      {currentExp ? <>Currently: {currentExp.name}</> : "Unassigned"} · XUID {t.xuid}
                    </div>
                  </div>
                  <span className="reassign-space-row__radio">
                    <span className="reassign-space-row__dot" />
                  </span>
                </button>);

            })}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button
              className="btn btn--primary"
              disabled={!selectedId}
              onClick={() => onConfirm(selectedId)}>
              Assign TapPoint
            </button>
          </div>
        </div>
      </div>
    </div>);
}

// ============================================================
// Reassign Space (modal)
// ============================================================
function ReassignSpaceModal({ currentSpaceId, spaces, onCancel, onConfirm }) {
  const [selectedId, setSelectedId] = useState2(currentSpaceId);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Reassign to a space</h3>
            <p className="card-subtitle" style={{ margin: "2px 0 0" }}>Pick a different space for this experience. TapPoints stay where they are.</p>
          </div>
          <button className="btn btn--icon" onClick={onCancel} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="reassign-space-list">
            {spaces.map((s) =>
            <button
              key={s.id}
              type="button"
              className={"reassign-space-row" + (s.id === selectedId ? " is-selected" : "")}
              onClick={() => setSelectedId(s.id)}>
              
                <SpaceAvatar space={s} size={28} />
                <div className="reassign-space-row__main">
                  <div className="reassign-space-row__name">{s.name}</div>
                  <div className="reassign-space-row__meta">{s.experiences} experiences · {s.devices} devices</div>
                </div>
                <span className="reassign-space-row__radio">
                  <span className="reassign-space-row__dot" />
                </span>
              </button>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button
              className="btn btn--primary"
              disabled={selectedId === currentSpaceId}
              onClick={() => onConfirm(selectedId)}>
              
              Reassign
            </button>
          </div>
        </div>
      </div>
    </div>);

}