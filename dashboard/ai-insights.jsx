// ai-insights.jsx
// Unified AI Insights surface for the dashboard.
//
//   <AIInsightsPanel>   single card: header + summary bullets + anomaly list + ask-a-question
//   <ExplainChip>       small sparkle button on each stat card → popover explanation
//
// First-load behavior: shows a "thinking" state with animated indicator,
// then types summary bullets character-by-character, then fades in anomaly items.
// Subsequent navigations in the same session skip the animation.
// Clicking the regenerate icon replays the animation.

const { useState: useStateAI, useEffect: useEffectAI, useRef: useRefAI } = React;

// ───────────────────────────────────────────────────────────────────────
// Icons
// ───────────────────────────────────────────────────────────────────────
function AISparkle({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5L13.6 9.2C13.85 10.25 14.7 11.06 15.76 11.27L22 12.5L15.76 13.73C14.7 13.94 13.85 14.75 13.6 15.8L12 22.5L10.4 15.8C10.15 14.75 9.3 13.94 8.24 13.73L2 12.5L8.24 11.27C9.3 11.06 10.15 10.25 10.4 9.2L12 2.5Z" fill={color} />
      <path d="M19.5 3L19.95 4.55C20.05 4.88 20.31 5.13 20.63 5.22L22 5.6L20.63 5.98C20.31 6.07 20.05 6.32 19.95 6.65L19.5 8.2L19.05 6.65C18.95 6.32 18.69 6.07 18.37 5.98L17 5.6L18.37 5.22C18.69 5.13 18.95 4.88 19.05 4.55L19.5 3Z" fill={color} opacity="0.7" />
    </svg>
  );
}

const AIIcons = {
  trendUp: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 11L6 7L9 10L14 5M14 5H10M14 5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trendDown: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5L6 9L9 6L14 11M14 11H10M14 11V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 5V8.5M8 11V11.01M8 1.5L14.5 13H1.5L8 1.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.85 5.55L14.3 6.15L11.05 9.2L11.85 13.5L8 11.45L4.15 13.5L4.95 9.2L1.7 6.15L6.15 5.55L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 6.5H14M5 2V4.5M11 2V4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  device: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="1.5" width="8" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/></svg>,
  refresh: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M14 3.5V7H10.5M2 12.5V9H5.5M3.2 7A5 5 0 0 1 12.5 5.5L14 7M12.8 9A5 5 0 0 1 3.5 10.5L2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bulb: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 13.5h4M6.5 11.5h3M5 7.5a3 3 0 1 1 6 0c0 1.4-.7 2.3-1.3 2.9-.4.4-.7.7-.7 1.1h-2c0-.4-.3-.7-.7-1.1-.6-.6-1.3-1.5-1.3-2.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="2.3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 13.5C2 11.5 3.8 10 6 10s4 1.5 4 3.5M11 5.2a2 2 0 1 1 0 3.6M11.5 13.5c0-1.6-1-2.8-2.5-3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  spark: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.7 3.7l2.1 2.1M10.2 10.2l2.1 2.1M3.7 12.3l2.1-2.1M10.2 5.8l2.1-2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

// ───────────────────────────────────────────────────────────────────────
// Insight computation
// ───────────────────────────────────────────────────────────────────────
function pct(n) { const s = n > 0 ? "+" : ""; return s + n + "%"; }
function abs(n) { return Math.abs(n); }

function computeDashboardInsights({ period, spaceCtx, frequency, tone }) {
  const conv = tone === "conversational";
  const scope = spaceCtx === "all" ? "all" : spaceCtx;
  const m = window.metricsForPeriod(period, scope);
  const topExp = window.experiencesForPeriod(period, spaceCtx === "all" ? null : spaceCtx);
  const spaces = (window.DATA && window.DATA.SPACES) || [];
  const tappoints = (window.DATA && window.DATA.TAPPOINTS) || [];
  const vsLabel = window.previousPeriodLabel(period);

  let topSpace = null, topSpaceShare = 0;
  if (spaceCtx === "all" && spaces.length) {
    const totalSpaceTaps = spaces.reduce((a, s) => a + (s.taps || 0), 0) || 1;
    topSpace = [...spaces].sort((a, b) => (b.taps || 0) - (a.taps || 0))[0];
    topSpaceShare = Math.round(((topSpace.taps || 0) / totalSpaceTaps) * 100);
  }

  const byDelta = [...topExp].sort((a, b) => b.delta - a.delta);
  const best = byDelta[0];
  const worst = byDelta[byDelta.length - 1];

  const banner = [];
  banner.push({
    kind: "headline",
    sign: m.tapsDelta,
    text: conv
      ? `Taps are ${m.tapsDelta >= 0 ? "up" : "down"} ${abs(m.tapsDelta)}% — ${m.tapsDelta >= 0 ? "things are trending in the right direction" : "worth a closer look"}.`
      : `Total taps ${m.tapsDelta >= 0 ? "increased" : "decreased"} ${abs(m.tapsDelta)}% ${vsLabel}.`,
  });
  if (topSpace) {
    banner.push({
      kind: "driver",
      text: conv
        ? `Most of the activity came from ${topSpace.name} (${topSpaceShare}% of all taps).`
        : `${topSpace.name} accounts for ${topSpaceShare}% of total taps.`,
    });
  }
  if (best && best.delta > 5) {
    banner.push({
      kind: "mover", sign: 1,
      text: conv
        ? `${best.name} is having a great period, up ${pct(best.delta)}.`
        : `${best.name} ${pct(best.delta)} — strongest mover this period.`,
    });
  }
  if (worst && worst.delta < -5) {
    banner.push({
      kind: "dropper", sign: -1,
      text: conv
        ? `${worst.name} dropped ${pct(worst.delta)} — worth investigating.`
        : `${worst.name} declined ${pct(worst.delta)} — anomaly flagged.`,
    });
  }
  if (m.conversionDelta < -1) {
    banner.push({ kind: "conversion", sign: -1, text: `Lead conversion fell ${m.conversionDelta.toFixed(1)}pp — visitors are tapping but not converting.` });
  } else if (m.conversionDelta > 1) {
    banner.push({ kind: "conversion", sign: 1, text: `Conversion improved ${m.conversionDelta.toFixed(1)}pp — forms are landing better.` });
  }
  const bannerTrim = banner.slice(0, 3);

  const anomalies = [];
  if (m.tapsDelta <= -10) {
    anomalies.push({ severity: "high", icon: AIIcons.trendDown,
      title: `Taps down ${abs(m.tapsDelta)}% ${vsLabel}`,
      body: `Recovery would require ${Math.round(m.totalTaps * (abs(m.tapsDelta) / 100)).toLocaleString()} more taps to match the previous period.`,
      action: "View chart", route: null });
  } else if (m.tapsDelta >= 15) {
    anomalies.push({ severity: "good", icon: AIIcons.trendUp,
      title: `Strong growth — taps up ${m.tapsDelta}%`,
      body: `${m.totalTaps.toLocaleString()} taps this period vs an expected ~${Math.round(m.totalTaps / (1 + m.tapsDelta / 100)).toLocaleString()}.`,
      action: "View chart", route: null });
  }
  if (m.conversionDelta <= -1) {
    anomalies.push({ severity: "med", icon: AIIcons.alert,
      title: `Conversion dropped ${abs(m.conversionDelta).toFixed(1)}pp`,
      body: `Leads grew ${pct(m.leadsDelta)} while uniques grew ${pct(m.visitorsDelta)} — the gap is widening.`,
      action: "Open report", route: "reports" });
  }
  if (worst && worst.delta <= -8) {
    anomalies.push({ severity: "med", icon: AIIcons.alert,
      title: `${worst.name} declined ${pct(worst.delta)}`,
      body: `Only ${worst.taps} taps this period — bottom of the leaderboard. Check device placement.`,
      action: "Open experience", route: "experiences" });
  }
  if (best && best.delta >= 10) {
    anomalies.push({ severity: "good", icon: AIIcons.star,
      title: `${best.name} trending ${pct(best.delta)}`,
      body: `${best.taps} taps — your top performer. Consider replicating its content or placement.`,
      action: "Open experience", route: "experiences" });
  }
  anomalies.push({ severity: "low", icon: AIIcons.calendar,
    title: `Tuesday & Thursday are your strongest days`,
    body: `Weekday traffic is ~2.3× weekend volume. Promotional pushes mid-week could compound the effect.`,
    action: "View heatmap", route: null });
  const idleTp = tappoints[tappoints.length - 1];
  if (idleTp) {
    anomalies.push({ severity: "low", icon: AIIcons.device,
      title: `${idleTp.name} has been idle for 12 days`,
      body: `No taps recorded since May 10. Reassign to a higher-traffic experience?`,
      action: "Manage device", route: "tappoints" });
  }

  // Suggestions — actionable recommendations
  const suggestions = [];
  if (best && best.delta > 5) {
    suggestions.push({
      icon: AIIcons.star,
      title: `Replicate ${best.name} to other spaces`,
      body: `It's your top performer at ${pct(best.delta)}. Cloning the experience to 2–3 other locations could lift overall taps by ~${Math.round(best.delta / 2)}%.`,
      action: "Duplicate experience", route: "experiences",
    });
  }
  if (worst && worst.delta < -8) {
    suggestions.push({
      icon: AIIcons.bulb,
      title: `Refresh content on ${worst.name}`,
      body: `Down ${pct(worst.delta)}. Try a new headline, CTA, or repositioning the TapPoint to a higher-traffic area.`,
      action: "Edit experience", route: "experiences",
    });
  }
  if (m.conversionDelta < -0.5) {
    suggestions.push({
      icon: AIIcons.bulb,
      title: `Add a lead form to your top experience`,
      body: `Conversion is slipping. Adding a one-field email capture to ${best ? best.name : "your top experience"} typically lifts leads 8–12%.`,
      action: "Open experience", route: "experiences",
    });
  }
  suggestions.push({
    icon: AIIcons.calendar,
    title: `Schedule a mid-week promo push`,
    body: `Tue/Thu are your strongest days. A SMS/email blast on Monday afternoon historically lifts next-day taps by ~12%.`,
    action: "Plan campaign", route: null,
  });
  if (idleTp) {
    suggestions.push({
      icon: AIIcons.device,
      title: `Reassign ${idleTp.name}`,
      body: `Idle for 12 days. Move it to ${topSpace ? topSpace.name : "your highest-traffic space"} to recover ~25 taps/week.`,
      action: "Manage device", route: "tappoints",
    });
  }
  if (topSpace && spaceCtx === "all") {
    suggestions.push({
      icon: AIIcons.trendUp,
      title: `Roll out ${topSpace.name}'s playbook elsewhere`,
      body: `It generates ${topSpaceShare}% of taps. Documenting what works (placement, content, hours) and applying it to your other spaces is the highest-leverage move.`,
      action: "Open space", route: null,
    });
  }

  const explains = {
    totalTaps: m.tapsDelta >= 0
      ? `Up ${m.tapsDelta}% — primary driver is ${topSpace ? topSpace.name : "your highest-traffic space"}. The increase is consistent across weekdays and likely sustainable through next period.`
      : `Down ${abs(m.tapsDelta)}% — ${worst ? `${worst.name} saw the largest individual drop (${pct(worst.delta)}).` : "weekend volume softened the most."} Check device status and experience placement.`,
    uniqueVisitors: (() => {
      const ratio = m.uniqueVisitors / Math.max(1, m.totalTaps);
      const repeatPct = ((1 - ratio) * 100).toFixed(0);
      return `${(ratio * 100).toFixed(0)}% of taps come from unique visitors. The other ~${repeatPct}% are repeat taps, suggesting ${ratio > 0.55 ? "high discovery and low return engagement" : "healthy repeat engagement"}.`;
    })(),
    leadsCaptured: m.leadsDelta >= 0
      ? `Lead capture grew ${pct(m.leadsDelta)} — ${m.leadsDelta > m.tapsDelta ? "outpacing tap volume, so your forms are converting better." : "in line with overall tap growth."} ${best ? `Top form-converter is ${best.name}.` : ""}`
      : `Leads softened ${pct(m.leadsDelta)} despite tap volume ${m.tapsDelta >= 0 ? "growing" : "softening"}. Common cause: CTAs hidden below the fold on top experiences.`,
    conversionRate: m.conversionDelta >= 0
      ? `Visitors are ${m.conversionDelta.toFixed(1)}pp more likely to leave a lead than last period. ${best ? `${best.name} carries the highest conversion.` : ""}`
      : `Conversion slipped ${abs(m.conversionDelta).toFixed(1)}pp. Likely cause: more cold/walk-by traffic from ${topSpace ? topSpace.name : "high-traffic spaces"} that doesn't translate to form fills.`,
  };

  return { banner: bannerTrim, anomalies, suggestions, explains };
}

// ───────────────────────────────────────────────────────────────────────
// Page-specific insight computations (Experiences, TapPoints, Spaces, Users, Reports)
// ───────────────────────────────────────────────────────────────────────

function computeExperiencesInsights({ tone } = {}) {
  const conv = tone === "conversational";
  const exps = (window.DATA && window.DATA.EXPERIENCES) || [];
  const spaces = (window.DATA && window.DATA.SPACES) || [];
  const tps = (window.DATA && window.DATA.TAPPOINTS) || [];

  if (!exps.length) {
    return {
      banner: [{ kind: "info", text: "No experiences yet — create one to start collecting insights." }],
      anomalies: [], suggestions: [], explains: {},
    };
  }

  const totalTaps = exps.reduce((a, e) => a + (e.taps || 0), 0);
  const totalLeads = exps.reduce((a, e) => a + (e.leads || 0), 0);
  const sorted = [...exps].sort((a, b) => (b.taps || 0) - (a.taps || 0));
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const byDelta = [...exps].sort((a, b) => (b.delta || 0) - (a.delta || 0));
  const bestMover = byDelta[0];
  const worstMover = byDelta[byDelta.length - 1];
  const idleExps = exps.filter((e) => tps.filter((t) => t.experienceId === e.id).length === 0);
  const topShare = totalTaps > 0 ? Math.round(((top.taps || 0) / totalTaps) * 100) : 0;
  const byType = {};
  exps.forEach((e) => { byType[e.type] = (byType[e.type] || 0) + 1; });
  const typeKeys = Object.keys(byType);
  const avgConv = totalTaps > 0 ? (totalLeads / totalTaps) * 100 : 0;

  const banner = [];
  banner.push({ kind: "headline", sign: (top.delta || 0) > 0 ? 1 : (top.delta || 0) < 0 ? -1 : 0,
    text: conv
      ? `${top.name} is your standout experience, pulling ${topShare}% of all taps.`
      : `${top.name} leads with ${(top.taps || 0).toLocaleString()} taps (${topShare}% share).`,
  });
  if (bestMover && (bestMover.delta || 0) > 5) {
    banner.push({ kind: "mover", sign: 1,
      text: conv
        ? `${bestMover.name} is gaining traction at ${pct(bestMover.delta)}.`
        : `${bestMover.name} ${pct(bestMover.delta)} — top mover this period.`,
    });
  }
  if (worstMover && (worstMover.delta || 0) < -5) {
    banner.push({ kind: "dropper", sign: -1,
      text: conv
        ? `${worstMover.name} fell ${pct(worstMover.delta)} — likely worth a refresh.`
        : `${worstMover.name} declined ${pct(worstMover.delta)} — anomaly flagged.`,
    });
  } else if (totalLeads) {
    banner.push({ kind: "driver",
      text: conv
        ? `On average ${avgConv.toFixed(1)}% of taps turn into leads.`
        : `Average conversion across ${exps.length} experiences: ${avgConv.toFixed(1)}%.`,
    });
  }

  const anomalies = [];
  if (worstMover && (worstMover.delta || 0) <= -8) {
    anomalies.push({ severity: "med", icon: AIIcons.trendDown,
      title: `${worstMover.name} down ${pct(worstMover.delta)}`,
      body: `Only ${(worstMover.taps || 0).toLocaleString()} taps this period. Check device placement and consider refreshing the content.`,
      action: "Open experience", route: "experiences" });
  }
  if (bestMover && (bestMover.delta || 0) >= 12) {
    anomalies.push({ severity: "good", icon: AIIcons.star,
      title: `${bestMover.name} trending ${pct(bestMover.delta)}`,
      body: `Strongest mover among ${exps.length} experiences. Consider cloning the format to other spaces.`,
      action: "View experience", route: "experiences" });
  }
  if (idleExps.length > 0) {
    anomalies.push({ severity: "low", icon: AIIcons.alert,
      title: `${idleExps.length} experience${idleExps.length === 1 ? "" : "s"} without TapPoints`,
      body: `${idleExps.slice(0, 3).map((e) => e.name).join(", ")}${idleExps.length > 3 ? ` and ${idleExps.length - 3} more` : ""} can't be tapped — assign a device to collect data.`,
      action: "Manage devices", route: "tappoints" });
  }
  if (bottom && bottom !== top && (bottom.taps || 0) < (top.taps || 1) * 0.1) {
    anomalies.push({ severity: "low", icon: AIIcons.alert,
      title: `${bottom.name} is severely underperforming`,
      body: `${(bottom.taps || 0).toLocaleString()} taps — under 10% of ${top.name}'s volume. Likely a placement or content issue.`,
      action: "Open experience", route: "experiences" });
  }
  if (typeKeys.length === 1 && exps.length > 3) {
    anomalies.push({ severity: "low", icon: AIIcons.calendar,
      title: `All experiences are "${typeKeys[0]}" type`,
      body: `Mixing in another format (Hub, Card or Sticker) typically lifts engagement on repeat visitors.`,
      action: "Create experience", route: "experiences" });
  }

  const suggestions = [];
  if (bestMover && (bestMover.delta || 0) > 5) {
    suggestions.push({ icon: AIIcons.star,
      title: `Clone ${bestMover.name} to another space`,
      body: `Up ${pct(bestMover.delta)}. Replicating it across 2–3 spaces typically lifts overall taps by ~${Math.max(4, Math.round((bestMover.delta || 10) / 2))}%.`,
      action: "Duplicate experience", route: "experiences" });
  }
  if (worstMover && (worstMover.delta || 0) < -8) {
    suggestions.push({ icon: AIIcons.bulb,
      title: `Refresh ${worstMover.name}`,
      body: `Down ${pct(worstMover.delta)}. Try a new headline, CTA copy, or hero image — small content tweaks often recover 60–70% of lost volume.`,
      action: "Edit experience", route: "experiences" });
  }
  if (avgConv > 0 && avgConv < 12 && top) {
    suggestions.push({ icon: AIIcons.bulb,
      title: `Add a lead form to ${top.name}`,
      body: `Overall conversion is ${avgConv.toFixed(1)}%. A one-field email capture on your top experience typically lifts leads 8–12%.`,
      action: "Edit experience", route: "experiences" });
  }
  if (idleExps.length > 0) {
    suggestions.push({ icon: AIIcons.device,
      title: `Assign a TapPoint to ${idleExps[0].name}`,
      body: `Without a device this experience can't be tapped. Pick any available TapPoint to start collecting data.`,
      action: "Manage devices", route: "tappoints" });
  }
  suggestions.push({ icon: AIIcons.trendUp,
    title: `Tag experiences for easier reporting`,
    body: `Group similar experiences ("promo", "permanent", "event") to compare cohorts in Reports.`,
    action: "Open reports", route: "reports" });

  return { banner: banner.slice(0, 3), anomalies, suggestions, explains: {} };
}

function computeTappointsInsights({ tone } = {}) {
  const conv = tone === "conversational";
  const tps = (window.DATA && window.DATA.TAPPOINTS) || [];
  const exps = (window.DATA && window.DATA.EXPERIENCES) || [];
  const spaces = (window.DATA && window.DATA.SPACES) || [];

  if (!tps.length) {
    return {
      banner: [{ kind: "info", text: "No TapPoints yet — order devices to start collecting data." }],
      anomalies: [], suggestions: [], explains: {},
    };
  }

  const active = tps.filter((t) => t.status === "Active");
  const inactive = tps.filter((t) => t.status !== "Active");
  const unassigned = tps.filter((t) => !t.experienceId || !exps.find((e) => e.id === t.experienceId));
  const activePct = Math.round((active.length / tps.length) * 100);

  const bySpace = {};
  tps.forEach((t) => { bySpace[t.spaceId] = (bySpace[t.spaceId] || 0) + 1; });
  const heaviestEntry = Object.entries(bySpace).sort((a, b) => b[1] - a[1])[0];
  const heaviestSpace = heaviestEntry ? spaces.find((s) => s.id === heaviestEntry[0]) : null;
  const heaviestCount = heaviestEntry ? heaviestEntry[1] : 0;
  const heaviestShare = tps.length ? Math.round((heaviestCount / tps.length) * 100) : 0;

  // Heuristic "idle": updated string is an explicit date or "Xd ago" with X >= 12
  const isIdle = (t) => {
    const u = (t.updated || "").trim();
    const m = u.match(/^(\d+)d ago$/i);
    if (m) return parseInt(m[1], 10) >= 12;
    return /^\d{2}\/\d{2}\/\d{4}$/.test(u);
  };
  const idle = tps.filter(isIdle);

  const banner = [];
  banner.push({ kind: "headline", sign: activePct >= 80 ? 1 : activePct >= 50 ? 0 : -1,
    text: conv
      ? `${active.length} of ${tps.length} devices are reporting in (${activePct}% active).`
      : `${active.length}/${tps.length} TapPoints active (${activePct}%).`,
  });
  if (heaviestSpace) {
    banner.push({ kind: "driver",
      text: conv
        ? `${heaviestSpace.name} carries the most devices — ${heaviestCount} of ${tps.length}.`
        : `${heaviestSpace.name} holds ${heaviestCount} devices (${heaviestShare}% of fleet).`,
    });
  }
  if (unassigned.length > 0) {
    banner.push({ kind: "dropper", sign: -1,
      text: conv
        ? `${unassigned.length} device${unassigned.length === 1 ? " isn't" : "s aren't"} routed to any experience.`
        : `${unassigned.length} unassigned device${unassigned.length === 1 ? "" : "s"} — no active route configured.`,
    });
  } else if (idle.length > 0) {
    banner.push({ kind: "dropper", sign: -1,
      text: `${idle.length} device${idle.length === 1 ? "" : "s"} haven't logged a tap recently.`,
    });
  }

  const anomalies = [];
  idle.slice(0, 2).forEach((t) => {
    const sp = spaces.find((s) => s.id === t.spaceId);
    anomalies.push({ severity: "med", icon: AIIcons.device,
      title: `${t.name} hasn't reported in`,
      body: `Last activity ${t.updated || "a while ago"}${sp ? ` — currently in ${sp.name}` : ""}. Likely battery, network, or placement issue.`,
      action: "Manage device", route: "tappoints" });
  });
  if (unassigned.length > 0) {
    anomalies.push({ severity: "med", icon: AIIcons.alert,
      title: `${unassigned.length} device${unassigned.length === 1 ? "" : "s"} with no experience routed`,
      body: `${unassigned.slice(0, 3).map((t) => t.name).join(", ")} ${unassigned.length === 1 ? "is" : "are"} powered but not collecting any data.`,
      action: "Assign experience", route: "tappoints" });
  }
  if (inactive.length > 0 && idle.length === 0) {
    anomalies.push({ severity: "low", icon: AIIcons.trendDown,
      title: `${inactive.length} device${inactive.length === 1 ? "" : "s"} marked inactive`,
      body: `Take them offline cleanly or re-activate — silent inactives skew reporting.`,
      action: "Review devices", route: "tappoints" });
  }
  if (heaviestEntry && spaces.length > 1 && heaviestShare >= 50) {
    anomalies.push({ severity: "low", icon: AIIcons.calendar,
      title: `${heaviestShare}% of devices live in ${heaviestSpace.name}`,
      body: `Concentration creates outage risk and limits coverage in your other spaces.`,
      action: "View spaces", route: "spaces" });
  }

  const suggestions = [];
  if (idle.length > 0) {
    suggestions.push({ icon: AIIcons.device,
      title: `Reassign ${idle[0].name}`,
      body: `Idle for over a week. Moving it to ${heaviestSpace ? heaviestSpace.name : "your highest-traffic space"} typically recovers ~25 taps/week.`,
      action: "Manage device", route: "tappoints" });
  }
  if (unassigned.length > 0) {
    suggestions.push({ icon: AIIcons.bulb,
      title: `Route unassigned devices`,
      body: `${unassigned.length} powered-up device${unassigned.length === 1 ? "" : "s"} ${unassigned.length === 1 ? "isn't" : "aren't"} pointing anywhere. Even a "welcome" default captures visitor data.`,
      action: "Assign experience", route: "tappoints" });
  }
  suggestions.push({ icon: AIIcons.trendUp,
    title: `Tag devices by placement`,
    body: `Add tags like "entry", "till", or "exit" to compare placement performance in Reports.`,
    action: "Open reports", route: "reports" });
  if (tps.length < 10) {
    suggestions.push({ icon: AIIcons.star,
      title: `Order more TapPoints to expand coverage`,
      body: `With ${tps.length} device${tps.length === 1 ? "" : "s"} you're still in early deployment. Each new TapPoint typically adds ~120 taps/month.`,
      action: "Order TapPoints", route: "order" });
  }

  return { banner: banner.slice(0, 3), anomalies, suggestions, explains: {} };
}

function computeSpacesInsights({ tone } = {}) {
  const conv = tone === "conversational";
  const spaces = (window.DATA && window.DATA.SPACES) || [];
  const exps = (window.DATA && window.DATA.EXPERIENCES) || [];
  const tps = (window.DATA && window.DATA.TAPPOINTS) || [];

  if (!spaces.length) {
    return {
      banner: [{ kind: "info", text: "No spaces yet — create one to organize TapPoints and experiences." }],
      anomalies: [], suggestions: [], explains: {},
    };
  }

  const sorted = [...spaces].sort((a, b) => (b.taps || 0) - (a.taps || 0));
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const totalTaps = spaces.reduce((a, s) => a + (s.taps || 0), 0) || 1;
  const topShare = Math.round(((top.taps || 0) / totalTaps) * 100);

  const lowExpSpaces = spaces.filter((s) => (s.experiences || 0) <= 1);
  const lowDeviceSpaces = spaces.filter((s) => (s.devices || 0) === 0);

  const banner = [];
  banner.push({ kind: "headline", sign: 1,
    text: conv
      ? `${top.name} is your busiest space, with ${topShare}% of all taps.`
      : `${top.name} leads with ${(top.taps || 0).toLocaleString()} taps (${topShare}% of total).`,
  });
  banner.push({ kind: "driver",
    text: conv
      ? `Across ${spaces.length} spaces, you're collecting ${totalTaps.toLocaleString()} taps in total.`
      : `${spaces.length} active spaces — ${totalTaps.toLocaleString()} total taps tracked.`,
  });
  if (bottom && bottom !== top && (bottom.taps || 0) < (top.taps || 0) * 0.2) {
    banner.push({ kind: "dropper", sign: -1,
      text: conv
        ? `${bottom.name} is well behind — under 20% of ${top.name}'s volume.`
        : `${bottom.name} trails the pack at ${(bottom.taps || 0).toLocaleString()} taps.`,
    });
  }

  const anomalies = [];
  if (topShare >= 50 && spaces.length > 2) {
    anomalies.push({ severity: "med", icon: AIIcons.alert,
      title: `${topShare}% of traffic comes from ${top.name}`,
      body: `Heavy concentration in one space — a single outage there would drag your group-wide numbers significantly.`,
      action: "Open dashboard", route: "dashboard" });
  }
  if (lowDeviceSpaces.length > 0) {
    anomalies.push({ severity: "med", icon: AIIcons.device,
      title: `${lowDeviceSpaces.length} space${lowDeviceSpaces.length === 1 ? "" : "s"} with no devices`,
      body: `${lowDeviceSpaces.slice(0, 3).map((s) => s.name).join(", ")} can't generate taps without TapPoints.`,
      action: "Manage devices", route: "tappoints" });
  }
  if (lowExpSpaces.length > 0) {
    anomalies.push({ severity: "low", icon: AIIcons.alert,
      title: `${lowExpSpaces.length} space${lowExpSpaces.length === 1 ? " has" : "s have"} ≤1 experience`,
      body: `${lowExpSpaces.slice(0, 3).map((s) => s.name).join(", ")} would benefit from more experiences to give visitors reasons to engage.`,
      action: "Create experience", route: "experiences" });
  }
  if (bottom && bottom !== top && (bottom.devices || 0) >= 5 && (bottom.taps || 0) < (top.taps || 0) * 0.3) {
    anomalies.push({ severity: "low", icon: AIIcons.trendDown,
      title: `${bottom.name} under-utilising its devices`,
      body: `${bottom.devices} devices but only ${(bottom.taps || 0).toLocaleString()} taps. Audit placement and signage.`,
      action: "Open space", route: "spaces" });
  }

  const suggestions = [];
  suggestions.push({ icon: AIIcons.star,
    title: `Document ${top.name}'s playbook`,
    body: `It generates ${topShare}% of taps. Capture what's working — placement, content, hours — and roll it out to other spaces.`,
    action: "Open space", route: "spaces" });
  if (bottom && bottom !== top) {
    suggestions.push({ icon: AIIcons.bulb,
      title: `Audit ${bottom.name}`,
      body: `Lowest performer at ${(bottom.taps || 0).toLocaleString()} taps. Walk the space — check device placement, signage, and visitor flow.`,
      action: "Open space", route: "spaces" });
  }
  if (lowDeviceSpaces.length > 0) {
    suggestions.push({ icon: AIIcons.device,
      title: `Add devices to ${lowDeviceSpaces[0].name}`,
      body: `Spaces with at least 3 TapPoints generate ~4× more taps than spaces with one. Start with high-traffic entry points.`,
      action: "Order TapPoints", route: "order" });
  }
  suggestions.push({ icon: AIIcons.trendUp,
    title: `Compare spaces side-by-side`,
    body: `Use Reports → "Breakdown by space" to see which spaces convert leads at the highest rate.`,
    action: "Open reports", route: "reports" });

  return { banner: banner.slice(0, 3), anomalies, suggestions, explains: {} };
}

function computeUsersInsights({ tone } = {}) {
  const conv = tone === "conversational";
  const people = (window.DATA && window.DATA.PEOPLE) || [];
  const spaces = (window.DATA && window.DATA.SPACES) || [];

  if (!people.length) {
    return {
      banner: [{ kind: "info", text: "No users yet — invite teammates to start collaborating." }],
      anomalies: [], suggestions: [], explains: {},
    };
  }

  const orgAdmins = people.filter((p) => p.role === "Space Admin");
  const members = people.filter((p) => p.role === "Space Admin");
  const spaceAdmins = people.filter((p) => p.role === "Space Admin");
  const inactive = people.filter((p) => p.status === "Inactive");
  const active = people.length - inactive.length;
  const activePct = Math.round((active / people.length) * 100);

  const spacesWithAdmin = new Set();
  people.forEach((p) => {
    if (p.role === "Organization Admin" || p.role === "Space Admin") {
      (p.spaceIds || []).forEach((id) => spacesWithAdmin.add(id));
    }
  });
  const orphanSpaces = spaces.filter((s) => !spacesWithAdmin.has(s.id));
  const allSpaceUsers = people.filter((p) => spaces.length > 0 && (p.spaceIds || []).length === spaces.length);

  const banner = [];
  banner.push({ kind: "headline",
    text: conv
      ? `${people.length} teammates — ${orgAdmins.length} organization admin${orgAdmins.length === 1 ? "" : "s"}, ${spaceAdmins.length} space admin${spaceAdmins.length === 1 ? "" : "s"}.`
      : `${people.length} users: ${orgAdmins.length} Organization Admin${orgAdmins.length === 1 ? "" : "s"}, ${spaceAdmins.length} Space Admin${spaceAdmins.length === 1 ? "" : "s"}.`,
  });
  banner.push({ kind: "driver", sign: activePct >= 80 ? 1 : 0,
    text: conv
      ? `${activePct}% are active${inactive.length ? ` — ${inactive.length} inactive` : ""}.`
      : `${activePct}% active, ${inactive.length} inactive.`,
  });
  if (orphanSpaces.length > 0) {
    banner.push({ kind: "dropper", sign: -1,
      text: conv
        ? `${orphanSpaces.length} space${orphanSpaces.length === 1 ? "" : "s"} ${orphanSpaces.length === 1 ? "has" : "have"} no admin assigned.`
        : `${orphanSpaces.length} space${orphanSpaces.length === 1 ? "" : "s"} without an admin — coverage gap.`,
    });
  } else if (allSpaceUsers.length === people.length && spaces.length > 1) {
    banner.push({ kind: "driver",
      text: `Every user has access to every space — consider scoping permissions to reduce noise.`,
    });
  }

  const anomalies = [];
  if (orphanSpaces.length > 0) {
    anomalies.push({ severity: "high", icon: AIIcons.alert,
      title: `${orphanSpaces.length} space${orphanSpaces.length === 1 ? "" : "s"} without an admin`,
      body: `${orphanSpaces.slice(0, 3).map((s) => s.name).join(", ")} ${orphanSpaces.length === 1 ? "has" : "have"} no Group or Space Admin — nobody can manage settings or invites.`,
      action: "Assign admin", route: "people" });
  }
  if (inactive.length > 0) {
    anomalies.push({ severity: "med", icon: AIIcons.trendDown,
      title: `${inactive.length} inactive user${inactive.length === 1 ? "" : "s"}`,
      body: `${inactive.slice(0, 3).map((p) => p.name).join(", ")} ${inactive.length === 1 ? "hasn't" : "haven't"} signed in recently. Deactivate or re-engage to keep the user list clean.`,
      action: "Review users", route: "people" });
  }
  if (orgAdmins.length === 1) {
    anomalies.push({ severity: "med", icon: AIIcons.alert,
      title: `Only one Organization Admin`,
      body: `${orgAdmins[0].name} is your only Organization Admin. If they're unavailable, nobody can manage organization-level settings.`,
      action: "Invite admin", route: "people" });
  }
  if (people.length > 5 && orgAdmins.length / people.length > 0.4) {
    anomalies.push({ severity: "low", icon: AIIcons.alert,
      title: `${orgAdmins.length} of ${people.length} users are Organization Admins`,
      body: `Over 40% have organization-wide access. Consider scoping some down to Space Admin for tighter access control.`,
      action: "Review roles", route: "people" });
  }

  const suggestions = [];
  if (orphanSpaces.length > 0) {
    suggestions.push({ icon: AIIcons.bulb,
      title: `Invite an admin for ${orphanSpaces[0].name}`,
      body: `Without an admin nobody can manage devices, experiences, or settings locally. A Space Admin scope is usually the right fit.`,
      action: "Invite user", route: "people" });
  }
  if (inactive.length > 0) {
    suggestions.push({ icon: AIIcons.refresh,
      title: `Clean up inactive users`,
      body: `${inactive.length} user${inactive.length === 1 ? "" : "s"} haven't logged in in a while. Removing dormant accounts keeps the directory accurate.`,
      action: "Review users", route: "people" });
  }
  if (orgAdmins.length === 1) {
    suggestions.push({ icon: AIIcons.star,
      title: `Add a backup Organization Admin`,
      body: `Single points of failure are risky. Promote a trusted teammate so admin coverage is redundant.`,
      action: "Invite user", route: "people" });
  }
  suggestions.push({ icon: AIIcons.trendUp,
    title: `Use tags to group users`,
    body: `Tag users by team, region, or role to filter the directory and bulk-manage permissions.`,
    action: "Manage users", route: "people" });

  return { banner: banner.slice(0, 3), anomalies, suggestions, explains: {} };
}

// ───────────────────────────────────────────────────────────────────────
// <TypeText> — character-by-character typewriter with caret
// ───────────────────────────────────────────────────────────────────────
function TypeText({ text, onDone, speed = 14 }) {
  const [n, setN] = useStateAI(0);
  const doneRef = useRefAI(false);

  useEffectAI(() => {
    setN(0);
    doneRef.current = false;
    if (!text) { if (onDone) onDone(); return; }
    let i = 0;
    const stepSize = Math.max(1, Math.ceil(text.length / 55));
    const id = setInterval(() => {
      i = Math.min(text.length, i + stepSize);
      setN(i);
      if (i >= text.length) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          if (onDone) onDone();
        }
      }
    }, speed);
    return () => clearInterval(id);
  }, [text]);

  const showCaret = n < text.length;
  return (
    <>
      {text.slice(0, n)}
      {showCaret && <span className="ai-caret" aria-hidden="true" />}
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Analysis checklist — multi-step "AI is analyzing each thing" state
// ───────────────────────────────────────────────────────────────────────
const ANALYSIS_STEPS = [
  "Reading tap volume trends",
  "Comparing to previous period",
  "Identifying top performers",
  "Detecting anomalies",
  "Generating recommendations",
];

function AnalyzingState({ activeIdx }) {
  return (
    <div className="ai-analyzing">
      <div className="ai-analyzing-head">
        <div className="ai-thinking-orb">
          <span className="ai-thinking-orb-ring" />
          <AISparkle size={14} color="#007DF9" />
        </div>
        <div className="ai-analyzing-title">
          <p>Analyzing your data</p>
          <span className="ai-analyzing-sub">Reviewing {Math.min(activeIdx + 1, ANALYSIS_STEPS.length)} of {ANALYSIS_STEPS.length}…</span>
        </div>
      </div>
      <ul className="ai-analyzing-list">
        {ANALYSIS_STEPS.map((label, i) => {
          const status = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
          return (
            <li key={i} className={"ai-analyzing-row ai-analyzing-row--" + status}>
              <span className="ai-analyzing-icon">
                {status === "done" && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                {status === "active" && <span className="ai-analyzing-spin" />}
                {status === "pending" && <span className="ai-analyzing-dot" />}
              </span>
              <span className="ai-analyzing-label">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Legacy single-spinner state, kept as fallback / for ask-question loading
function ThinkingState() {
  return (
    <div className="ai-thinking">
      <div className="ai-thinking-orb">
        <span className="ai-thinking-orb-ring" />
        <AISparkle size={16} color="#007DF9" />
      </div>
      <div className="ai-thinking-text">
        <span>Analyzing your data</span>
        <span className="ai-thinking-dots" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// <AIInsightsPanel> — merged banner + anomaly feed
// ───────────────────────────────────────────────────────────────────────
function fmtTime(d) {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function AIInsightsPanel({ insights, onNav, period, sessionKey = "default", startOpen = false }) {
  if (!insights) return null;
  const summary = insights.banner;
  const anomalies = insights.anomalies;
  const suggestions = insights.suggestions || [];

  // step machine for first-expand animation:
  //   0                          → thinking
  //   1..summary.length          → streaming summary bullet i-1
  //   summary.length + 1         → ready (anomalies, suggestions, tabs free)
  const SUM_OFFSET = 1;
  const READY = SUM_OFFSET + summary.length;

  const seenKeyRef = useRefAI("tapin_ai_seen_" + sessionKey);
  const wasSeen = (() => { try { return sessionStorage.getItem(seenKeyRef.current) === "1"; } catch (e) { return false; } })();

  const [expanded, setExpanded] = useStateAI(startOpen);
  const [step, setStep] = useStateAI(wasSeen ? READY : 0);
  const [analyzingIdx, setAnalyzingIdx] = useStateAI(wasSeen ? ANALYSIS_STEPS.length : 0);
  const [tab, setTab] = useStateAI("summary");
  const [genTime, setGenTime] = useStateAI(() => new Date());
  const [dismissed, setDismissed] = useStateAI({});
  const [showAsk, setShowAsk] = useStateAI(false);
  const [question, setQuestion] = useStateAI("");
  const [answer, setAnswer] = useStateAI(null);
  const [asking, setAsking] = useStateAI(false);
  const animStartedRef = useRefAI(wasSeen);
  const lastPeriodRef = useRefAI(null);

  // Replay the analyzing animation when the date/period changes.
  // Skips the very first render (initialization).
  useEffectAI(() => {
    const sig = JSON.stringify(period);
    if (lastPeriodRef.current === null) {
      lastPeriodRef.current = sig;
      return;
    }
    if (lastPeriodRef.current === sig) return;
    lastPeriodRef.current = sig;
    try { sessionStorage.removeItem(seenKeyRef.current); } catch (err) {}
    animStartedRef.current = false;
    setDismissed({});
    setAnswer(null);
    setQuestion("");
    setShowAsk(false);
    setAnalyzingIdx(0);
    setStep(0);
    setTab("summary");
    setGenTime(new Date());
  }, [period]);

  // Start animation the first time the panel is expanded.
  // Run through the 5-item analysis checklist, then transition to typing the summary.
  useEffectAI(() => {
    if (!expanded) return;
    if (animStartedRef.current) return;
    if (step !== 0) return;
    animStartedRef.current = true;
    setAnalyzingIdx(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= ANALYSIS_STEPS.length) {
        clearInterval(id);
        // Brief pause showing all checked, then start typing
        setTimeout(() => {
          setAnalyzingIdx(ANALYSIS_STEPS.length);
          setStep(SUM_OFFSET);
        }, 380);
      } else {
        setAnalyzingIdx(i);
      }
    }, 520);
    return () => clearInterval(id);
  }, [expanded, step]);

  useEffectAI(() => {
    if (step >= READY) {
      try { sessionStorage.setItem(seenKeyRef.current, "1"); } catch (e) {}
    }
  }, [step, READY]);

  // While typing, keep user on the Summary tab so they see it animate
  useEffectAI(() => {
    if (step < READY && tab !== "summary") setTab("summary");
  }, [step, READY, tab]);

  const regenerate = (e) => {
    if (e) e.stopPropagation();
    try { sessionStorage.removeItem(seenKeyRef.current); } catch (err) {}
    animStartedRef.current = false;
    setDismissed({});
    setAnswer(null);
    setQuestion("");
    setShowAsk(false);
    setAnalyzingIdx(0);
    setStep(0);
    setTab("summary");
    setGenTime(new Date());
  };

  const askQuestion = async () => {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAnswer(null);
    try {
      const summaryText = summary.map((b) => b.text).join(" ");
      const anomText = anomalies.slice(0, 4).map((a) => "- " + a.title + ": " + a.body).join("\n");
      const suggText = suggestions.slice(0, 4).map((a) => "- " + a.title + ": " + a.body).join("\n");
      const prompt = `You are an analytics assistant for a TapIn group admin dashboard. Be specific, concise, and only reference the data provided. Reply in 2-3 sentences.

Current period summary:
${summaryText}

Flagged anomalies:
${anomText}

Suggestions:
${suggText}

User question: ${q}`;
      let resp;
      if (window.claude && window.claude.complete) {
        resp = await window.claude.complete(prompt);
      } else {
        await new Promise((r) => setTimeout(r, 1100));
        resp = "Based on the current data, this trend is most strongly driven by your top-performing space and reflects the mid-week traffic pattern visible in the heatmap. I'd suggest opening that space's dashboard for a closer look.";
      }
      setAnswer(resp);
    } catch (e) {
      setAnswer("Sorry — I couldn't generate an answer just now. Try again in a moment.");
    }
    setAsking(false);
  };

  const visibleAnomalies = anomalies
    .map((a, i) => ({ a, i }))
    .filter(({ i }) => !dismissed["a" + i]);
  const visibleSuggestions = suggestions
    .map((a, i) => ({ a, i }))
    .filter(({ i }) => !dismissed["s" + i]);

  const tabCounts = {
    summary: summary.length,
    attention: anomalies.length,
    suggestions: suggestions.length,
  };

  return (
    <div className={"ai-panel" + (expanded ? " ai-panel--open" : " ai-panel--closed")}>
      <button
        type="button"
        className="ai-panel-head"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="ai-panel-title">
          <span className="ai-panel-mark"><AISparkle size={13} color="#fff" /></span>
          <h3>AI Insights</h3>
          {!expanded && step >= READY && (
            <span className="ai-panel-count">{tabCounts.attention + tabCounts.suggestions} items</span>
          )}
        </div>
        <div className="ai-panel-meta">
          <span className="ai-panel-period">Generated {fmtTime(genTime)}</span>
          {expanded && (
            <span
              className="ai-panel-refresh"
              role="button"
              tabIndex={0}
              onClick={regenerate}
              onKeyDown={(e) => { if (e.key === "Enter") regenerate(e); }}
              aria-label="Regenerate insights"
              aria-disabled={step < READY}
              style={step < READY ? { opacity: 0.35, pointerEvents: "none" } : {}}
              title="Regenerate"
            >
              {AIIcons.refresh}
            </span>
          )}
          <span className={"ai-panel-chev" + (expanded ? " ai-panel-chev--open" : "")}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </div>
      </button>

      {expanded && (
        <>
          <div className="ai-panel-tabs" role="tablist">
            {[
              { id: "summary",     label: "Summary",                 count: tabCounts.summary },
              { id: "attention",   label: "What to pay attention to", count: tabCounts.attention },
              { id: "suggestions", label: "Suggestions",              count: tabCounts.suggestions },
            ].map((tb) => (
              <button
                key={tb.id}
                role="tab"
                aria-selected={tab === tb.id}
                className={"ai-panel-tab" + (tab === tb.id ? " ai-panel-tab--active" : "")}
                onClick={() => setTab(tb.id)}
                disabled={step < READY && tb.id !== "summary"}
              >
                <span>{tb.label}</span>
                {step >= READY && <span className="ai-panel-tab-count">{tb.count}</span>}
              </button>
            ))}
          </div>

          <div className="ai-panel-scroll">
            {step === 0 && <AnalyzingState activeIdx={analyzingIdx} />}

            {step >= SUM_OFFSET && tab === "summary" && (
              <ul className="ai-panel-bullets">
                {summary.map((b, i) => {
                  const myStep = SUM_OFFSET + i;
                  if (step < myStep) return null;
                  const isMine = step === myStep;
                  return (
                    <li key={i} className={"ai-panel-bullet ai-panel-bullet--" + (b.sign > 0 ? "up" : b.sign < 0 ? "down" : "neutral")}>
                      <span className="ai-panel-bullet-dot" aria-hidden="true" />
                      <span className="ai-panel-bullet-text">
                        {isMine
                          ? <TypeText text={b.text} onDone={() => setStep((s) => Math.max(s, myStep + 1))} />
                          : b.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {step >= READY && tab === "attention" && (
              <div className="ai-panel-anom-list">
                {visibleAnomalies.length === 0 && (
                  <p className="ai-panel-empty">All clear — no anomalies to flag right now.</p>
                )}
                {visibleAnomalies.map(({ a, i }) => (
                  <div key={i} className={"ai-anom ai-anom--" + a.severity}>
                    <span className="ai-anom-icon">{a.icon}</span>
                    <div className="ai-anom-body">
                      <p className="ai-anom-title">{a.title}</p>
                      <p className="ai-anom-text">{a.body}</p>
                    </div>
                    <div className="ai-anom-actions">
                      <button className="ai-anom-action" onClick={() => { if (a.route && onNav) onNav(a.route); }}>
                        {a.action}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5H8.5M8.5 5L5.5 2M8.5 5L5.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="ai-anom-dismiss" aria-label="Dismiss" onClick={() => setDismissed((d) => ({ ...d, ["a" + i]: true }))}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step >= READY && tab === "suggestions" && (
              <div className="ai-panel-anom-list">
                {visibleSuggestions.length === 0 && (
                  <p className="ai-panel-empty">No suggestions right now — your setup is humming.</p>
                )}
                {visibleSuggestions.map(({ a, i }) => (
                  <div key={i} className="ai-anom ai-anom--suggest">
                    <span className="ai-anom-icon">{a.icon}</span>
                    <div className="ai-anom-body">
                      <p className="ai-anom-title">{a.title}</p>
                      <p className="ai-anom-text">{a.body}</p>
                    </div>
                    <div className="ai-anom-actions">
                      <button className="ai-anom-action" onClick={() => { if (a.route && onNav) onNav(a.route); }}>
                        {a.action}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5H8.5M8.5 5L5.5 2M8.5 5L5.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="ai-anom-dismiss" aria-label="Dismiss" onClick={() => setDismissed((d) => ({ ...d, ["s" + i]: true }))}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step >= READY && answer && (
              <div className="ai-panel-section--answer">
                <h4 className="ai-panel-label">
                  <AISparkle size={11} color="#007DF9" />
                  <span>Answer</span>
                </h4>
                <p className="ai-panel-answer-q">"{question}"</p>
                <p className="ai-panel-answer-a">{answer}</p>
              </div>
            )}
          </div>

          <div className="ai-panel-ask">
            {!showAsk ? (
              <button className="ai-panel-ask-btn" onClick={() => { setShowAsk(true); setAnswer(null); }} disabled={step < READY}>
                <AISparkle size={12} />
                <span>Ask a question</span>
              </button>
            ) : (
              <div className="ai-panel-ask-input">
                <span className="ai-panel-ask-mark"><AISparkle size={12} color="#007DF9" /></span>
                <input
                  placeholder="e.g. Why did conversion drop?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") askQuestion(); if (e.key === "Escape") { setShowAsk(false); setQuestion(""); } }}
                  autoFocus
                  disabled={asking}
                />
                <button className="ai-panel-ask-send" onClick={askQuestion} disabled={asking || !question.trim()}>
                  {asking
                    ? <span className="ai-ask-spin"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="10 24"/></svg></span>
                    : <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8L14 8M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <button className="ai-panel-ask-close" onClick={() => { setShowAsk(false); setQuestion(""); }} aria-label="Cancel">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// <ExplainChip>  — small sparkle button + popover on stat cards
// ───────────────────────────────────────────────────────────────────────
function ExplainChip({ statKey, insights }) {
  const [open, setOpen] = useStateAI(false);
  const [alignRight, setAlignRight] = useStateAI(false);
  const ref = useRefAI(null);

  useEffectAI(() => {
    if (!open) return;
    // Decide on alignment: if the default left-anchored popover would clip
    // the right edge of the viewport, flip to right-anchored instead.
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const POP_W = 296; // 280 width + a bit of buffer
      setAlignRight(rect.left + POP_W > window.innerWidth - 16);
    }
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!insights || !insights.explains[statKey]) return null;
  const text = insights.explains[statKey];

  return (
    <span className="ai-chip-wrap" ref={ref}>
      <button
        type="button"
        className={"ai-chip" + (open ? " ai-chip--open" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-label="Explain this metric"
        aria-expanded={open}
      >
        <AISparkle size={11} />
      </button>
      {open && (
        <div className="ai-pop" role="dialog">
          <div className="ai-pop-head">
            <AISparkle size={12} color="#007DF9" />
            <span>AI explanation</span>
          </div>
          <p className="ai-pop-text">{text}</p>
          <div className="ai-pop-foot">
            <button className="ai-pop-btn" onClick={() => setOpen(false)}>Got it</button>
          </div>
        </div>
      )}
    </span>
  );
}

Object.assign(window, {
  AISparkle,
  AIInsightsPanel,
  ExplainChip,
  computeDashboardInsights,
  computeExperiencesInsights,
  computeTappointsInsights,
  computeSpacesInsights,
  computeUsersInsights,
});
