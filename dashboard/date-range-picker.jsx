// Date range picker styled after the Power-BI / "Last N days" segmented dropdown.
// Drops in next to the Save-as-segment button on Experience Edit.

const { useState: useStateDRP, useEffect: useEffectDRP, useRef: useRefDRP } = React;

const REF_TODAY = new Date(2026, 4, 22); // Matches REFERENCE_END_ISO (May 22, 2026)
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LETTERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function toISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fromISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtShort(d) {
  return d.toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "/");
}

// ────────────────────────────────────────────────────────────────────
// Main picker
// ────────────────────────────────────────────────────────────────────
function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useStateDRP(false);
  const ref = useRefDRP(null);

  useEffectDRP(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Local working state — applied on Apply
  const initialKind = (value && value.kind) || "lastN";
  const initialN = value && value.kind === "lastN" ? (value.n || 3) : 3;
  const initialRange = (() => {
    if (value && value.kind === "custom") return { start: fromISO(value.startISO), end: fromISO(value.endISO) };
    return { start: new Date(REF_TODAY.getTime() - 2 * 86400000), end: new Date(REF_TODAY) };
  })();

  const [mode, setMode] = useStateDRP(initialKind === "today" || initialKind === "yesterday" || initialKind === "custom" || initialKind === "lastN" || initialKind === "all" ? initialKind : "lastN");
  const [nDays, setNDays] = useStateDRP(initialN);
  const [customRange, setCustomRange] = useStateDRP(initialRange);

  const apply = (next) => { onChange(next); setOpen(false); };
  const applyCurrent = () => {
    if (mode === "today") apply({ kind: "today" });
    else if (mode === "yesterday") apply({ kind: "yesterday" });
    else if (mode === "all") apply({ kind: "all" });
    else if (mode === "custom" && customRange.start && customRange.end) {
      const s = customRange.start <= customRange.end ? customRange.start : customRange.end;
      const e = customRange.start <= customRange.end ? customRange.end : customRange.start;
      apply({ kind: "custom", startISO: toISO(s), endISO: toISO(e) });
    } else {
      apply({ kind: "lastN", n: Math.max(1, parseInt(nDays, 10) || 1) });
    }
  };

  // Trigger label
  const label = (() => {
    if (!value) return "Last 28 days";
    if (value.kind === "today") return "Today";
    if (value.kind === "yesterday") return "Yesterday";
    if (value.kind === "all") return "All time";
    if (value.kind === "lastN") return "Last " + (value.n || 28) + " days";
    if (value.kind === "custom") {
      const s = fromISO(value.startISO);
      const e = fromISO(value.endISO);
      if (!s || !e) return "Custom range";
      const sameYear = s.getFullYear() === e.getFullYear();
      const f = (d, withYear) => d.toLocaleString("en-US", { month: "short" }) + " " + d.getDate() + (withYear ? ", " + d.getFullYear() : "");
      return sameYear ? f(s) + " – " + f(e, true) : f(s, true) + " – " + f(e, true);
    }
    return window.periodLabel ? window.periodLabel(value) : "Last 28 days";
  })();

  return (
    <div className="drp" ref={ref}>
      <button type="button" className={"drp-trigger" + (open ? " is-open" : "")} onClick={() => setOpen((o) => !o)}>
        <span>{label}</span>
        <Icon.Caret />
      </button>
      {open && (
        <div className="drp-pop">
          <div className="drp-options">
            <label className="drp-opt">
              <input
                type="radio"
                name="drp"
                checked={mode === "today"}
                onChange={() => { setMode("today"); apply({ kind: "today" }); }}
              />
              <span className="drp-opt__dot" />
              <span className="drp-opt__label">Today</span>
            </label>
            <label className="drp-opt">
              <input
                type="radio"
                name="drp"
                checked={mode === "yesterday"}
                onChange={() => { setMode("yesterday"); apply({ kind: "yesterday" }); }}
              />
              <span className="drp-opt__dot" />
              <span className="drp-opt__label">Yesterday</span>
            </label>
            <label className="drp-opt">
              <input
                type="radio"
                name="drp"
                checked={mode === "all"}
                onChange={() => { setMode("all"); apply({ kind: "all" }); }}
              />
              <span className="drp-opt__dot" />
              <span className="drp-opt__label">All time</span>
            </label>
            <label className="drp-opt drp-opt--inline">
              <input type="radio" name="drp" checked={mode === "lastN"} onChange={() => setMode("lastN")} />
              <span className="drp-opt__dot" />
              <span className="drp-opt__label">Last</span>
              <input
                type="number"
                className="drp-n-input"
                min={1} max={365}
                value={nDays}
                onFocus={() => setMode("lastN")}
                onChange={(e) => setNDays(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyCurrent(); }}
              />
              <span className="drp-opt__label">days</span>
              {mode === "lastN" && (
                <button type="button" className="drp-apply-inline" onClick={applyCurrent}>Apply</button>
              )}
            </label>
            <label className="drp-opt">
              <input type="radio" name="drp" checked={mode === "custom"} onChange={() => setMode("custom")} />
              <span className="drp-opt__dot" />
              <span className="drp-opt__label">Custom</span>
            </label>
          </div>

          {mode === "custom" && (
            <CustomRangePanel
              range={customRange}
              onChange={setCustomRange}
              onCancel={() => setOpen(false)}
              onApply={applyCurrent}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Custom range — dual calendar + time selectors
// ────────────────────────────────────────────────────────────────────
function CustomRangePanel({ range, onChange, onCancel, onApply }) {
  // Anchor each calendar to a month
  const [leftMonth, setLeftMonth] = useStateDRP(() => new Date(range.start.getFullYear(), range.start.getMonth(), 1));
  const [rightMonth, setRightMonth] = useStateDRP(() => new Date(range.end.getFullYear(), range.end.getMonth(), 1));
  const [pickingEnd, setPickingEnd] = useStateDRP(false); // false = picking start, true = picking end

  const onDayClick = (d) => {
    if (!pickingEnd) {
      onChange({ start: d, end: range.end && range.end >= d ? range.end : d });
      setPickingEnd(true);
    } else {
      // Ensure end >= start
      if (d < range.start) onChange({ start: d, end: range.start });
      else onChange({ start: range.start, end: d });
      setPickingEnd(false);
    }
  };

  // Strip date for the heading
  const fmtBig = (d) => d.toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  const startStr = fmtBig(range.start);
  const endStr = fmtBig(range.end);

  return (
    <div className="drp-custom">
      <div className="drp-custom__strip">
        <span className="drp-custom__strip-text">{startStr} - {endStr}</span>
      </div>
      <div className="drp-custom__cols">
        <DateColumn
          title="From"
          month={leftMonth}
          setMonth={setLeftMonth}
          range={range}
          onClick={onDayClick}
          isStart
          maxDate={range.end}
        />
        <DateColumn
          title="To"
          month={rightMonth}
          setMonth={setRightMonth}
          range={range}
          onClick={onDayClick}
          minDate={range.start}
        />
      </div>
      <div className="drp-custom__foot">
        <button type="button" className="drp-btn drp-btn--primary" onClick={onApply}>Apply</button>
        <button type="button" className="drp-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function DateColumn({ title, month, setMonth, range, onClick, minDate, maxDate, isStart }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  // Build a 6×7 grid starting from the Sunday before first
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const offset = i - startDow;
    const d = new Date(month.getFullYear(), month.getMonth(), 1 + offset);
    cells.push(d);
  }

  const inRange = (d) => range.start && range.end && d >= range.start && d <= range.end;
  const isStartD = (d) => range.start && toISO(d) === toISO(range.start);
  const isEndD = (d) => range.end && toISO(d) === toISO(range.end);
  const isOutside = (d) => d.getMonth() !== month.getMonth();
  const isDisabled = (d) => {
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return false;
  };

  return (
    <div className="drp-col">
      <div className="drp-col__title">{title}</div>
      <div className="drp-col__monthrow">
        <span className="drp-col__month">{MONTH_NAMES[month.getMonth()]} {month.getFullYear()}</span>
        <span className="drp-col__nav">
          <button type="button" className="drp-iconbtn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" className="drp-iconbtn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M3 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </span>
      </div>
      <div className="drp-col__grid">
        {DAY_LETTERS.map((d) => <span key={d} className="drp-col__dow">{d}</span>)}
        {cells.map((d, i) => {
          const cls = "drp-day"
            + (isOutside(d) ? " drp-day--out" : "")
            + (isDisabled(d) ? " drp-day--disabled" : "")
            + (inRange(d) && !isStartD(d) && !isEndD(d) ? " drp-day--in" : "")
            + (isStartD(d) ? " drp-day--start" : "")
            + (isEndD(d) ? " drp-day--end" : "");
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={isDisabled(d) || isOutside(d)}
              onClick={() => onClick(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeRow({ hour, min, ap }) {
  return (
    <div className="drp-time">
      <span className="drp-time__cell">
        <span>{String(hour).padStart(2, "0")}</span>
        <Icon.Caret />
      </span>
      <span className="drp-time__cell">
        <span>{String(min).padStart(2, "0")}</span>
        <Icon.Caret />
      </span>
      <span className="drp-time__cell">
        <span>{ap}</span>
        <Icon.Caret />
      </span>
    </div>
  );
}

Object.assign(window, { DateRangePicker });
