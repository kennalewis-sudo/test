// All 8 screens combined into one file for compactness.
const { useState: useStateDash, useMemo: useMemoDash } = React;

// ============================================================
// Shared chart - SVG line chart with axis
// ============================================================
function LineChart({ series, dates, days, frequency, height = 200, width = 540 }) {
  const [hover, setHover] = useStateDash(null);
  const max = Math.max(...series, 40);
  const _willRotate = series.length > 7;
  const padL = 40, padR = 14, padT = 12, padB = _willRotate ? 56 : 28;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const yMax = Math.max(40, Math.ceil(max / 10) * 10);
  const x = (i) => padL + (i / Math.max(1, series.length - 1)) * w;
  const y = (v) => padT + h - (v / yMax) * h;
  const pts = series.map((v, i) => [x(i), y(v)]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const areaPath = path + ` L${pts[pts.length-1][0]},${padT+h} L${pts[0][0]},${padT+h} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax));
  const dotIndices = (frequency === "daily" && series.length >= 90)
    ? []
    : (frequency === "monthly" || frequency === "weekly" || frequency === "daily" || frequency === "quarterly")
      ? Array.from({ length: series.length }, (_, i) => i)
      : null;
  const showAllLabels = (frequency === "daily" && series.length <= 45) || (frequency === "weekly" && series.length <= 20) || frequency === "monthly" || frequency === "quarterly";
  const labelCount = showAllLabels ? series.length : Math.min(7, series.length);
  const xTicks = showAllLabels
    ? Array.from({ length: series.length }, (_, i) => i)
    : Array.from({ length: labelCount }, (_, k) =>
        labelCount === 1 ? 0 : Math.round((k / (labelCount - 1)) * (series.length - 1))
      );
  const rotateLabels = xTicks.length > 7;
  const labelFor = (i) => {
    if (dates && dates[i]) {
      const d = dates[i];
      if (frequency === "monthly") return d.toLocaleString("en-US", { month: "short" }) + " " + d.getFullYear();
      if (frequency === "quarterly") return "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + d.getFullYear();
      return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    }
    return "Apr " + (days ? days[i] : i + 1);
  };
  const fullLabelFor = (i) => {
    if (dates && dates[i]) {
      const d = dates[i];
      if (frequency === "monthly") return d.toLocaleString("en-US", { month: "long", year: "numeric" });
      if (frequency === "weekly") return "Week of " + d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return labelFor(i);
  };
  const handleMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    if (px < padL || px > padL + w) { setHover(null); return; }
    const rel = (px - padL) / w;
    const idx = Math.max(0, Math.min(series.length - 1, Math.round(rel * (series.length - 1))));
    setHover(idx);
  };
  const tooltipPad = 8;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", width: "100%" }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="lcgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#007DF9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#007DF9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={padL + w} y1={y(t)} y2={y(t)} stroke="#E5EEF8" strokeDasharray="3 4" />
          <text x={padL - 8} y={y(t) + 3} fontSize="9" fill="rgba(20,29,35,0.55)" textAnchor="end" fontFamily="Poppins">{t}</text>
        </g>
      ))}
      {xTicks.map((t) => (
        rotateLabels ? (
          <text key={t} x={x(t)} y={padT + h + 14} fontSize="9" fill="rgba(20,29,35,0.55)" textAnchor="end" fontFamily="Poppins" transform={`rotate(-40 ${x(t)} ${padT + h + 14})`}>
            {labelFor(t)}
          </text>
        ) : (
          <text key={t} x={x(t)} y={padT + h + 16} fontSize="9" fill="rgba(20,29,35,0.55)" textAnchor="middle" fontFamily="Poppins">
            {labelFor(t)}
          </text>
        )
      ))}
      <path d={areaPath} fill="url(#lcgrad)" />
      <path d={path} fill="none" stroke="#007DF9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {(dotIndices || xTicks).map((i) => (
        <circle key={"dot-" + i} cx={pts[i][0]} cy={pts[i][1]} r="3.5" fill="#fff" stroke="#007DF9" strokeWidth="2" />
      ))}
      {hover != null && (
        <g pointerEvents="none">
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={padT} y2={padT + h} stroke="#007DF9" strokeOpacity="0.35" strokeDasharray="3 3" />
          <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4.5" fill="#007DF9" stroke="#fff" strokeWidth="2" />
          {(() => {
            const valTxt = series[hover].toLocaleString();
            const dateTxt = fullLabelFor(hover);
            const charW = 5.4;
            const labelW = Math.max(valTxt.length, dateTxt.length) * charW + tooltipPad * 2;
            const labelH = 32;
            let tx = pts[hover][0] - labelW / 2;
            tx = Math.max(padL, Math.min(padL + w - labelW, tx));
            const ty = Math.max(padT + 2, pts[hover][1] - labelH - 10);
            return (
              <g>
                <rect x={tx} y={ty} width={labelW} height={labelH} rx="6" fill="#141D23" />
                <text x={tx + labelW / 2} y={ty + 13} fontSize="10" fill="rgba(255,255,255,0.7)" textAnchor="middle" fontFamily="Poppins">{dateTxt}</text>
                <text x={tx + labelW / 2} y={ty + 26} fontSize="11" fontWeight="600" fill="#fff" textAnchor="middle" fontFamily="Poppins">{valTxt} taps</text>
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

function RecentTapsTable({ items, columns = "all" }) {
  const sortable = useSortableData(items, "date", "desc");
  return (
    <Paginator items={sortable.sorted} defaultPerPage={5} perPageOptions={[5, 10, 25, 50, 100]} itemLabel="tap">
      {(pageItems) => (
        <div style={{ padding: "12px 26px 18px" }}>
          <table className="subtable">
            <thead>
              <tr>
                <SortTh columnKey="date" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Date</SortTh>
                <SortTh columnKey="name" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Visitor</SortTh>
                <SortTh columnKey="email" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Email</SortTh>
                <SortTh columnKey="expName" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Experience</SortTh>
                {columns === "all" && <SortTh columnKey="spaceName" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Space</SortTh>}
                <SortTh columnKey="deviceName" sortKey={sortable.sortKey} sortDir={sortable.sortDir} onSort={sortable.requestSort}>Device</SortTh>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t, i) => (
                <tr key={i}>
                  <td className="muted nowrap">{t.date}</td>
                  <td>{t.anonymous ? <span style={{ color: "var(--ink-500)", fontStyle: "italic" }}>Anonymous</span> : t.name}</td>
                  <td className="muted nowrap">{t.anonymous ? "—" : t.email}</td>
                  <td>{t.expName || "—"}</td>
                  {columns === "all" && <td>{t.spaceName || "—"}</td>}
                  <td className="nowrap">{t.deviceName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Paginator>
  );
}

function Sparkline({ data, color = "#007DF9" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / span) * (h - 6) - 3]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
// 1. Dashboard - All Spaces
// ============================================================
function DashboardAllSpaces({ onNav, onSelectSpace, onSelectExperience, spaceCtx, setSpaceCtx, period, setPeriod, frequency, setFrequency, ai }) {
  ai = ai || {};
  const insights = useMemoDash(
    () => window.computeDashboardInsights({ period, spaceCtx: "all", frequency, tone: ai.aiTone || "factual" }),
    [period, frequency, ai.aiTone, window.DATA.SPACES.length, window.DATA.EXPERIENCES.length, window.DATA.TAPPOINTS.length]
  );
  const [showAllTapsAll, setShowAllTapsAll] = useStateDash(false);
  const [spaceFilter, setSpaceFilter] = useStateDash("");
  const [creatingSpace, setCreatingSpace] = useStateDash(false);
  const [visibleMetrics, setVisibleMetrics] = useStateDash({ totalTaps: true, uniqueVisitors: true, leadsCaptured: true, conversionRate: true });
  const toggleMetric = (k) => setVisibleMetrics((v) => ({ ...v, [k]: !v[k] }));
  const spaces = window.DATA.SPACES;
  const multi = window.multiSeriesForPeriod(period, "all", frequency);
  const topExperiences = window.experiencesForPeriod(period, null);
  const m = window.metricsForPeriod(period, "all");
  const vsLabel = window.previousPeriodLabel(period);
  const fmt = window.fmtDelta;
  const stats = [
    { label: "Total Taps", statKey: "totalTaps", value: m.totalTaps.toLocaleString(), delta: fmt(m.tapsDelta), icon: <Icon.TapHand />, kind: "green" },
    { label: "Unique Taps", statKey: "uniqueVisitors", value: m.uniqueVisitors.toLocaleString(), delta: fmt(m.visitorsDelta), icon: <Icon.Users />, kind: "purple" },
    { label: "Leads Captured", statKey: "leadsCaptured", value: m.leadsCaptured.toLocaleString(), delta: fmt(m.leadsDelta), icon: <Icon.Doc />, kind: "blue" },
    { label: "Conversion Rate", statKey: "conversionRate", value: m.conversionRate.toFixed(1) + "%", delta: fmt(m.conversionDelta.toFixed(1), "pp"), icon: <Icon.Trend />, kind: "orange" },
  ];
  return (
    <>
      <Topbar title="Dashboard" subtitle="Welcome Back, Joe! Here's what's happening." />
      <div className="dash-period-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SpaceSwitcher value={spaceCtx} onChange={setSpaceCtx} />
          <PeriodControl value={period} onChange={setPeriod} simple />
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i} style={{ position: "relative" }}>
            {ai.aiChips !== false && <span style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}><ExplainChip statKey={s.statKey} insights={insights} /></span>}
            <div className={"stat-icon stat-icon--" + s.kind}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <p className="stat-label">{s.label}</p>
              <div className="stat-value">{s.value}<span className={"delta " + (String(s.delta).startsWith("-") ? "delta--down" : "delta--up")}>{s.delta}</span></div>
              <p className="stat-foot">{vsLabel}</p>
            </div>
          </div>
        ))}
      </div>
      {ai.aiPanel !== false && <AIInsightsPanel insights={insights} onNav={onNav} period={period} sessionKey="all" />}
      {/* Full-width tap performance chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Tap Performance</h3>
            <p className="card-subtitle">Overlay metrics across the selected period — toggle any to focus</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(() => { const r = window.periodRange(period); return (<span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>); })()}
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
              conversionRate: m.conversionRate.toFixed(1) + "%",
            }}
            onToggle={toggleMetric}
          />
        </div>
        <div className="chart-wrap" style={{ paddingTop: 6, paddingBottom: 18 }}>
          <MultiLineChart data={multi} metrics={TAPS_METRICS} visible={visibleMetrics} frequency={frequency} height={320} />
        </div>
      </div>

      {/* Two equal columns: Your Spaces | Top Experiences */}
      <div className="dash-grid-equal">
        <div className="card dash-equal-card dash-fixed-card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <div>
              <h3 className="card-title">Your Spaces</h3>
              <p className="card-subtitle">{spaces.length} active {spaces.length === 1 ? "space" : "spaces"}</p>
            </div>
            {window.__viewerRole === "Space Admin" ? (
              <span className="info-tip" tabIndex="0" aria-label="Only Organization admins can create new spaces" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px", height: 30, borderRadius: 8, background: "rgba(20,29,35,0.06)", color: "var(--ink-600)", fontSize: 12, fontWeight: 600, cursor: "not-allowed" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Add New Space</span>
                <span className="info-tip__pop">Only Organization admins can create new spaces.</span>
              </span>
            ) : (
            <button className="btn btn--primary btn--sm" onClick={() => setCreatingSpace(true)}>
              <Icon.Plus /> Add New Space
            </button>
            )}
          </div>
          <div style={{ padding: "0 26px 8px" }}>
            <div className="input-search" style={{ marginBottom: 4 }}>
              <span className="icon-search"><Icon.Search /></span>
              <input placeholder="Filter by name" value={spaceFilter} onChange={(e) => setSpaceFilter(e.target.value)} />
            </div>
          </div>
          {(() => {
            const filteredSpaces = spaces.filter((s) => !spaceFilter || s.name.toLowerCase().includes(spaceFilter.toLowerCase()));
            return (
              <Paginator items={filteredSpaces} defaultPerPage={5} itemLabel="space">
                {(pageItems) => (
                  <div className="row-list">
                    {pageItems.length === 0 && <div className="empty-row">No spaces match your filter.</div>}
                    {pageItems.map((s) => (
                      <div className="row" key={s.id} onClick={() => onSelectSpace(s.id)}>
                        <SpaceAvatar space={s} />
                        <div className="row-main">
                          <p className="row-title">{s.name}</p>
                          <p className="row-sub">
                            {s.members} {s.members === 1 ? "user" : "users"} • {s.taps} total taps<br />
                            Associated: {s.devices} Devices / {s.experiences} Experiences  Admins: {s.admins.join(", ")}
                          </p>
                        </div>
                        <div className="row-right">
                          <span className="pill pill--green">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Paginator>
            );
          })()}
        </div>

        <div className="card dash-equal-card dash-fixed-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Experiences</h3>
              <p className="card-subtitle">Ranked by taps this period</p>
            </div>
            {(() => { const r = window.periodRange(period); return (<span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>); })()}
          </div>
          <Paginator items={topExperiences} defaultPerPage={5} perPageOptions={[5, 10, 25, 50]} itemLabel="experience">
            {(pageItems, info) => (
              <div className="top-exp top-exp--scroll">
                {pageItems.length === 0 && <div className="empty-row">No experiences yet.</div>}
                {pageItems.map((e, i) => (
                  <div className="row-exp" key={e.id} onClick={() => onSelectExperience ? onSelectExperience(e.id) : onNav("experiences")} style={{ cursor: "pointer" }}>
                    <span className="rank">#{info.start + i + 1}</span>
                    <div>
                      <div className="exp-name exp-name--link">{e.name}</div>
                      <div className="exp-type">{e.type} • {(spaces.find(s => s.id === e.spaceId) || {}).name || ""}</div>
                    </div>
                    <div className="exp-spark"><Sparkline data={[6, 9, 7, 12, 14, 16, Math.max(4, 22 - i * 2)]} /></div>
                    <div>
                      <div className="exp-count">{e.taps}</div>
                      <div className={"exp-delta " + (e.delta > 0 ? "delta--up" : "delta--down")}>{e.delta > 0 ? "+" : ""}{e.delta}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Paginator>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card dash-fixed-card dash-fixed-card--wide" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Taps</h3>
              <p className="card-subtitle">Latest visitor activity across all spaces</p>
            </div>
            {(() => { const r = window.periodRange(period); return (<span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>); })()}
          </div>
          <RecentTapsTable
            items={window.DATA.RECENT_TAPS.map((t) => {
              const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
              const sp = exp ? spaces.find((s) => s.id === exp.spaceId) : null;
              return { ...t, spaceName: sp ? sp.name : "", expName: exp ? exp.name : "", deviceName: t.deviceId.replace("tp", "TapPoint ") };
            })}
          />
        </div>
      </div>
      {creatingSpace && <CreateSpaceModal onClose={() => setCreatingSpace(false)} />}
      {showAllTapsAll && (
        <div className="modal-overlay" onClick={() => setShowAllTapsAll(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="card-title">All Recent Taps</h3>
                <p className="card-subtitle">{window.DATA.RECENT_TAPS.length} entries across all spaces</p>
              </div>
              <button className="btn btn--icon" onClick={() => setShowAllTapsAll(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <table className="subtable">
                <thead>
                  <tr><th>Visitor</th><th>Email</th><th>Date</th><th>Space</th><th>Experience</th><th>Device</th></tr>
                </thead>
                <tbody>
                  {window.DATA.RECENT_TAPS.map((t, i) => {
                    const exp = window.DATA.EXPERIENCES.find(e => e.id === t.experienceId);
                    const sp = exp ? spaces.find(s => s.id === exp.spaceId) : null;
                    return (
                      <tr key={i}>
                        <td>{t.anonymous ? <span style={{ color: "var(--ink-500)", fontStyle: "italic" }}>Anonymous</span> : t.name}</td>
                        <td className="muted nowrap">{t.anonymous ? "—" : t.email}</td>
                        <td className="muted nowrap">{t.date}</td>
                        <td>{sp ? sp.name : "—"}</td>
                        <td>{exp ? exp.name : "—"}</td>
                        <td className="nowrap">{t.deviceId.replace("tp", "TapPoint ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// 2. Dashboard - Selected Space
// ============================================================
function DashboardSelectedSpace({ spaceId, onNav, onSelectExperience, spaceCtx, setSpaceCtx, period, setPeriod, frequency, setFrequency, ai }) {
  ai = ai || {};
  const [showAllTaps, setShowAllTaps] = useStateDash(false);
  const [tpFilter, setTpFilter] = useStateDash("");
  const [visibleMetrics, setVisibleMetrics] = useStateDash({ totalTaps: true, uniqueVisitors: true, leadsCaptured: true, conversionRate: true });
  const toggleMetric = (k) => setVisibleMetrics((v) => ({ ...v, [k]: !v[k] }));
  const space = window.DATA.SPACES.find(s => s.id === spaceId) || window.DATA.SPACES[0];
  const insights = useMemoDash(
    () => space ? window.computeDashboardInsights({ period, spaceCtx: space.id, frequency, tone: ai.aiTone || "factual" }) : null,
    [period, frequency, ai.aiTone, space && space.id, window.DATA.EXPERIENCES.length, window.DATA.TAPPOINTS.length]
  );
  if (!space) {
    return (
      <>
        <Topbar title="Dashboard" subtitle="No spaces yet — create one to get started." />
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 8px" }}>No spaces configured</p>
          <p style={{ fontSize: 13, color: "var(--ink-600)", margin: 0 }}>Adjust the Tweaks panel or add a space to populate this view.</p>
        </div>
      </>
    );
  }
  const multi = window.multiSeriesForPeriod(period, space.id, frequency);
  const topExperiences = window.experiencesForPeriod(period, space.id);
  const tappoints = window.DATA.TAPPOINTS.filter(t => t.spaceId === space.id);
  const m = window.metricsForPeriod(period, space.id);
  const vsLabel = window.previousPeriodLabel(period);
  const fmt = window.fmtDelta;
  const stats = [
    { label: "Total Taps", statKey: "totalTaps", value: m.totalTaps.toLocaleString(), delta: fmt(m.tapsDelta), icon: <Icon.TapHand />, kind: "green" },
    { label: "Unique Taps", statKey: "uniqueVisitors", value: m.uniqueVisitors.toLocaleString(), delta: fmt(m.visitorsDelta), icon: <Icon.Users />, kind: "purple" },
    { label: "Leads Captured", statKey: "leadsCaptured", value: m.leadsCaptured.toLocaleString(), delta: fmt(m.leadsDelta), icon: <Icon.Doc />, kind: "blue" },
    { label: "Conversion Rate", statKey: "conversionRate", value: m.conversionRate.toFixed(1) + "%", delta: fmt(m.conversionDelta.toFixed(1), "pp"), icon: <Icon.Trend />, kind: "orange" },
  ];
  return (
    <>
      <Topbar title="Dashboard" subtitle="Welcome Back, Joe! Here's what's happening." />
      <div className="dash-period-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SpaceSwitcher value={spaceCtx} onChange={setSpaceCtx} />
          <PeriodControl value={period} onChange={setPeriod} simple />
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i} style={{ position: "relative" }}>
            {ai.aiChips !== false && <span style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}><ExplainChip statKey={s.statKey} insights={insights} /></span>}
            <div className={"stat-icon stat-icon--" + s.kind}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <p className="stat-label">{s.label}</p>
              <div className="stat-value">{s.value}<span className={"delta " + (String(s.delta).startsWith("-") ? "delta--down" : "delta--up")}>{s.delta}</span></div>
              <p className="stat-foot">{vsLabel}</p>
            </div>
          </div>
        ))}
      </div>
      {ai.aiPanel !== false && <AIInsightsPanel insights={insights} onNav={onNav} period={period} sessionKey={(space && space.id) || "selected"} />}

      {/* Full-width tap performance chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Tap Performance</h3>
            <p className="card-subtitle">Overlay metrics for {space.name} — toggle any to focus</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(() => { const r = window.periodRange(period); return (<span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>); })()}
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
              conversionRate: m.conversionRate.toFixed(1) + "%",
            }}
            onToggle={toggleMetric}
          />
        </div>
        <div className="chart-wrap" style={{ paddingTop: 6, paddingBottom: 18 }}>
          <MultiLineChart data={multi} metrics={TAPS_METRICS} visible={visibleMetrics} frequency={frequency} height={320} />
        </div>
      </div>

      {/* Two equal columns: TapPoints | Top Experiences */}
      <div className="dash-grid-equal">
        <div className="card dash-equal-card dash-fixed-card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <div>
              <h3 className="card-title">TapPoints</h3>
              <p className="card-subtitle">{tappoints.length} {tappoints.length === 1 ? "device" : "devices"} assigned to {space.name}</p>
            </div>
            <button className="btn btn--primary btn--sm" onClick={() => onNav("tappoints")}>
              <Icon.Plus /> Add New TapPoint
            </button>
          </div>
          <div style={{ padding: "0 26px 8px" }}>
            <div className="input-search" style={{ marginBottom: 4 }}>
              <span className="icon-search"><Icon.Search /></span>
              <input placeholder="Filter by name" value={tpFilter} onChange={(e) => setTpFilter(e.target.value)} />
            </div>
          </div>
          {(() => {
            const filtered = tappoints.filter((t) => !tpFilter || t.name.toLowerCase().includes(tpFilter.toLowerCase()));
            return (
              <Paginator items={filtered} defaultPerPage={5} itemLabel="TapPoint">
                {(pageItems) => (
                  <div className="row-list">
                    {pageItems.length === 0 && <div className="empty-row">No TapPoints match your filter.</div>}
                    {pageItems.map((t) => {
                      const exp = window.DATA.EXPERIENCES.find(e => e.id === t.experienceId);
                      const isActive = (t.status || "").toLowerCase() === "active";
                      return (
                        <div className="row" key={t.id} onClick={() => onNav("tappoints")}>
                          <div className="tp-avatar" aria-hidden="true">
                            <Icon.TapPoints />
                          </div>
                          <div className="row-main">
                            <p className="row-title">{t.name}</p>
                            <p className="row-sub">
                              {exp ? exp.name : "Unassigned"} • XUID {t.xuid}<br />
                              Last updated: {t.updated}
                            </p>
                          </div>
                          <div className="row-right">
                            <span className={"pill " + (isActive ? "pill--green" : "pill--red")}>{t.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Paginator>
            );
          })()}
        </div>

        <div className="card dash-equal-card dash-fixed-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top Experiences</h3>
              <p className="card-subtitle">Ranked by taps this period</p>
            </div>
            {(() => { const r = window.periodRange(period); return (<span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>); })()}
          </div>
          <Paginator items={topExperiences} defaultPerPage={5} perPageOptions={[5, 10, 25, 50]} itemLabel="experience">
            {(pageItems, info) => (
              <div className="top-exp top-exp--scroll">
                {pageItems.length === 0 && <div className="empty-row">No experiences yet.</div>}
                {pageItems.map((e, i) => (
                  <div className="row-exp" key={e.id} onClick={() => onSelectExperience ? onSelectExperience(e.id) : onNav("experiences")} style={{ cursor: "pointer" }}>
                    <span className="rank">#{info.start + i + 1}</span>
                    <div>
                      <div className="exp-name exp-name--link">{e.name}</div>
                      <div className="exp-type">{e.type}</div>
                    </div>
                    <div className="exp-spark"><Sparkline data={[6, 9, 7, 12, 14, 16, Math.max(4, 22 - i * 2)]} /></div>
                    <div>
                      <div className="exp-count">{e.taps}</div>
                      <div className={"exp-delta " + (e.delta > 0 ? "delta--up" : "delta--down")}>{e.delta > 0 ? "+" : ""}{e.delta}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Paginator>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card dash-fixed-card dash-fixed-card--wide" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Taps</h3>
              <p className="card-subtitle">Latest visitor activity in {space.name}</p>
            </div>
            {(() => { const r = window.periodRange(period); return (<span className="report-range-chip" title="Date range for the data shown"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><span>{window.formatRange(r.startISO, r.endISO)}</span></span>); })()}
          </div>
          {(() => {
            const spaceTaps = window.DATA.RECENT_TAPS.filter(t => {
              const exp = window.DATA.EXPERIENCES.find(e => e.id === t.experienceId);
              return exp && exp.spaceId === space.id;
            }).map((t) => {
              const exp = window.DATA.EXPERIENCES.find((e) => e.id === t.experienceId);
              return { ...t, expName: exp ? exp.name : "", deviceName: t.deviceId.replace("tp", "TapPoint ") };
            });
            return <RecentTapsTable items={spaceTaps} columns="space" />;
          })()}
        </div>
      </div>
      {showAllTaps && (
        <div className="modal-overlay" onClick={() => setShowAllTaps(false)}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="card-title">All Recent Taps</h3>
                <p className="card-subtitle">{window.DATA.RECENT_TAPS.length} entries in {space ? space.name : ""}</p>
              </div>
              <button className="btn btn--icon" onClick={() => setShowAllTaps(false)} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <table className="subtable">
                <thead>
                  <tr><th>Visitor</th><th>Email</th><th>Date</th><th>Experience</th><th>Device</th></tr>
                </thead>
                <tbody>
                  {window.DATA.RECENT_TAPS.filter(t => {
                    const exp = window.DATA.EXPERIENCES.find(e => e.id === t.experienceId);
                    return exp && exp.spaceId === space.id;
                  }).map((t, i) => {
                    const exp = window.DATA.EXPERIENCES.find(e => e.id === t.experienceId);
                    return (
                      <tr key={i}>
                        <td>{t.anonymous ? <span style={{ color: "var(--ink-500)", fontStyle: "italic" }}>Anonymous</span> : t.name}</td>
                        <td className="muted nowrap">{t.anonymous ? "—" : t.email}</td>
                        <td className="muted nowrap">{t.date}</td>
                        <td>{exp ? exp.name : "—"}</td>
                        <td className="nowrap">{t.deviceId.replace("tp", "TapPoint ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { DashboardAllSpaces, DashboardSelectedSpace, LineChart, Sparkline, RecentTapsTable });
