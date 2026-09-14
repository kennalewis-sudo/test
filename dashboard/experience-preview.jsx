// Mobile-page preview of an experience + click/scroll heatmap overlays.
// Used both inside the Configure tab right column and the Insights tab.

const { useState: useStatePrev, useRef: useRefPrev, useEffect: useEffectPrev } = React;

// Sized so the same content can be embedded either in a phone bezel or
// inside a heatmap stage. All hotspot Y positions are expressed as
// percentages of the rendered page so they scale with the container.
const PREVIEW_PAGE_WIDTH = 320;
const PREVIEW_PAGE_HEIGHT = 720;

// ────────────────────────────────────────────────────────────────────
// The actual mobile-page content (matches the design comp the user attached)
// ────────────────────────────────────────────────────────────────────
function ExperiencePreviewPage({ title, subtitle, body, captionTitle, captionSub, secondaryBody, ctaTitle, ctaSub }) {
  title = title || "Dinosaur Discoveries";
  subtitle = subtitle || "Windows on a Prehistoric World";
  body = body || "Dinosaurs are one of the great success stories of evolution, dominating the Earth for 160 million years. Spectacular new discoveries about their lifestyles are being made all the time, demonstrating the extraordinary diversity of life in the age when these reptiles ruled the world.";
  captionTitle = captionTitle || "Stegosaurus";
  captionSub = captionSub || "Late Jurassic Period, ~150 million years ago";
  secondaryBody = secondaryBody || "The most complete Stegosaurus skeleton in the world, this individual lived about 150 million years ago, during the Late Jurassic Period. Experts are studying the skeleton to uncover more about its evolution and behaviour.";
  ctaTitle = ctaTitle || "Interested in Natural history?";
  ctaSub = ctaSub || "Get updates with your personalized Culture Weekly.";

  return (
    <div className="ep-page" style={{ width: PREVIEW_PAGE_WIDTH }}>
      {/* Hero */}
      <div className="ep-hero">
        <SkullArt />
        <div className="ep-hero__logo">
          <span className="ep-hero__logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M2 22h20" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M4 20V11M8 20V11M12 20V11M16 20V11M20 20V11" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M2 11h20l-2-2H4l-2 2Z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M3 9 12 3l9 6" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="ep-hero__logo-text">
            <span>NATURAL HISTORY</span>
            <span className="ep-hero__logo-sub">MUSEUM</span>
          </span>
        </div>
        <div className="ep-hero__textblock">
          <div className="ep-hero__title">{title}</div>
          <div className="ep-hero__sub">{subtitle}</div>
        </div>
      </div>

      {/* Body 1 */}
      <p className="ep-body">{body.split("160 million years").map((part, i, arr) => (
        <React.Fragment key={i}>
          {part}
          {i < arr.length - 1 && <strong>160 million years.</strong>}
        </React.Fragment>
      ))}</p>

      {/* Image card */}
      <div className="ep-imgcard">
        <div className="ep-imgcard__img"><StegoArt /></div>
        <div className="ep-imgcard__cap">
          <div className="ep-imgcard__cap-title">{captionTitle}</div>
          <div className="ep-imgcard__cap-sub">{captionSub}</div>
        </div>
      </div>

      {/* Body 2 */}
      <p className="ep-body ep-body--secondary">{secondaryBody}</p>

      {/* CTA card */}
      <div className="ep-cta">
        <div className="ep-cta__head">
          <div className="ep-cta__icon"><TrilobiteArt /></div>
          <div className="ep-cta__textblock">
            <div className="ep-cta__title">{ctaTitle}</div>
            <div className="ep-cta__sub">{ctaSub}</div>
          </div>
          <button className="ep-cta__close" aria-label="Dismiss">×</button>
        </div>
        <div className="ep-cta__actions">
          <button className="ep-btn ep-btn--ghost">No, thanks</button>
          <button className="ep-btn ep-btn--solid">Sign up now</button>
        </div>
      </div>

      {/* Tail to make the page feel taller, with a second skeleton image */}
      <div className="ep-tail">
        <SkullArt small />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Phone-bezel frame around the preview content
// ────────────────────────────────────────────────────────────────────
function ExperiencePreviewFrame({ title, subtitle, scrollable = true }) {
  return (
    <div className="ep-frame">
      <div className="ep-frame__notch" />
      <div className={"ep-frame__screen" + (scrollable ? " is-scrollable" : "")}>
        <ExperiencePreviewPage title={title} subtitle={subtitle} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Insights heatmap card — mobile page + togglable overlay
// ────────────────────────────────────────────────────────────────────
// Hotspot model: each click hotspot has a y% (0-100) anchor on the
// rendered page. Scroll heatmap is a vertical gradient.
const CLICK_HOTSPOTS_BASE = [
  { id: "logo",     label: "Brand logo",            yPct: 5,   xPct: 22, weight: 0.40 },
  { id: "hero",     label: "Hero title",            yPct: 14,  xPct: 30, weight: 1.00 },
  { id: "body1",    label: "Intro paragraph",       yPct: 32,  xPct: 50, weight: 0.45 },
  { id: "stego",    label: "Stegosaurus image",     yPct: 50,  xPct: 50, weight: 0.85 },
  { id: "caption",  label: "Image caption",         yPct: 60,  xPct: 50, weight: 0.30 },
  { id: "body2",    label: "Secondary paragraph",   yPct: 70,  xPct: 50, weight: 0.25 },
  { id: "newsletter", label: "Newsletter card",     yPct: 81,  xPct: 50, weight: 0.55 },
  { id: "signup",   label: "Sign up now",           yPct: 86,  xPct: 70, weight: 0.95 },
  { id: "dismiss",  label: "No, thanks",            yPct: 86,  xPct: 30, weight: 0.30 },
];

function ExperienceHeatmapCard({ exp, title, collapsible, period, taps, clicks, open: openProp, onToggle }) {
  const [mode, setMode] = useStatePrev("clicks");
  const [hoverId, setHoverId] = useStatePrev(null);
  const [viewingUsersFor, setViewingUsersFor] = useStatePrev(null); // a click hotspot or null

  // Seeded click counts per hotspot, derived from experience id so they're stable
  const seed = (exp.id || "exp").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let s = seed;
  const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const baseTotal = 600 + Math.round(next() * 800);
  const clicksSeeded = CLICK_HOTSPOTS_BASE.map((h) => ({
    ...h,
    count: Math.max(2, Math.round(baseTotal * h.weight * (0.6 + next() * 0.8) / 5))
  }));
  // Rescale the per-hotspot counts so their sum matches the period's actual
  // total clicks (passed in from the parent), keeping the relative weights.
  const seededSum = clicksSeeded.reduce((a, c) => a + c.count, 0) || 1;
  const targetTotal = (clicks != null && clicks > 0) ? clicks : seededSum;
  const scale = targetTotal / seededSum;
  const clicksRaw = clicksSeeded.map((c) => ({ ...c, count: Math.max(1, Math.round(c.count * scale)) }));
  const total = clicksRaw.reduce((a, c) => a + c.count, 0);
  // Rank by clicks
  const ranked = clicksRaw
    .slice()
    .sort((a, b) => b.count - a.count)
    .map((c, i) => ({ ...c, rank: i + 1, pct: total > 0 ? Math.round((c.count / total) * 100) : 0 }));
  // Top-rank lookup by id (so pin numbers line up with the list)
  const rankById = Object.fromEntries(ranked.map((c) => [c.id, c.rank]));
  const totalPageViews = taps != null ? taps : Math.round(total * 0.62);
  const totalTaps = clicks != null ? clicks : Math.round(total * 1.25);

  return (
    <div className={"card ep-heatmap-card" + (collapsible && !openProp ? "" : " is-expanded")}>
      <div className={"card-header" + (collapsible ? " card-head--clickable" : "")} style={{ alignItems: "center", paddingBottom: 14 }} onClick={collapsible ? () => onToggle && onToggle() : undefined}>
        <div>
          <h3 className="card-title">Engagement on this page</h3>
          <p className="card-subtitle">See where visitors stopped scrolling and what they tapped</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={collapsible ? (e) => e.stopPropagation() : undefined}>
          {period && (() => {
            let label = "";
            try {
              const r = window.periodRange(period);
              label = window.formatRange(r.startISO, r.endISO);
            } catch (e) {
              if (period.kind === "today") label = "Today";
              else if (period.kind === "all") label = "All time";
              else if (period.kind === "lastN") label = "Last " + (period.n || 28) + " days";
            }
            if (!label) return null;
            return (
              <span
                className={"report-range-chip" + (collapsible ? " report-range-chip--clickable" : "")}
                title={collapsible ? "Date range for the data shown — click to expand" : "Date range for the data shown"}
                onClick={collapsible ? () => onToggle && onToggle() : (e) => e.stopPropagation()}
                role={collapsible ? "button" : undefined}
                tabIndex={collapsible ? 0 : undefined}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>{label}</span>
              </span>
            );
          })()}
          {!viewingUsersFor && (collapsible ? openProp : true) && (
            <div className="ep-heatmap-toggle" role="tablist">
              <button
                role="tab"
                className={"ep-heatmap-toggle__btn" + (mode === "clicks" ? " is-active" : "")}
                aria-selected={mode === "clicks"}
                onClick={() => setMode("clicks")}
              >
                Clicks
              </button>
              <button
                role="tab"
                className={"ep-heatmap-toggle__btn" + (mode === "scroll" ? " is-active" : "")}
                aria-selected={mode === "scroll"}
                onClick={() => setMode("scroll")}
              >
                Heatmap
              </button>
            </div>
          )}
          {collapsible && (
            <span onClick={() => onToggle && onToggle()} style={{ cursor: "pointer" }}>
              <span className={"card-chev" + (openProp ? " is-open" : "")} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </span>
          )}
        </div>
      </div>

      {(collapsible ? openProp : true) && (
        viewingUsersFor ? (
          <UsersForElementView
            exp={exp}
            element={viewingUsersFor}
            onBack={() => setViewingUsersFor(null)}
          />
        ) : mode === "clicks" ? (
          <ClicksView
            ranked={ranked}
            rankById={rankById}
            totalPageViews={totalPageViews}
            totalTaps={totalTaps}
            hoverId={hoverId}
            setHoverId={setHoverId}
            onViewUsers={(c) => setViewingUsersFor(c)}
            title={title}
          />
        ) : (
          <ScrollView exp={exp} title={title} totalPageViews={totalPageViews} totalTaps={totalTaps} />
        )
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Clicks view — ranked list (left) + page preview with numbered pins (right)
// ────────────────────────────────────────────────────────────────────
function ClicksView({ ranked, rankById, totalPageViews, totalTaps, hoverId, setHoverId, onViewUsers, title }) {
  return (
    <div className="ep-clicks-body">
      <div className="ep-clicks-list">
        <div className="ep-clicks-list__head">
          <div className="ep-clicks-list__title">Ranked by most clicks</div>
          <div className="ep-clicks-list__count">{ranked.length} elements</div>
        </div>
        <Paginator items={ranked} defaultPerPage={5} perPageOptions={[5, 10, 25, 50]} itemLabel="element">
          {(pageItems) => (
            <div className="ep-clicks-list__scroll">
              {pageItems.map((c) => (
                <div
                  key={c.id}
                  className={"ep-click-card" + (hoverId === c.id ? " is-active" : "")}
                  onMouseEnter={() => setHoverId(c.id)}
                  onMouseLeave={() => setHoverId((h) => h === c.id ? null : h)}
                >
                  <div className="ep-click-card__head">
                    <span className="ep-click-card__rank">{c.rank}</span>
                    <div className="ep-click-card__main">
                      <div className="ep-click-card__name">{c.label}</div>
                      <div className="ep-click-card__count">
                        <strong>{c.count}</strong> {c.count === 1 ? "click" : "clicks"} <span className="ep-click-card__pct">({c.pct}%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="ep-click-card__foot">
                    <button className="ep-click-card__view" onClick={() => onViewUsers && onViewUsers(c)}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 13.5c.7-2.5 2.9-4 5.5-4s4.8 1.5 5.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
                      <span>View users</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Paginator>
      </div>

      <div className="ep-clicks-preview">
        <div className="ep-heatmap-page ep-clicks-page">
          <ExperiencePreviewPage title={title} />
          <div className="ep-overlay ep-overlay--pins">
            {ranked.map((c, i, arr) => {
              // 1 for top rank, ~0 for last — drives the heat halo size & hue.
              const intensity = arr.length > 1 ? (arr.length - i - 1) / (arr.length - 1) : 1;
              return (
                <PinMarker
                  key={c.id}
                  c={c}
                  intensity={intensity}
                  active={hoverId === c.id}
                  onEnter={() => setHoverId(c.id)}
                  onLeave={() => setHoverId((h) => h === c.id ? null : h)}
                />
              );
            })}
          </div>
        </div>

        <div className="ep-clicks-footbar">
          <span className="ep-clicks-pill">{totalPageViews.toLocaleString()} taps</span>
          <span className="ep-clicks-pill">{totalTaps.toLocaleString()} clicks</span>
          <div className="ep-clicks-legend">
            <span className="ep-clicks-legend__cap">Most popular</span>
            <span className="ep-clicks-legend__bar" />
            <span className="ep-clicks-legend__cap">Least popular</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Users-for-element view (back-button screen inside the card)
// ────────────────────────────────────────────────────────────────────
function UsersForElementView({ exp, element, onBack }) {
  const seed = (exp.id + ":" + element.id).split("").reduce((a, c) => a + c.charCodeAt(0), 17);
  let s = seed;
  const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const FIRST = ["Sarah","Marcus","Priya","Daniel","Emma","Lucas","Yuki","Olivia","Aiden","Zara","Noah","Ava","Liam","Mia","Ethan","Charlotte","Logan","Amelia","Mason","Harper"];
  const LAST = ["Chen","Williams","Patel","Okafor","Thompson","Müller","Tanaka","Rossi","Wright","Khan","Martinez","Park","Singh","Garcia","Nguyen","Kowalski","Adebayo","Cohen","Larsen","Silva"];
  const CITIES = ["London, UK","New York, US","Tokyo, JP","Berlin, DE","Sydney, AU","Paris, FR","Toronto, CA","Madrid, ES","Mumbai, IN","Cape Town, ZA","São Paulo, BR","Stockholm, SE","Seoul, KR","Auckland, NZ"];
  // Use real TapPoint names from this experience's space, fall back to a synthetic name list
  const spaceTps = (window.DATA && window.DATA.TAPPOINTS || []).filter((t) => t.spaceId === exp.spaceId);
  const TP_NAMES = spaceTps.length > 0
    ? spaceTps.map((t) => t.name)
    : ["TapPoint 1","TapPoint 2","TapPoint 3","TapPoint 4","TapPoint 5"];

  const rowCount = Math.min(element.count, 40);
  const users = Array.from({ length: rowCount }, (_, i) => {
    const isAnon = next() > 0.55;
    const fi = Math.floor(next() * FIRST.length);
    const li = Math.floor(next() * LAST.length);
    const name = isAnon ? null : FIRST[fi] + " " + LAST[li];
    const email = isAnon ? null : (FIRST[fi] + "." + LAST[li]).toLowerCase().replace(/[^a-z.]/g, "") + "@example.com";
    const minutesAgo = Math.floor(next() * 60 * 24 * 27);
    const date = new Date(2026, 4, 22, 14, 0).getTime() - minutesAgo * 60 * 1000;
    const durationSec = 12 + Math.floor(next() * 240);
    const clicks = 1 + Math.floor(next() * 5);
    const city = CITIES[Math.floor(next() * CITIES.length)];
    const deviceName = TP_NAMES[Math.floor(next() * TP_NAMES.length)];
    return { id: i, name, email, isAnon, date: new Date(date), durationSec, clicks, city, deviceName };
  }).sort((a, b) => b.date - a.date);

  const fmtDate = (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const fmtDur = (sec) => {
    const m = Math.floor(sec / 60);
    const s2 = sec % 60;
    return m > 0 ? m + "m " + s2 + "s" : s2 + "s";
  };

  return (
    <div className="ep-users-view">
      <div className="ep-users-view__head">
        <button className="ep-users-view__back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 1 3 7l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Back to clicks</span>
        </button>
        <div className="ep-users-view__heading">
          <div className="ep-users-view__title">Users who clicked <strong>{element.label}</strong></div>
          <div className="ep-users-view__sub">{element.count.toLocaleString()} {element.count === 1 ? "click" : "clicks"} · {element.pct}% of all clicks</div>
        </div>
      </div>
      <div className="ep-users-view__body">
        <Paginator items={users} defaultPerPage={10} perPageOptions={[10, 25, 50, 100]} itemLabel="user">
          {(pageItems) => (
            <div className="ep-users-view__scroll">
              <table className="table ep-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Clicks</th>
                    <th>Location</th>
                    <th>Device name</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((u) => (
                    <tr key={u.id}>
                      <td>
                        {u.isAnon ? (
                          <span className="ep-users-anon">
                            <span className="ep-users-anon__dot" />
                            Anonymous visitor
                          </span>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: "var(--ink-600)" }}>{u.email}</div>
                          </div>
                        )}
                      </td>
                      <td className="muted">{fmtDate(u.date)}</td>
                      <td>{fmtDur(u.durationSec)}</td>
                      <td>{u.clicks}</td>
                      <td className="muted">{u.city}</td>
                      <td>{u.deviceName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Paginator>
      </div>
    </div>
  );
}

function PinMarker({ c, active, onEnter, onLeave, intensity = 0.5 }) {
  // Heat aura — radius grows with popularity, color shifts from red (hot)
  // for top-ranked elements through orange/yellow/green to blue (cold) for
  // the least-popular. Mirrors the "Most popular → Least popular" legend bar
  // below the preview.
  const heatStops = [
    { t: 1.00, color: "#FF3D2E" },
    { t: 0.82, color: "#FF7A1A" },
    { t: 0.62, color: "#FFD83D" },
    { t: 0.42, color: "#7BD874" },
    { t: 0.20, color: "#3FA9F5" },
    { t: 0.00, color: "#3FA9F5" },
  ];
  const heatColor = (() => {
    for (let i = 0; i < heatStops.length - 1; i++) {
      const a = heatStops[i], b = heatStops[i + 1];
      if (intensity <= a.t && intensity >= b.t) return a.color;
    }
    return heatStops[heatStops.length - 1].color;
  })();
  const heatSize = 56 + Math.round(intensity * 110); // 56..166px diameter
  const heatOpacity = 0.32 + intensity * 0.38;       // 0.32..0.70
  return (
    <div
      className={"ep-pin" + (active ? " is-active" : "")}
      style={{ left: c.xPct + "%", top: c.yPct + "%" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span
        className="ep-pin__heat"
        aria-hidden="true"
        style={{
          width: heatSize,
          height: heatSize,
          background: `radial-gradient(circle, ${heatColor} 0%, ${heatColor} 18%, rgba(255,255,255,0) 70%)`,
          opacity: heatOpacity,
        }}
      />
      <span className="ep-pin__num">{c.rank}</span>
      {active && (
        <div className="ep-pin__tip">
          <span className="ep-pin__tip-rank">{c.rank}</span>
          <div>
            <div className="ep-pin__tip-label">Clicks</div>
            <div className="ep-pin__tip-count">
              <strong>{c.count}</strong> <span>({c.pct}%)</span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ep-pin__tip-cam">
            <circle cx="8" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M2.5 13.5c.7-2.5 2.9-4 5.5-4s4.8 1.5 5.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Scroll heatmap overlay ────────────────────────────────────────
const SCROLL_BANDS = [
  { top: "0%",  label: "100% saw this" },
  { top: "30%", label: "72% scrolled this far" },
  { top: "55%", label: "48% reached the CTA" },
  { top: "85%", label: "22% reached the end" },
];

function ScrollHeatOverlay() {
  return (
    <>
      {/* Blended gradient + band lines */}
      <div className="ep-overlay ep-overlay--scroll">
        {SCROLL_BANDS.map((b, i) => (
          <div key={i} className="ep-scroll-band" style={{ top: b.top }} />
        ))}
      </div>
      {/* Labels — separate non-blended layer for legibility */}
      <div className="ep-overlay ep-overlay--scroll-caps">
        {SCROLL_BANDS.map((b, i) => (
          <span key={i} className="ep-scroll-band__cap" style={{ top: b.top }}>{b.label}</span>
        ))}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Scroll view — scroll-data table (left) + tinted page preview (right)
// ────────────────────────────────────────────────────────────────────
function ScrollView({ exp, title, totalPageViews, totalTaps }) {
  const [aiOpen, setAiOpen] = useStatePrev(false);
  // Seeded scroll funnel — visitor count at each 5% milestone.
  const seed = (exp.id + ":scroll").split("").reduce((a, c) => a + c.charCodeAt(0), 11);
  let s = seed;
  const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const startVisitors = 5 + Math.floor(next() * 10); // 5–14 visitors at 5%
  const steps = Array.from({ length: 20 }, (_, i) => (i + 1) * 5); // 5%, 10%, ... 100%
  let prev = startVisitors;
  const rows = steps.map((pct) => {
    // Slow attrition early, faster late
    const attritionChance = pct < 30 ? 0.08 : pct < 60 ? 0.18 : pct < 85 ? 0.32 : 0.45;
    const dropped = prev > 0 ? (next() < attritionChance ? Math.min(prev, 1 + Math.floor(next() * Math.max(1, Math.floor(prev / 3)))) : 0) : 0;
    const visitors = Math.max(0, prev - dropped);
    const dropPct = startVisitors > 0 ? Math.round(((startVisitors - visitors) / startVisitors) * 100) : 0;
    const sharePct = startVisitors > 0 ? Math.round((visitors / startVisitors) * 100) : 0;
    prev = visitors;
    return { pct, visitors, sharePct, dropPct };
  });

  // Average fold — the depth at which ~50% of visitors stopped
  const halfPoint = rows.find((r) => r.visitors <= startVisitors / 2);
  const foldPct = halfPoint ? halfPoint.pct : 60;

  // KPIs derived from the funnel rows
  const totalVisitors = startVisitors || 1;
  const avgScrollDepth = (() => {
    // Average depth reached per visitor — for each visitor that dropped between step i-1 and i,
    // their depth ≈ rows[i-1].pct. Approximate as a weighted mean of pct using "stopped here" counts.
    let sum = 0;
    let stoppedTotal = 0;
    let prevV = startVisitors;
    rows.forEach((r) => {
      const stopped = Math.max(0, prevV - r.visitors);
      sum += stopped * r.pct;
      stoppedTotal += stopped;
      prevV = r.visitors;
    });
    // visitors still on the page at end count as having reached 100%
    const finished = prevV;
    sum += finished * 100;
    stoppedTotal += finished;
    return stoppedTotal > 0 ? Math.round(sum / stoppedTotal) : 0;
  })();
  const medianScrollDepth = foldPct; // depth at which 50% remained
  const ctaRow = rows.find((r) => r.pct === 60) || rows[rows.length - 1];
  const reachedCTA = ctaRow ? Math.round((ctaRow.visitors / totalVisitors) * 100) : 0;
  const endRow = rows[rows.length - 1];
  const reachedEnd = endRow ? Math.round((endRow.visitors / totalVisitors) * 100) : 0;

  return (
    <div className="ep-clicks-body">
      {/* Left: scroll KPI tiles */}
      <div className="ep-scroll-data">
        <div className="ep-scroll-data__head">
          <div className="ep-scroll-data__title">Scroll data</div>
        </div>
        {(() => {
          // Compose a short, data-driven insight from the funnel.
          const ctaLow = reachedCTA < 50;
          const dropZone = (() => {
            let worst = { pct: 0, drop: 0 };
            let prevV2 = startVisitors;
            rows.forEach((r) => {
              const drop = prevV2 - r.visitors;
              if (drop > worst.drop) worst = { pct: r.pct, drop };
              prevV2 = r.visitors;
            });
            return worst.pct;
          })();
          const summary = ctaLow
            ? `Only ${reachedCTA}% of visitors reach the CTA — biggest drop-off is around ${dropZone}%.`
            : `${reachedCTA}% reach the CTA. Average fold sits at ${foldPct}%, so most readers are seeing the call to action.`;
          const bullets = [
            `Average visitor scrolls to ${avgScrollDepth}% of the page; half make it past ${medianScrollDepth}%.`,
            `Sharpest fall-off is around the ${dropZone}% mark — consider tightening copy or breaking up content there.`,
            reachedEnd < 20
              ? `Only ${reachedEnd}% reach the end — long-tail content may be wasted on this audience.`
              : `${reachedEnd}% scroll all the way through — your closing content is landing.`,
          ];
          return (
            <div className={"ep-scroll-ai" + (aiOpen ? " ep-scroll-ai--open" : "")}>
              <button type="button" className="ep-scroll-ai__head" onClick={() => setAiOpen((v) => !v)} aria-expanded={aiOpen}>
                <span className="ep-scroll-ai__mark">
                  {window.AISparkle ? <window.AISparkle size={11} color="#fff" /> : <span style={{ fontSize: 10 }}>✨</span>}
                </span>
                <span className="ep-scroll-ai__text">{summary}</span>
                <svg className="ep-scroll-ai__chev" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {aiOpen && (
                <div className="ep-scroll-ai__body">
                  {bullets.map((b, i) => (
                    <div key={i} className="ep-scroll-ai__bullet">{b}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        <div className="ep-scroll-data__scroll" style={{ padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Avg. scroll depth", value: avgScrollDepth + "%", hint: "Mean depth reached per visitor", icon: <Icon.Trend />, kind: "green" },
              { label: "Median depth", value: medianScrollDepth + "%", hint: "50% of visitors got at least this far", icon: <Icon.Users />, kind: "blue" },
              { label: "Reached CTA", value: reachedCTA + "%", hint: "Visitors who scrolled to the primary CTA", icon: <Icon.TapHand />, kind: "purple" },
              { label: "Reached end", value: reachedEnd + "%", hint: "Visitors who scrolled to 100%", icon: <Icon.Doc />, kind: "orange" },
            ].map((kpi, i) => (
              <div className="stat-card" key={i} style={{ padding: "14px 16px", minHeight: 0, gap: 14 }}>
                <div className={"stat-icon stat-icon--" + kpi.kind}>{kpi.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="stat-label">{kpi.label}</p>
                  <div className="stat-value" style={{ fontSize: 24 }}>{kpi.value}</div>
                  <p className="stat-foot">{kpi.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: phone-style scrollable page with red tint + fold marker + milestone overlays */}
      <div className="ep-clicks-preview">
        <div className="ep-heatmap-page ep-clicks-page">
          <div className="ep-scroll-canvas">
            <ExperiencePreviewPage title={title} />
            <div className="ep-overlay ep-overlay--scroll-tint" />
            <div className="ep-overlay ep-overlay--scroll-fold">
              <div className="ep-scroll-fold" style={{ top: foldPct + "%" }}>
                <span className="ep-scroll-fold__cap">Average fold</span>
              </div>
            </div>
            {(() => {
              const reachedAt = (pct) => {
                if (pct === 0) return 100;
                const r = rows.find((x) => x.pct === pct);
                return r ? r.sharePct : 0;
              };
              const milestones = [
                { pct: 25,  label: reachedAt(25)  + "% reached here" },
                { pct: 50,  label: reachedAt(50)  + "% reached here" },
                { pct: 75,  label: reachedAt(75)  + "% reached here" },
                { pct: 100, label: reachedAt(100) + "% reached end" },
              ];
              return (
                <div className="ep-overlay ep-overlay--scroll-milestones">
                  {milestones.map((m) => (
                    <div key={m.pct} className={"ep-scroll-milestone" + (m.pct === 100 ? " ep-scroll-milestone--end" : "")} style={{ top: `calc(${m.pct}% - 1px)` }}>
                      <span className="ep-scroll-milestone__line" />
                      <span className="ep-scroll-milestone__pct">{m.pct}%</span>
                      <span className="ep-scroll-milestone__label">{m.label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="ep-clicks-footbar">
          <span className="ep-clicks-pill">{totalPageViews.toLocaleString()} taps</span>
          <div className="ep-clicks-legend">
            <span className="ep-clicks-legend__cap">More seen</span>
            <span className="ep-clicks-legend__bar" />
            <span className="ep-clicks-legend__cap">Less seen</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrollLegend() {
  return (
    <div className="ep-side-card">
      <div className="ep-side-card__title">Scroll depth</div>
      <p className="ep-side-card__hint">Bands show what share of visitors scrolled past each point on the page.</p>
      <div className="ep-stats">
        <div className="ep-stat"><span className="ep-stat__label">Avg. scroll depth</span><span className="ep-stat__value">64%</span></div>
        <div className="ep-stat"><span className="ep-stat__label">Reached CTA</span><span className="ep-stat__value">48%</span></div>
        <div className="ep-stat"><span className="ep-stat__label">Reached end</span><span className="ep-stat__value">22%</span></div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Placeholder illustrations (SVG, abstract — stand-ins for real assets)
// ────────────────────────────────────────────────────────────────────
function SkullArt({ small }) {
  return (
    <svg className={"ep-art ep-art--skull" + (small ? " ep-art--small" : "")} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="ep-skull-bg" cx="60%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#3a342c" />
          <stop offset="100%" stopColor="#0c0c0d" />
        </radialGradient>
        <linearGradient id="ep-skull-tone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a07a4a" />
          <stop offset="60%" stopColor="#6b4a25" />
          <stop offset="100%" stopColor="#3b2410" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#ep-skull-bg)" />
      {/* Stylised T-rex skull silhouette */}
      <g transform="translate(110, 30)">
        <path d="M40 10 C 90 -2, 165 8, 195 50 C 210 72, 195 96, 175 110 L 165 130 L 150 132 L 145 142 L 130 140 L 120 150 L 105 148 L 95 158 L 80 154 L 70 162 L 58 156 L 50 165 L 38 158 L 30 145 L 18 130 C 0 100, 5 60, 40 30 Z"
              fill="url(#ep-skull-tone)" />
        <ellipse cx="155" cy="55" rx="13" ry="10" fill="#0c0c0d" />
        <ellipse cx="155" cy="55" rx="3" ry="2" fill="#a07a4a" opacity="0.7" />
        {/* Teeth */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <polygon key={i} points={`${80 + i * 11},${118 + (i % 2) * 6} ${88 + i * 11},${118 + (i % 2) * 6} ${84 + i * 11},${138 + (i % 2) * 4}`}
                   fill="#f0e9d9" />
        ))}
      </g>
    </svg>
  );
}

function StegoArt() {
  return (
    <svg className="ep-art ep-art--stego" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="ep-stego-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f1ea" />
          <stop offset="100%" stopColor="#e6dfd1" />
        </linearGradient>
        <linearGradient id="ep-stego-tone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a07a4a" />
          <stop offset="100%" stopColor="#5a3e1c" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#ep-stego-bg)" />
      {/* Body */}
      <path d="M30 130 C 60 90, 110 75, 160 80 C 215 86, 260 110, 285 132 L 290 138 L 280 145 L 250 145 L 245 140 L 240 145 L 200 145 L 195 140 L 190 145 L 90 145 L 85 140 L 80 145 L 50 145 L 40 138 Z"
            fill="url(#ep-stego-tone)" />
      {/* Plates along the back */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <polygon key={i}
                 points={`${75 + i * 28},${100 - (i === 3 ? 18 : 8)} ${85 + i * 28},${80 - (i === 3 ? 22 : 14)} ${95 + i * 28},${100 - (i === 3 ? 18 : 8)}`}
                 fill="#7a5a30" />
      ))}
      {/* Tail spikes */}
      <polygon points="28,132 18,118 26,134" fill="#5a3e1c" />
      <polygon points="22,140 8,128 22,142" fill="#5a3e1c" />
      {/* Head */}
      <ellipse cx="290" cy="138" rx="22" ry="11" fill="#5a3e1c" />
      <circle cx="298" cy="135" r="1.6" fill="#1c1003" />
      {/* Legs */}
      {[100, 150, 220, 260].map((x, i) => (
        <rect key={i} x={x} y="138" width="10" height="28" rx="3" fill="#5a3e1c" />
      ))}
    </svg>
  );
}

function TrilobiteArt() {
  return (
    <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
      <defs>
        <radialGradient id="ep-trilo" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#a6a880" />
          <stop offset="100%" stopColor="#3f4e2b" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="34" rx="22" ry="26" fill="url(#ep-trilo)" />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx="32" cy={20 + i * 6} rx={20 - i * 1.5} ry="2.2" fill="#2a3719" opacity="0.55" />
      ))}
      <circle cx="26" cy="20" r="2" fill="#1c1f10" />
      <circle cx="38" cy="20" r="2" fill="#1c1f10" />
    </svg>
  );
}

Object.assign(window, { ExperiencePreviewPage, ExperiencePreviewFrame, ExperienceHeatmapCard });
