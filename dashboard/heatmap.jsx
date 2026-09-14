// Heatmap card — interactive floor-plan with user-pinned tappoints.
// Lives inside Reports, occupies half the screen alongside a pins sidebar.

const { useState: useStateHeatmap, useEffect: useEffectHeatmap, useMemo: useMemoHeatmap, useRef: useRefHeatmap } = React;

const TP_TYPES_HM = ["Sticker", "Hub", "Card"];
function typeForTpHm(id) {
  const s = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return TP_TYPES_HM[s % TP_TYPES_HM.length];
}
function typeToneHm(t) {
  if (t === "Hub") return { bg: "#007DF9", fg: "#fff" };
  if (t === "Card") return { bg: "#7434c2", fg: "#fff" };
  return { bg: "#1c8a36", fg: "#fff" }; // Sticker
}

// localStorage keys, per space
function imgKey(spaceId) { return "heatmap_img_" + spaceId; }
function pinsKey(spaceId) { return "heatmap_pins_" + spaceId; }

function safeGet(k) {
  try { return localStorage.getItem(k); } catch (e) { return null; }
}
function safeSet(k, v) {
  try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {}
}

// ────────────────────────────────────────────────────────────────────
// Main card
// ────────────────────────────────────────────────────────────────────
function HeatmapCard({ period, spaceCtx, spaceFilter }) {
  const allSpaces = window.DATA.SPACES;
  const initialSpaceId =
    (spaceFilter && spaceFilter.length === 1 && spaceFilter[0]) ||
    (spaceCtx && spaceCtx !== "all" ? spaceCtx : null) ||
    "all";

  const [spaceId, setSpaceId] = useStateHeatmap(initialSpaceId);
  // Sync the heatmap's scope with the top-of-page filter:
  //   • exactly 1 space selected at top → show that space's floor plan
  //   • 0 or 2+ spaces selected at top   → show the group "All Spaces" map
  useEffectHeatmap(() => {
    const target = (spaceFilter && spaceFilter.length === 1)
      ? spaceFilter[0]
      : (spaceCtx && spaceCtx !== "all" && (!spaceFilter || spaceFilter.length === 0))
        ? spaceCtx
        : "all";
    if (target !== spaceId) setSpaceId(target);
  }, [spaceCtx, (spaceFilter || []).join(",")]);

  const isAllMode = spaceId === "all";
  const selectedSpace = isAllMode ? null : (allSpaces.find((s) => s.id === spaceId) || allSpaces[0]);

  // Persisted state per scope (a real space id, or "all" for the group-level view)
  const [image, setImage] = useStateHeatmap(null);
  const [pins, setPins] = useStateHeatmap([]);
  const [editMode, setEditMode] = useStateHeatmap(false);
  const [pickingFor, setPickingFor] = useStateHeatmap(null); // { x, y, existingIdx? }
  const [showHeat, setShowHeat] = useStateHeatmap(true);
  const [hovered, setHovered] = useStateHeatmap(null);
  const [confirmRemove, setConfirmRemove] = useStateHeatmap(false);

  // Load when scope changes
  useEffectHeatmap(() => {
    const img = safeGet(imgKey(spaceId));
    const p = safeGet(pinsKey(spaceId));
    setImage(img);
    setPins(p ? JSON.parse(p) : []);
    setEditMode(false);
    setPickingFor(null);
  }, [spaceId]);

  // Persist
  useEffectHeatmap(() => { safeSet(imgKey(spaceId), image); }, [image, spaceId]);
  useEffectHeatmap(() => { safeSet(pinsKey(spaceId), JSON.stringify(pins)); }, [pins, spaceId]);

  // Tap volume per experience, used for heat blob sizing in single-space mode
  const expVolumes = useMemoHeatmap(() => {
    if (isAllMode) return {};
    const all = window.experiencesForPeriod(period, spaceId);
    const m = {};
    all.forEach((e) => { m[e.id] = e.taps; });
    return m;
  }, [period, spaceId, isAllMode]);

  // Items pool — what can be assigned to a pin in the current mode.
  // Single-space mode pins TapPoints; all-spaces mode pins Spaces.
  // Shape: { id, name, sub, type, tone, vol }
  const items = useMemoHeatmap(() => {
    if (isAllMode) {
      return allSpaces.map((s) => ({
        id: s.id,
        name: s.name,
        sub: `${s.devices || 0} devices · ${s.experiences || 0} experiences`,
        type: "Space",
        tone: { bg: "#007DF9", fg: "#fff" },
        vol: s.taps || 0,
      }));
    }
    const tps = window.DATA.TAPPOINTS.filter((t) => t.spaceId === spaceId);
    return tps.map((t) => {
      const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
      const type = typeForTpHm(t.id);
      return {
        id: t.id,
        name: t.name,
        sub: `${type} · ${exp ? exp.name : "Unassigned"}`,
        type,
        tone: typeToneHm(type),
        vol: exp ? (expVolumes[exp.id] || 0) : 0,
      };
    });
  }, [isAllMode, spaceId, period, expVolumes, allSpaces.length]);

  const itemsById = useMemoHeatmap(() => {
    const m = {};
    items.forEach((it) => { m[it.id] = it; });
    return m;
  }, [items]);

  const maxVol = Math.max(1, ...items.map((it) => it.vol));
  const pinnedIds = new Set(pins.map((p) => p.tpId));

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setPins([]);
    setEditMode(false);
    setConfirmRemove(false);
  };

  const onMapClick = (e) => {
    if (!editMode || pickingFor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPickingFor({ x, y });
  };

  const assignPin = (tpId) => {
    if (!pickingFor) return;
    if (pickingFor.existingIdx != null) {
      setPins(pins.map((p, i) => i === pickingFor.existingIdx ? { ...p, tpId } : p));
    } else {
      setPins([...pins, { tpId, x: pickingFor.x, y: pickingFor.y }]);
    }
    setPickingFor(null);
  };
  const removePin = (idx) => {
    setPins(pins.filter((_, i) => i !== idx));
    setPickingFor(null);
  };

  // Drag-to-move pins (edit mode)
  const dragRef = useRefHeatmap(null);
  const onPinPointerDown = (e, idx) => {
    if (!editMode) return;
    e.stopPropagation();
    const stage = e.currentTarget.closest(".heatmap-stage");
    if (!stage) return;
    dragRef.current = { idx, stage };
    const move = (ev) => {
      const rect = stage.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      setPins((prev) => prev.map((p, i) => i === idx ? { ...p, x, y } : p));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onPinClick = (e, idx) => {
    e.stopPropagation();
    const p = pins[idx];
    if (editMode) {
      // Open picker positioned at this pin to reassign / remove
      setPickingFor({ x: p.x, y: p.y, existingIdx: idx });
    }
  };

  const itemLabel = isAllMode ? "Space" : "TapPoint";

  return (
    <div className="card heatmap-card">
      <div className="card-header" style={{ alignItems: "center", paddingBottom: 14 }}>
        <div>
          <h3 className="card-title">Heatmap</h3>
          <p className="card-subtitle">
            {isAllMode
              ? "Place Space pins on your group map to see where engagement happens"
              : "Place TapPoint pins on your floor plan to see where visitors engage"}
          </p>
        </div>
        <SpaceSwitcher value={spaceId} onChange={setSpaceId} />
      </div>

      <div className="heatmap-controls">
        <button
          className={"btn btn--sm" + (editMode ? " btn--primary" : "")}
          onClick={() => { setEditMode((m) => !m); setPickingFor(null); }}
          disabled={!image}
        >
          {editMode ? "Done editing" : "Edit pins"}
        </button>
        <label className={"hm-toggle" + (showHeat ? " hm-toggle--on" : "")}>
          <input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} />
          <span>Heat overlay</span>
        </label>
        <div style={{ flex: 1 }} />
        {image &&
          <>
            <label className="btn btn--sm">
              <Icon.Upload /> Replace {isAllMode ? "group map" : "floor plan"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onFile(e.target.files && e.target.files[0])} />
            </label>
            <button className="btn btn--sm" onClick={() => setConfirmRemove(true)} style={{ color: "#B00020" }}>Remove</button>
          </>
        }
      </div>

      <div className="heatmap-body">
        {!image ? (
          <UploadZone onFile={onFile} isAllMode={isAllMode} />
        ) : (
          <div
            className={"heatmap-stage" + (editMode ? " heatmap-stage--edit" : "")}
            onClick={onMapClick}
          >
            <div className="heatmap-stage__clip">
              <img src={image} alt={isAllMode ? "Group map" : "Floor plan"} className="heatmap-image" draggable={false} />
              {/* Heat overlay */}
              {showHeat && <HeatOverlay pins={pins} itemsById={itemsById} maxVol={maxVol} />}
            </div>

            {/* Pins */}
            {pins.map((p, i) => {
              const it = itemsById[p.tpId];
              if (!it) return null;
              const isHover = hovered === i;
              return (
                <div
                  key={i}
                  className={"hm-pin" + (editMode ? " hm-pin--edit" : "")}
                  style={{ left: (p.x * 100) + "%", top: (p.y * 100) + "%", background: it.tone.bg, color: it.tone.fg }}
                  onPointerDown={(e) => onPinPointerDown(e, i)}
                  onClick={(e) => onPinClick(e, i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered((h) => h === i ? null : h)}
                  title={it.name}
                >
                  <span className="hm-pin__num">{i + 1}</span>
                  {isHover && !editMode && (
                    <div className="hm-pin__tip" onClick={(e) => e.stopPropagation()}>
                      <div className="hm-pin__tip-name">{it.name}</div>
                      <div className="hm-pin__tip-meta">
                        <span className="pill" style={{ background: it.tone.bg, color: it.tone.fg, fontWeight: 600 }}>{it.type}</span>
                        <span>{it.sub}</span>
                      </div>
                      <div className="hm-pin__tip-taps">{(it.vol || 0).toLocaleString()} taps this period</div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Picker popover for adding/reassigning */}
            {pickingFor && (
              <PinPicker
                x={pickingFor.x}
                y={pickingFor.y}
                existingIdx={pickingFor.existingIdx}
                items={items}
                pinnedIds={pinnedIds}
                itemLabel={itemLabel}
                onAssign={assignPin}
                onRemove={() => removePin(pickingFor.existingIdx)}
                onCancel={() => setPickingFor(null)}
              />
            )}

            {editMode && !pickingFor && (
              <div className="heatmap-hint">Click anywhere on the map to drop a {itemLabel} pin. Drag pins to reposition.</div>
            )}
          </div>
        )}

        <HeatLegend />
      </div>

      {confirmRemove && (
        <ConfirmModal
          title={isAllMode ? "Remove group map?" : "Remove floor plan?"}
          body={`This will delete the uploaded ${isAllMode ? "group map" : "floor plan"} and all ${pins.length} placed ${pins.length === 1 ? "pin" : "pins"} for this ${isAllMode ? "group view" : "space"}. This can't be undone.`}
          confirmLabel="Remove"
          destructive
          onConfirm={removeImage}
          onCancel={() => setConfirmRemove(false)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Generic confirm dialog (matches the project modal styling)
// ────────────────────────────────────────────────────────────────────
function ConfirmModal({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive, onConfirm, onCancel }) {
  useEffectHeatmap(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>
          </div>
          <button className="btn btn--icon" onClick={onCancel} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--ink-700)", margin: 0, lineHeight: 1.5 }}>{body}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <button className="btn" onClick={onCancel}>{cancelLabel}</button>
            <button
              className={destructive ? "btn btn--danger" : "btn btn--primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Upload zone (drag-and-drop or click to pick)
// ────────────────────────────────────────────────────────────────────
function UploadZone({ onFile, isAllMode }) {
  const [drag, setDrag] = useStateHeatmap(false);
  return (
    <label
      className={"heatmap-upload" + (drag ? " is-dragover" : "")}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        onFile(f);
      }}
    >
      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onFile(e.target.files && e.target.files[0])} />
      <div className="heatmap-upload__icon">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M18 24V8M11 15l7-7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="6" y="22" width="24" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
      <div className="heatmap-upload__title">{isAllMode ? "Upload a group map" : "Upload a floor plan"}</div>
      <div className="heatmap-upload__sub">Drag and drop an image, or click to browse. PNG or JPG, ideally landscape.</div>
      <div className="heatmap-upload__cta">Browse files</div>
    </label>
  );
}

// ────────────────────────────────────────────────────────────────────
// Picker popover — shows tappoints available to assign
// ────────────────────────────────────────────────────────────────────
function PinPicker({ x, y, existingIdx, items, pinnedIds, itemLabel = "TapPoint", onAssign, onRemove, onCancel }) {
  const ref = useRefHeatmap(null);
  useEffectHeatmap(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onCancel();
    };
    setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Available = unpinned items, plus the one already attached to this pin (if reassigning)
  const available = items.filter((it) => !pinnedIds.has(it.id) || (existingIdx != null));
  const isRight = x > 0.55;
  const isBottom = y > 0.55;
  return (
    <div
      ref={ref}
      className="hm-picker"
      style={{
        left: (x * 100) + "%",
        top: (y * 100) + "%",
        transform: `translate(${isRight ? "calc(-100% - 14px)" : "14px"}, ${isBottom ? "calc(-100% - 14px)" : "14px"})`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="hm-picker__head">
        <span>{existingIdx != null ? "Reassign pin" : `Assign ${itemLabel}`}</span>
        <button className="btn btn--icon btn--xs" onClick={onCancel} aria-label="Cancel">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="hm-picker__list">
        {available.length === 0 && (
          <div className="hm-picker__empty">No unpinned {itemLabel}s left.</div>
        )}
        {available.map((it) => (
          <button key={it.id} className="hm-picker__item" onClick={() => onAssign(it.id)}>
            <span className="hm-picker__dot" style={{ background: it.tone.bg }} />
            <div className="hm-picker__main">
              <div className="hm-picker__name">{it.name}</div>
              <div className="hm-picker__meta">{it.sub}</div>
            </div>
          </button>
        ))}
      </div>
      {existingIdx != null && (
        <div className="hm-picker__foot">
          <button className="btn btn--xs" onClick={onRemove} style={{ color: "#B00020" }}>Remove pin</button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Heat overlay — SVG with radial gradient blobs at each pin
// ────────────────────────────────────────────────────────────────────
function HeatOverlay({ pins, itemsById, maxVol }) {
  return (
    <svg className="hm-heat" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <radialGradient id="hm-heat-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF3D2E" stopOpacity="0.95" />
          <stop offset="18%" stopColor="#FF7A1A" stopOpacity="0.85" />
          <stop offset="38%" stopColor="#FFD83D" stopOpacity="0.70" />
          <stop offset="58%" stopColor="#7BD874" stopOpacity="0.50" />
          <stop offset="78%" stopColor="#3FA9F5" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#3FA9F5" stopOpacity="0" />
        </radialGradient>
      </defs>
      {pins.map((p, i) => {
        const it = itemsById && itemsById[p.tpId];
        if (!it) return null;
        const vol = it.vol || 0;
        const t = maxVol > 0 ? vol / maxVol : 0;
        // 8% → 22% of width
        const r = 8 + Math.pow(t, 0.55) * 14;
        return (
          <ellipse
            key={i}
            cx={p.x * 100}
            cy={p.y * 100}
            rx={r}
            ry={r}
            fill="url(#hm-heat-grad)"
            style={{ mixBlendMode: "multiply" }}
          />
        );
      })}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// Compact horizontal legend (fits the half-width card)
// ────────────────────────────────────────────────────────────────────
function HeatLegend() {
  return (
    <div className="heat-legend heat-legend--horiz">
      <span className="heat-legend__cap heat-legend__cap--low">Low</span>
      <div className="heat-legend__bar heat-legend__bar--horiz" />
      <span className="heat-legend__cap">High</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Pins sidebar — companion card that lists all TapPoints in the space
// with their pin status and assigned experience.
// ────────────────────────────────────────────────────────────────────
function PinsSidebar({ period, spaceCtx, spaceFilter }) {
  const allSpaces = window.DATA.SPACES;
  const initialSpaceId =
    (spaceFilter && spaceFilter.length === 1 && spaceFilter[0]) ||
    (spaceCtx && spaceCtx !== "all" ? spaceCtx : null) ||
    (allSpaces[0] && allSpaces[0].id);

  const [spaceId, setSpaceId] = useStateHeatmap(initialSpaceId);
  useEffectHeatmap(() => {
    const target =
      (spaceFilter && spaceFilter.length === 1 && spaceFilter[0]) ||
      (spaceCtx && spaceCtx !== "all" ? spaceCtx : null);
    if (target && target !== spaceId) setSpaceId(target);
  }, [spaceCtx, (spaceFilter || []).join(",")]);

  // Re-read pins from localStorage on a tick so updates from HeatmapCard reflect here.
  const [tick, setTick] = useStateHeatmap(0);
  useEffectHeatmap(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const raw = safeGet(pinsKey(spaceId));
  const pins = raw ? JSON.parse(raw) : [];
  const tappoints = window.DATA.TAPPOINTS.filter((t) => t.spaceId === spaceId);

  const expVolumes = useMemoHeatmap(() => {
    const all = window.experiencesForPeriod(period, spaceId);
    const m = {};
    all.forEach((e) => { m[e.id] = e.taps; });
    return m;
  }, [period, spaceId, tick]);

  const pinnedTpIds = new Set(pins.map((p) => p.tpId));
  const unpinned = tappoints.filter((t) => !pinnedTpIds.has(t.id));

  return (
    <div className="card pins-sidebar">
      <div className="card-header" style={{ alignItems: "flex-start", paddingBottom: 14 }}>
        <div>
          <h3 className="card-title">TapPoint pins</h3>
          <p className="card-subtitle">{pins.length} of {tappoints.length} placed in <strong style={{ color: "var(--ink-900)" }}>{(allSpaces.find((s) => s.id === spaceId) || {}).name || "—"}</strong></p>
        </div>
      </div>
      <div className="pins-body">
        {tappoints.length === 0 && (
          <div className="empty-row" style={{ padding: 18 }}>No TapPoints assigned to this space yet.</div>
        )}
        {tappoints.length > 0 && (
          <div className="pins-list">
            {/* Pinned first, in pin order */}
            {pins.map((p, idx) => {
              const tp = tappoints.find((t) => t.id === p.tpId);
              if (!tp) return null;
              const exp = window.DATA.EXPERIENCES.find((e) => e.id === tp.experienceId);
              const type = typeForTpHm(tp.id);
              const tone = typeToneHm(type);
              const vol = exp ? (expVolumes[exp.id] || 0) : 0;
              return (
                <div className="pin-row" key={tp.id}>
                  <span className="pin-row__marker" style={{ background: tone.bg }}>{idx + 1}</span>
                  <div className="pin-row__main">
                    <div className="pin-row__name">{tp.name}</div>
                    <div className="pin-row__meta">{type} · {exp ? exp.name : "Unassigned"}</div>
                  </div>
                  <span className="pin-row__taps">{vol.toLocaleString()} taps</span>
                </div>
              );
            })}
            {/* Then unpinned */}
            {unpinned.map((tp) => {
              const exp = window.DATA.EXPERIENCES.find((e) => e.id === tp.experienceId);
              const type = typeForTpHm(tp.id);
              return (
                <div className="pin-row is-unpinned" key={tp.id}>
                  <span className="pin-row__marker is-empty">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.2" /></svg>
                  </span>
                  <div className="pin-row__main">
                    <div className="pin-row__name" style={{ color: "var(--ink-700)" }}>{tp.name}</div>
                    <div className="pin-row__meta">Not placed · {type} · {exp ? exp.name : "Unassigned"}</div>
                  </div>
                  <span className="pin-row__taps" style={{ color: "var(--ink-500)" }}>—</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { HeatmapCard, PinsSidebar, ConfirmModal });
