// Dashboard widgets: multi-series chart, legend chips, paginator
const { useState: useStateWidgets, useMemo: useMemoWidgets } = React;

const TAPS_METRICS = [
  { key: "totalTaps", label: "Total Taps", color: "#007DF9", axis: "left", fmt: (v) => Math.round(v).toLocaleString() },
  { key: "uniqueVisitors", label: "Unique Taps", color: "#7434c2", axis: "left", fmt: (v) => Math.round(v).toLocaleString() },
  { key: "leadsCaptured", label: "Leads Captured", color: "#1c8a36", axis: "left", fmt: (v) => Math.round(v).toLocaleString() },
  { key: "conversionRate", label: "Conversion Rate", color: "#E07C2A", axis: "right", fmt: (v) => v.toFixed(1) + "%" },
];

// ─────────────────────────────────────────────────────────────
// Legend chips — colored dot + label + total; click to toggle
// ─────────────────────────────────────────────────────────────
function LegendChips({ metrics, visible, totals, onToggle }) {
  return (
    <div className="legend-chips">
      {metrics.map((m) => {
        const on = visible[m.key];
        return (
          <button
            key={m.key}
            type="button"
            className={"legend-chip" + (on ? "" : " is-off")}
            onClick={() => onToggle(m.key)}
            aria-pressed={on}
          >
            <span className="legend-chip__dot" style={{ background: on ? m.color : "transparent", borderColor: m.color }}></span>
            <span className="legend-chip__label">{m.label}</span>
            <span className="legend-chip__value">{totals[m.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MultiLineChart — overlays multiple series with dual y-axis
// ─────────────────────────────────────────────────────────────
function MultiLineChart({ data, metrics, visible, frequency, height = 300 }) {
  const [hover, setHover] = useStateWidgets(null);
  const dates = data.dates;
  const N = dates.length;
  const width = 1080;

  const visMetrics = metrics.filter((m) => visible[m.key]);
  const leftVis = visMetrics.filter((m) => m.axis === "left");
  const rightVis = visMetrics.filter((m) => m.axis === "right");

  const leftRaw = Math.max(40, ...leftVis.flatMap((m) => data[m.key]));
  const leftMax = Math.max(10, Math.ceil(leftRaw / 10) * 10);
  const rightMax = 100;

  const _willRotate = N > 12;
  const padL = leftVis.length ? 44 : 20;
  const padR = rightVis.length ? 48 : 20;
  const padT = 14;
  const padB = _willRotate ? 64 : 30;
  const w = width - padL - padR;
  const h = height - padT - padB;

  const x = (i) => padL + (N <= 1 ? w / 2 : (i / (N - 1)) * w);
  const yLeft = (v) => padT + h - (v / leftMax) * h;
  const yRight = (v) => padT + h - (v / rightMax) * h;
  const yFor = (m, v) => m.axis === "left" ? yLeft(v) : yRight(v);

  const leftTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * leftMax));
  const rightTicks = [0, 25, 50, 75, 100];

  // Cap label count so they never overlap, regardless of frequency.
  // Each label needs ~60px of horizontal viewBox space when rotated.
  const minLabelSpacing = 60;
  const maxLabels = Math.max(2, Math.floor(w / minLabelSpacing));
  const showAllLabels = N <= maxLabels;
  const labelCount = showAllLabels ? N : maxLabels;
  const xTicks = showAllLabels
    ? Array.from({ length: N }, (_, i) => i)
    : Array.from({ length: labelCount }, (_, k) =>
        labelCount === 1 ? 0 : Math.round((k / (labelCount - 1)) * (N - 1))
      );
  const rotateLabels = xTicks.length > 7;
  const dotIndices = (frequency === "daily" && N >= 90)
    ? []
    : Array.from({ length: N }, (_, i) => i);

  const labelFor = (i) => {
    const d = dates[i];
    if (!d) return "";
    if (frequency === "monthly") return d.toLocaleString("en-US", { month: "short" }) + " " + d.getFullYear();
    if (frequency === "quarterly") return "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + d.getFullYear();
    return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
  };
  const fullLabelFor = (i) => {
    const d = dates[i];
    if (!d) return "";
    if (frequency === "monthly") return d.toLocaleString("en-US", { month: "long", year: "numeric" });
    if (frequency === "weekly") return "Week of " + d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    if (px < padL || px > padL + w) { setHover(null); return; }
    const rel = N <= 1 ? 0 : (px - padL) / w;
    const idx = Math.max(0, Math.min(N - 1, Math.round(rel * (N - 1))));
    setHover(idx);
  };

  // build paths once per metric
  const paths = {};
  metrics.forEach((m) => {
    const vals = data[m.key] || [];
    const pts = vals.map((v, i) => [x(i), yFor(m, v)]);
    paths[m.key] = {
      pts,
      d: pts.map((p, i) => (i === 0 ? "M" + p[0] + "," + p[1] : "L" + p[0] + "," + p[1])).join(" "),
    };
  });

  // soft area fill on first visible left-axis series only
  const fillKey = leftVis[0]?.key;
  let areaPath = null;
  if (fillKey && N > 0) {
    const p = paths[fillKey].pts;
    areaPath = paths[fillKey].d + " L" + p[p.length - 1][0] + "," + (padT + h) + " L" + p[0][0] + "," + (padT + h) + " Z";
  }

  return (
    <svg
      viewBox={"0 0 " + width + " " + height}
      style={{ display: "block", width: "100%" }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="mlgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={leftVis[0]?.color || "#007DF9"} stopOpacity="0.13" />
          <stop offset="100%" stopColor={leftVis[0]?.color || "#007DF9"} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* y-grid + left axis ticks */}
      {leftVis.length > 0 && leftTicks.map((t) => (
        <g key={"lt-" + t}>
          <line x1={padL} x2={padL + w} y1={yLeft(t)} y2={yLeft(t)} stroke="#E5EEF8" strokeDasharray="3 4" />
          <text x={padL - 8} y={yLeft(t) + 3} fontSize="10" fill="rgba(20,29,35,0.55)" textAnchor="end" fontFamily="Poppins">{t.toLocaleString()}</text>
        </g>
      ))}
      {leftVis.length === 0 && rightVis.length > 0 && rightTicks.map((t) => (
        <line key={"gt-" + t} x1={padL} x2={padL + w} y1={yRight(t)} y2={yRight(t)} stroke="#E5EEF8" strokeDasharray="3 4" />
      ))}
      {/* right axis ticks (conversion %) */}
      {rightVis.length > 0 && rightTicks.map((t) => (
        <text key={"rt-" + t} x={padL + w + 8} y={yRight(t) + 3} fontSize="10" fill="rgba(224,124,42,0.85)" textAnchor="start" fontFamily="Poppins">{t}%</text>
      ))}

      {/* x labels */}
      {xTicks.map((t) => (
        rotateLabels ? (
          <text key={"xl-" + t} x={x(t)} y={padT + h + 14} fontSize="10" fill="rgba(20,29,35,0.55)" textAnchor="end" fontFamily="Poppins" transform={"rotate(-40 " + x(t) + " " + (padT + h + 14) + ")"}>
            {labelFor(t)}
          </text>
        ) : (
          <text key={"xl-" + t} x={x(t)} y={padT + h + 18} fontSize="10" fill="rgba(20,29,35,0.55)" textAnchor="middle" fontFamily="Poppins">
            {labelFor(t)}
          </text>
        )
      ))}

      {/* area under first visible left series */}
      {areaPath && <path d={areaPath} fill="url(#mlgrad)" />}

      {/* lines */}
      {visMetrics.map((m) => (
        <path key={"ln-" + m.key} d={paths[m.key].d} fill="none" stroke={m.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      ))}

      {/* dots */}
      {visMetrics.map((m) => (
        dotIndices.map((i) => (
          <circle key={"dt-" + m.key + "-" + i} cx={paths[m.key].pts[i][0]} cy={paths[m.key].pts[i][1]} r="3" fill="#fff" stroke={m.color} strokeWidth="1.75" />
        ))
      ))}

      {/* hover */}
      {hover != null && visMetrics.length > 0 && (
        <g pointerEvents="none">
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + h} stroke="#7CA0CD" strokeOpacity="0.45" strokeDasharray="3 3" />
          {visMetrics.map((m) => (
            <circle key={"hd-" + m.key} cx={paths[m.key].pts[hover][0]} cy={paths[m.key].pts[hover][1]} r="4.5" fill={m.color} stroke="#fff" strokeWidth="2" />
          ))}
          {(() => {
            const dateTxt = fullLabelFor(hover);
            const rows = visMetrics.map((m) => ({ label: m.label, value: m.fmt(data[m.key][hover]), color: m.color }));
            const charW = 6.0;
            const longest = Math.max(dateTxt.length, ...rows.map((r) => (r.label + " " + r.value).length + 4));
            const labelW = longest * charW + 22;
            const labelH = 32 + rows.length * 14; // 22 top + per-row spacing + 10 bottom padding
            let tx = x(hover) - labelW / 2;
            tx = Math.max(padL + 2, Math.min(padL + w - labelW - 2, tx));
            const ty = Math.max(padT + 2, paths[visMetrics[0].key].pts[hover][1] - labelH - 12);
            return (
              <g filter="url(#mlc-tip-shadow)">
                <defs>
                  <filter id="mlc-tip-shadow" x="-20%" y="-20%" width="140%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0B1530" floodOpacity="0.15" />
                  </filter>
                </defs>
                <rect x={tx} y={ty} width={labelW} height={labelH} rx="8" fill="#FFFFFF" stroke="#E5EEF8" strokeWidth="1" />
                <text x={tx + 11} y={ty + 14} fontSize="10" fontWeight="600" fill="rgba(20,29,35,0.55)" fontFamily="Poppins">{dateTxt}</text>
                {rows.map((r, i) => (
                  <g key={"tr-" + i}>
                    <circle cx={tx + 14} cy={ty + 30 + i * 14} r="3.5" fill={r.color} />
                    <text x={tx + 22} y={ty + 33 + i * 14} fontSize="10.5" fill="rgba(20,29,35,0.75)" fontFamily="Poppins">{r.label}</text>
                    <text x={tx + labelW - 10} y={ty + 33 + i * 14} fontSize="10.5" fontWeight="600" fill="#141D23" textAnchor="end" fontFamily="Poppins">{r.value}</text>
                  </g>
                ))}
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// useSortableData — generic table-sort hook. `sortKey` is a string
// key on the item, OR a function (item) => sortable value.
// ─────────────────────────────────────────────────────────────
function useSortableData(items, initialKey = null, initialDir = "asc") {
  const [sortKey, setSortKey] = useStateWidgets(initialKey);
  const [sortDir, setSortDir] = useStateWidgets(initialDir);
  const sorted = useMemoWidgets(() => {
    if (!sortKey) return items;
    const arr = items.slice();
    arr.sort((a, b) => {
      const av = typeof sortKey === "function" ? sortKey(a) : a[sortKey];
      const bv = typeof sortKey === "function" ? sortKey(b) : b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av instanceof Date && bv instanceof Date) return av - bv;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    });
    if (sortDir === "desc") arr.reverse();
    return arr;
  }, [items, sortKey, sortDir]);
  const requestSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  return { sorted, sortKey, sortDir, requestSort };
}

// ─────────────────────────────────────────────────────────────
// SortTh — clickable <th> with asc/desc indicator
// ─────────────────────────────────────────────────────────────
function SortTh({ columnKey, sortKey, sortDir, onSort, children, align, style }) {
  const active = sortKey === columnKey;
  return (
    <th
      className={"sort-th" + (active ? " is-active" : "")}
      style={{ cursor: "pointer", ...(style || {}) }}
      onClick={() => onSort(columnKey)}
    >
      <span className="sort-th__inner" style={align === "right" ? { justifyContent: "flex-end" } : undefined}>
        <span>{children}</span>
        <span className="sort-th__arrows" aria-hidden="true">
          <span className={"sort-th__arrow sort-th__arrow--up" + (active && sortDir === "asc" ? " is-on" : "")}>▲</span>
          <span className={"sort-th__arrow sort-th__arrow--down" + (active && sortDir === "desc" ? " is-on" : "")}>▼</span>
        </span>
      </span>
    </th>
  );
}

// ─────────────────────────────────────────────────────────────
// Paginator — render-prop component
//   <Paginator items={...} defaultPerPage={5}>{(pageItems, info) => ...}</Paginator>
// ─────────────────────────────────────────────────────────────
function Paginator({ items, defaultPerPage = 5, perPageOptions = [5, 10, 25, 50], itemLabel = "item", children }) {
  const [perPage, setPerPage] = useStateWidgets(defaultPerPage);
  const [page, setPage] = useStateWidgets(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageItems = items.slice(start, end);

  // Reset to first page if items shrink
  React.useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);

  return (
    <>
      <div className="paginator-body">
        {children(pageItems, { total, start, end, page: safePage, totalPages })}
      </div>
      <div className="paginator">
        <div className="paginator__left">
          <span className="paginator__label">Show</span>
          <select className="paginator__select" value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(1); }}>
            {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="paginator__label">
            {total === 0 ? "No " + itemLabel + "s" : (start + 1) + "–" + end + " of " + total}
          </span>
        </div>
        <div className="paginator__right">
          <button className="paginator__btn" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} aria-label="Previous page">‹</button>
          <span className="paginator__page">Page {safePage} of {totalPages}</span>
          <button className="paginator__btn" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} aria-label="Next page">›</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { MultiLineChart, LegendChips, Paginator, TAPS_METRICS, useSortableData, SortTh });
