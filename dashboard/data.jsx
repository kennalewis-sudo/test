// Shared data + helpers for the TapIn Space Admin prototype.
// Loaded first so other files can reference window globals.
(function () {
  const SPACES = [
    {
      id: "nhm",
      name: "Natural History Museum, London",
      short: "NHM",
      logo: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=200&h=200&fit=crop&crop=center",
      members: 2,
      taps: 132,
      devices: 12,
      experiences: 8,
      admins: ["Joe Bloggs", "Jane Smith"],
      type: "Business",
      description: "Museum of natural history in our London location.",
      active: true,
      updated: "3d ago",
    },
    {
      id: "aqs",
      name: "Aquatic Centre, Surrey",
      short: "AQ",
      logo: "https://images.unsplash.com/photo-1571167530149-c1105da4c2c7?w=200&h=200&fit=crop&crop=center",
      members: 1,
      taps: 863,
      devices: 18,
      experiences: 3,
      admins: ["Joe Bloggs"],
      type: "Business",
      description: "Aquarium in central Surrey.",
      active: true,
      updated: "6d ago",
    },
    {
      id: "swv",
      name: "Science World, Vancouver",
      short: "SW",
      logo: "https://images.unsplash.com/photo-1635776063043-ab23b259ce2a?w=200&h=200&fit=crop&crop=center",
      members: 2,
      taps: 152,
      devices: 6,
      experiences: 4,
      admins: ["Joe Bloggs", "Jane Smith"],
      type: "Class",
      description: "Science centre and educational space.",
      active: true,
      updated: "04/03/2026",
    },
    {
      id: "cdm",
      name: "Coastal Discovery Museum, Victoria",
      short: "CD",
      logo: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=200&h=200&fit=crop&crop=center",
      members: 1,
      taps: 275,
      devices: 10,
      experiences: 6,
      admins: ["Joe Bloggs"],
      type: "Business",
      description: "Coastal heritage and marine exhibits.",
      active: true,
      updated: "04/03/2026",
    },
    {
      id: "nwg",
      name: "Northern Wildlife Gallery, Edmonton",
      short: "NW",
      logo: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=200&h=200&fit=crop&crop=center",
      members: 1,
      taps: 416,
      devices: 23,
      experiences: 15,
      admins: ["Jane Smith"],
      type: "Business",
      description: "Northern wildlife and habitat exhibits.",
      active: true,
      updated: "04/03/2026",
    },
  ];

  const EXPERIENCES = [
    { id: "dino", name: "Dinosaur Discoveries", type: "Hub", spaceId: "nhm", taps: 68, visitors: 31, leads: 12, updated: "3d ago", delta: 22, tags: ["family", "permanent", "popular"] },
    { id: "mary", name: "Mary Anning", type: "Card", spaceId: "nhm", taps: 25, visitors: 12, leads: 9, updated: "6d ago", delta: 9, tags: ["educational", "permanent"] },
    { id: "wings", name: "Life Written on Wings", type: "Sticker", spaceId: "nwg", taps: 35, visitors: 15, leads: 7, updated: "04/03/2026", delta: 14, tags: ["educational", "promo"] },
    { id: "rhom", name: "Rhomaleosaurus", type: "Hub", spaceId: "nhm", taps: 21, visitors: 17, leads: 2, updated: "04/03/2026", delta: -4, tags: ["permanent"] },
    { id: "reef", name: "Ocean Reefs", type: "Hub", spaceId: "aqs", taps: 25, visitors: 19, leads: 5, updated: "04/03/2026", delta: 6, tags: ["family", "popular"] },
  ];

  const TAPPOINTS = [
    { id: "tp1", name: "TapPoint 1", xuid: "043C6B82322190", status: "Active", experienceId: "dino", spaceId: "nhm", updated: "3d ago", tags: ["entry", "high-traffic"] },
    { id: "tp2", name: "TapPoint 2", xuid: "043CF8N8F22190", status: "Active", experienceId: "mary", spaceId: "nhm", updated: "6d ago", tags: ["gallery"] },
    { id: "tp3", name: "TapPoint 3", xuid: "043C8C32322190", status: "Active", experienceId: "wings", spaceId: "nwg", updated: "04/03/2026", tags: ["entry"] },
    { id: "tp4", name: "TapPoint 4", xuid: "043K8B82322190", status: "Active", experienceId: "rhom", spaceId: "nhm", updated: "04/03/2026", tags: ["gallery", "permanent"] },
    { id: "tp5", name: "TapPoint 5", xuid: "049K2B82322190", status: "Active", experienceId: "reef", spaceId: "aqs", updated: "04/03/2026", tags: ["exit", "promo"] },
    // ─ Shipped but not yet configured. The AI Agent picks these up in the
    //   "Set up TapPoints" workflow (filter: Needs setup / Inactive / by tag).
    { id: "tp-pend-01", name: "TapPoint 6",  xuid: "043CNEW0000A1", status: "Inactive", experienceId: null, spaceId: "nhm", updated: "Just shipped", tags: ["needs-setup", "new-stock", "dinosaur-hall"] },
    { id: "tp-pend-02", name: "TapPoint 7",  xuid: "043CNEW0000A2", status: "Inactive", experienceId: null, spaceId: "nhm", updated: "Just shipped", tags: ["needs-setup", "new-stock", "dinosaur-hall"] },
    { id: "tp-pend-03", name: "TapPoint 8",  xuid: "043CNEW0000A3", status: "Inactive", experienceId: null, spaceId: "nhm", updated: "Just shipped", tags: ["needs-setup", "new-stock", "dinosaur-hall"] },
    { id: "tp-pend-04", name: "TapPoint 9",  xuid: "043CNEW0000A4", status: "Inactive", experienceId: null, spaceId: "nhm", updated: "Just shipped", tags: ["needs-setup", "new-stock", "dinosaur-hall"] },
    { id: "tp-pend-05", name: "TapPoint 10", xuid: "043CNEW0000A5", status: "Inactive", experienceId: null, spaceId: "nhm", updated: "Just shipped", tags: ["needs-setup", "new-stock", "dinosaur-hall"] },
    { id: "tp-pend-06", name: "TapPoint 11", xuid: "043CNEW0000A6", status: "Inactive", experienceId: null, spaceId: "nhm", updated: "Just shipped", tags: ["needs-setup", "new-stock", "dinosaur-hall"] },
    { id: "tp-pend-07", name: "TapPoint 12", xuid: "043CNEW0000B1", status: "Inactive", experienceId: null, spaceId: "aqs", updated: "2d ago",      tags: ["needs-setup", "new-stock"] },
    { id: "tp-pend-08", name: "TapPoint 13", xuid: "043CNEW0000B2", status: "Inactive", experienceId: null, spaceId: "aqs", updated: "2d ago",      tags: ["needs-setup", "new-stock"] },
  ];

  const RECENT_TAPS = [
    { name: "Emily Davis", email: "emily@company.com", date: "3h ago", experienceId: "dino", deviceId: "tp1" },
    { anonymous: true, date: "5h ago", experienceId: "mary", deviceId: "tp2" },
    { name: "David Chen", email: "davidchen@acmeco.com", date: "2 days ago", experienceId: "mary", deviceId: "tp2" },
    { anonymous: true, date: "2 days ago", experienceId: "dino", deviceId: "tp1" },
    { name: "Grayson Smith", email: "gsmith@company.com", date: "04/03/2026", experienceId: "wings", deviceId: "tp3" },
    { anonymous: true, date: "04/03/2026", experienceId: "reef", deviceId: "tp5" },
    { name: "Lisa Hunter", email: "lisa@acmeco.com", date: "04/27/2026", experienceId: "rhom", deviceId: "tp4" },
    { anonymous: true, date: "04/27/2026", experienceId: "dino", deviceId: "tp1" },
    { name: "Rita Daood", email: "rita@daood.io", date: "04/27/2026", experienceId: "reef", deviceId: "tp5" },
    { anonymous: true, date: "04/27/2026", experienceId: "wings", deviceId: "tp3" },
    { name: "Marcus Allen", email: "marcus.allen@gmail.com", date: "04/26/2026", experienceId: "dino", deviceId: "tp1" },
    { anonymous: true, date: "04/26/2026", experienceId: "mary", deviceId: "tp2" },
    { name: "Priya Shah", email: "priya.shah@kew.org", date: "04/26/2026", experienceId: "mary", deviceId: "tp2" },
    { anonymous: true, date: "04/26/2026", experienceId: "reef", deviceId: "tp5" },
    { name: "Tom Ramirez", email: "tomr@outlook.com", date: "04/25/2026", experienceId: "dino", deviceId: "tp1" },
    { anonymous: true, date: "04/25/2026", experienceId: "rhom", deviceId: "tp4" },
    { name: "Nora Bennett", email: "nora@bennett.co", date: "04/25/2026", experienceId: "wings", deviceId: "tp3" },
    { anonymous: true, date: "04/25/2026", experienceId: "dino", deviceId: "tp1" },
    { name: "Oliver Park", email: "oliver.park@me.com", date: "04/25/2026", experienceId: "reef", deviceId: "tp5" },
    { anonymous: true, date: "04/24/2026", experienceId: "mary", deviceId: "tp2" },
    { name: "Aisha Khan", email: "akhan@uni.edu", date: "04/24/2026", experienceId: "rhom", deviceId: "tp4" },
    { anonymous: true, date: "04/24/2026", experienceId: "wings", deviceId: "tp3" },
    { name: "Sam Whitfield", email: "swhitfield@studio.com", date: "04/24/2026", experienceId: "dino", deviceId: "tp1" },
    { anonymous: true, date: "04/23/2026", experienceId: "reef", deviceId: "tp5" },
    { name: "Ben Hollister", email: "ben.h@hollister.io", date: "04/23/2026", experienceId: "mary", deviceId: "tp2" },
    { anonymous: true, date: "04/23/2026", experienceId: "dino", deviceId: "tp1" },
    { name: "Chloe Park", email: "chloe@parkmail.com", date: "04/23/2026", experienceId: "wings", deviceId: "tp3" },
    { anonymous: true, date: "04/22/2026", experienceId: "rhom", deviceId: "tp4" },
    { name: "Daniel Wu", email: "daniel.wu@protonmail.com", date: "04/22/2026", experienceId: "rhom", deviceId: "tp4" },
    { anonymous: true, date: "04/22/2026", experienceId: "mary", deviceId: "tp2" },
    { name: "Sophia Reyes", email: "s.reyes@gmail.com", date: "04/22/2026", experienceId: "reef", deviceId: "tp5" },
    { anonymous: true, date: "04/21/2026", experienceId: "wings", deviceId: "tp3" },
    { name: "Henry Clarke", email: "hclarke@btinternet.com", date: "04/21/2026", experienceId: "dino", deviceId: "tp1" },
    { anonymous: true, date: "04/21/2026", experienceId: "reef", deviceId: "tp5" },
    { name: "Isla Murphy", email: "isla.murphy@yahoo.co.uk", date: "04/21/2026", experienceId: "mary", deviceId: "tp2" },
    { anonymous: true, date: "04/20/2026", experienceId: "dino", deviceId: "tp1" },
    { name: "Noah Patel", email: "noah.patel@gmail.com", date: "04/20/2026", experienceId: "wings", deviceId: "tp3" },
    { anonymous: true, date: "04/20/2026", experienceId: "rhom", deviceId: "tp4" },
    { name: "Maya Lindgren", email: "maya@lindgren.se", date: "04/20/2026", experienceId: "reef", deviceId: "tp5" },
    { anonymous: true, date: "04/19/2026", experienceId: "mary", deviceId: "tp2" },
    { name: "Felix Carter", email: "felixc@acmeco.com", date: "04/19/2026", experienceId: "rhom", deviceId: "tp4" },
    { anonymous: true, date: "04/19/2026", experienceId: "wings", deviceId: "tp3" },
    { name: "Anya Volkov", email: "anya.v@studio.io", date: "04/19/2026", experienceId: "dino", deviceId: "tp1" },
    { anonymous: true, date: "04/19/2026", experienceId: "reef", deviceId: "tp5" },
  ];

  const PEOPLE = [
    { name: "Joe Bloggs", email: "joe.bloggs@tapin.me", role: "Organization Admin", status: "Active", updated: "3d ago", spaceIds: ["nhm", "aqs", "swv", "cdm", "nwg"] },
    { name: "Jane Smith", email: "jane.smith@tapin.me", role: "Organization Admin", status: "Active", updated: "6d ago", spaceIds: ["nhm", "aqs", "swv", "cdm", "nwg"] },
    { name: "Andy Wheeler", email: "andy@nhm.org", role: "Space Admin", status: "Inactive", updated: "04/03/2026", spaceIds: ["nhm"] },
    { name: "Lesley Grant", email: "l.grant@nhm.org", role: "Space Admin", status: "Inactive", updated: "04/03/2026", spaceIds: ["nhm", "swv"] },
    { name: "Sally Walker", email: "sally@swv.org", role: "Space Admin", status: "Active", updated: "04/03/2026", spaceIds: ["swv"] },
    { name: "Marcus Allen", email: "m.allen@cdm.org", role: "Space Admin", status: "Active", updated: "04/12/2026", spaceIds: ["cdm"] },
    { name: "Priya Shah", email: "priya@nwg.org", role: "Space Admin", status: "Active", updated: "04/18/2026", spaceIds: ["nwg", "swv"] },
    { name: "Tom Ramirez", email: "tom.r@nwg.org", role: "Space Admin", status: "Active", updated: "04/19/2026", spaceIds: ["nwg"] },
    { name: "Nora Bennett", email: "nora@bennett.co", role: "Space Admin", status: "Active", updated: "04/20/2026", spaceIds: ["swv", "cdm"] },
    { name: "Oliver Park", email: "oliver@aqs.org", role: "Space Admin", status: "Active", updated: "04/21/2026", spaceIds: ["aqs"] },
    { name: "Aisha Khan", email: "a.khan@nhm.org", role: "Space Admin", status: "Active", updated: "04/22/2026", spaceIds: ["nhm", "aqs"] },
    { name: "Daniel Wu", email: "d.wu@cdm.org", role: "Space Admin", status: "Inactive", updated: "04/23/2026", spaceIds: ["cdm", "nwg"] },
  ];

  const PEOPLE_NHM = [
    { name: "Joe Bloggs", status: "Active", type: "Organization Admin", updated: "3d ago" },
    { name: "Jane Smith", status: "Active", type: "Organization Admin", updated: "6d ago" },
    { name: "Andy Wheeler", status: "Inactive", type: "Space Admin", updated: "04/03/2026" },
    { name: "Lesley Grant", status: "Inactive", type: "Space Admin", updated: "04/03/2026" },
    { name: "Sally Walker", status: "Active", type: "Space Admin", updated: "04/03/2026" },
  ];

  const SPACE_TYPES = ["Bar", "Business", "Class", "Club", "Event", "Profile Card", "Restaurant", "Other"];

  // Tap series — one number per day for the chart.
  const TAP_SERIES_ALL = [22, 18, 8, 4, 6, 12, 19, 22, 25, 28, 30, 29, 27, 25, 22, 21, 23, 28, 32, 34, 36, 38, 35, 30, 25, 20, 18, 16];
  const TAP_SERIES_NHM = [21, 14, 6, 4, 5, 9, 18, 19, 24, 28, 30, 29, 27, 24, 21, 20, 22, 27, 31, 33, 37, 38, 33, 28, 23, 19, 17, 16];
  const DAYS = Array.from({ length: 28 }, (_, i) => i + 1); // Apr 1..28
  const REFERENCE_END_ISO = "2026-04-28";
  const ALL_TIME_START_ISO = "2024-01-01";

  function periodRange(period) {
    if (period && period.kind === "custom") return { startISO: period.startISO, endISO: period.endISO };
    if (period && period.kind === "all") return { startISO: ALL_TIME_START_ISO, endISO: REFERENCE_END_ISO };
    const end = new Date(REFERENCE_END_ISO + "T00:00:00");
    if (period && period.kind === "thisYear") {
      return { startISO: end.getFullYear() + "-01-01", endISO: REFERENCE_END_ISO };
    }
    if (period && period.kind === "lastYear") {
      const y = end.getFullYear() - 1;
      return { startISO: y + "-01-01", endISO: y + "-12-31" };
    }
    if (period && period.kind === "today") {
      const s = end.toISOString().slice(0, 10);
      return { startISO: s, endISO: s };
    }
    if (period && period.kind === "yesterday") {
      const y = new Date(end.getTime() - 86400000).toISOString().slice(0, 10);
      return { startISO: y, endISO: y };
    }
    if (period && period.kind === "thisWeek") {
      const dow = end.getDay();
      const start = new Date(end.getTime() - dow * 86400000);
      return { startISO: start.toISOString().slice(0, 10), endISO: REFERENCE_END_ISO };
    }
    if (period && period.kind === "lastWeek") {
      const dow = end.getDay();
      const start = new Date(end.getTime() - (dow + 7) * 86400000);
      const stop = new Date(end.getTime() - (dow + 1) * 86400000);
      return { startISO: start.toISOString().slice(0, 10), endISO: stop.toISOString().slice(0, 10) };
    }
    if (period && period.kind === "thisMonth") {
      const s = new Date(end.getFullYear(), end.getMonth(), 1);
      return { startISO: s.toISOString().slice(0, 10), endISO: REFERENCE_END_ISO };
    }
    if (period && period.kind === "lastMonth") {
      const s = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      const e2 = new Date(end.getFullYear(), end.getMonth(), 0);
      return { startISO: s.toISOString().slice(0, 10), endISO: e2.toISOString().slice(0, 10) };
    }
    const n = period && period.kind === "lastN" ? Math.max(1, period.n || 28) : (period && period.kind === "7" ? 7 : period && period.kind === "90" ? 90 : 28);
    const start = new Date(end.getTime() - (n - 1) * 86400000);
    return { startISO: start.toISOString().slice(0, 10), endISO: REFERENCE_END_ISO };
  }

  function formatRange(startISO, endISO) {
    const s = new Date(startISO + "T00:00:00");
    const e = new Date(endISO + "T00:00:00");
    const f = (d, withYear) => d.toLocaleString("en-US", { month: "short" }) + " " + d.getDate() + (withYear ? ", " + d.getFullYear() : "");
    if (s.getFullYear() === e.getFullYear()) return f(s, false) + " - " + f(e, true);
    return f(s, true) + " - " + f(e, true);
  }

  function periodLabel(period) {
    if (!period) return "Last 28 days";
    if (period.kind === "custom") return "Custom range";
    if (period.kind === "all") return "All time";
    if (period.kind === "thisYear") return "This year";
    if (period.kind === "lastYear") return "Last year";
    if (period.kind === "today") return "Today";
    if (period.kind === "yesterday") return "Yesterday";
    if (period.kind === "thisWeek") return "This week";
    if (period.kind === "lastWeek") return "Last week";
    if (period.kind === "thisMonth") return "This month";
    if (period.kind === "lastMonth") return "Last month";
    if (period.kind === "7") return "Last 7 days";
    if (period.kind === "90") return "Last 90 days";
    if (period.kind === "lastN") return "Last " + (period.n || 28) + " days";
    return "Last 28 days";
  }

  function seriesForPeriod(period, key) {
    const { startISO, endISO } = periodRange(period);
    const start = new Date(startISO + "T00:00:00");
    const end = new Date(endISO + "T00:00:00");
    const n = Math.max(1, Math.round((end - start) / 86400000) + 1);
    const ref = new Date(REFERENCE_END_ISO + "T00:00:00");
    const refStart = new Date(ref.getTime() - 27 * 86400000); // Apr 1 2026
    const baseline = key === "nhm" ? TAP_SERIES_NHM : TAP_SERIES_ALL;
    const seed = key === "nhm" ? 5 : 1;
    const dates = [];
    const values = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      dates.push(d);
      const offsetFromRefStart = Math.round((d - refStart) / 86400000);
      if (offsetFromRefStart >= 0 && offsetFromRefStart < baseline.length) {
        values.push(baseline[offsetFromRefStart]);
      } else {
        const dayNum = Math.floor(d.getTime() / 86400000);
        let h = ((dayNum + seed) * 9301 + 49297) % 233280;
        h = (h * 9301 + 49297) % 233280;
        values.push(Math.round(8 + (h / 233280) * 32));
      }
    }
    return { dates, values };
  }

  function experiencesForPeriod(period, spaceId) {
    const { startISO, endISO } = periodRange(period);
    const days = Math.max(1, Math.round((new Date(endISO + "T00:00:00") - new Date(startISO + "T00:00:00")) / 86400000) + 1);
    const factor = days / 28;
    const seed = days;
    const allExps = (window.DATA && window.DATA.EXPERIENCES) || EXPERIENCES;
    const base = spaceId ? allExps.filter(e => e.spaceId === spaceId) : allExps;
    const list = base.map((e, i) => {
      let h = ((i + 1) * 9301 + seed * 49297) % 233280;
      const jitter = 0.82 + (h / 233280) * 0.36;
      const taps = Math.max(1, Math.round(e.taps * factor * jitter));
      h = (h * 9301 + 49297) % 233280;
      const delta = Math.round((h / 233280) * 30 - 12);
      return { ...e, taps, delta };
    });
    list.sort((a, b) => b.taps - a.taps);
    return list;
  }

  function previousPeriodLabel(period) {
    if (!period) return "vs. previous 28 days";
    if (period.kind === "7") return "vs. previous 7 days";
    if (period.kind === "28") return "vs. previous 28 days";
    if (period.kind === "90") return "vs. previous 90 days";
    if (period.kind === "all") return "all-time total";
    if (period.kind === "thisYear") return "vs. last year";
    if (period.kind === "lastYear") return "vs. prior year";
    if (period.kind === "lastN") return "vs. previous " + (period.n || 28) + " days";
    return "vs. previous period";
  }

  function metricsForPeriod(period, scope) {
    const { startISO, endISO } = periodRange(period);
    const days = Math.max(1, Math.round((new Date(endISO + "T00:00:00") - new Date(startISO + "T00:00:00")) / 86400000) + 1);
    const seriesKey = scope === "all" ? "all" : scope;
    const { values } = seriesForPeriod(period, seriesKey);
    const totalTaps = values.reduce((a, b) => a + b, 0);
    const seed = days + (scope || "all").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    let s = seed;
    const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const uniqueVisitors = Math.max(1, Math.round(totalTaps * (0.42 + next() * 0.08)));
    const leadsCaptured = Math.max(1, Math.round(totalTaps * (0.05 + next() * 0.02)));
    const conversionRate = ((leadsCaptured / Math.max(1, uniqueVisitors)) * 100);
    const tapsDelta = Math.round((next() - 0.35) * 28);
    const visitorsDelta = Math.round((next() - 0.35) * 22);
    const leadsDelta = Math.round((next() - 0.35) * 30);
    const conversionDelta = ((next() - 0.35) * 4);
    return {
      totalTaps,
      uniqueVisitors,
      leadsCaptured,
      conversionRate,
      tapsDelta,
      visitorsDelta,
      leadsDelta,
      conversionDelta,
    };
  }

  function fmtDelta(n, suffix) {
    const sign = n > 0 ? "+" : "";
    return sign + n + (suffix || "%");
  }

  function aggregateSeries(seriesObj, frequency) {
    const { dates, values } = seriesObj;
    if (!frequency || frequency === "daily") return { dates, values };
    if (frequency === "weekly") {
      const buckets = [];
      for (let i = 0; i < values.length; i += 7) {
        const sum = values.slice(i, i + 7).reduce((a, b) => a + b, 0);
        buckets.push({ date: dates[i], value: sum });
      }
      return { dates: buckets.map(b => b.date), values: buckets.map(b => b.value) };
    }
    if (frequency === "monthly") {
      const groups = new Map();
      for (let i = 0; i < values.length; i++) {
        const d = dates[i];
        const key = d.getFullYear() + "-" + d.getMonth();
        if (!groups.has(key)) groups.set(key, { date: new Date(d.getFullYear(), d.getMonth(), 1), value: 0 });
        groups.get(key).value += values[i];
      }
      const arr = [...groups.values()];
      return { dates: arr.map(b => b.date), values: arr.map(b => b.value) };
    }
    if (frequency === "quarterly") {
      const groups = new Map();
      for (let i = 0; i < values.length; i++) {
        const d = dates[i];
        const q = Math.floor(d.getMonth() / 3);
        const key = d.getFullYear() + "-Q" + q;
        if (!groups.has(key)) groups.set(key, { date: new Date(d.getFullYear(), q * 3, 1), value: 0, q });
        groups.get(key).value += values[i];
      }
      const arr = [...groups.values()];
      return { dates: arr.map(b => b.date), values: arr.map(b => b.value) };
    }
    return { dates, values };
  }

  const PEOPLE_SEED = PEOPLE.slice();
  const USER_FIRST = ["Alex","Jordan","Sam","Riley","Casey","Morgan","Taylor","Hayden","Avery","Quinn","Skyler","Drew","Reese","Logan","Jamie","Charlie","Parker","Rowan","Sasha","Phoenix"];
  const USER_LAST = ["Park","Singh","Davis","Nguyen","Cohen","Hassan","O'Neill","Brennan","Becker","Ito","Lopez","Mendez","Yamada","Carter","Brooks","Pierce","Pereira","Carlsen","Ahmed","Whitfield"];

  // ─── Original (seed) data, kept so tweaks can grow/shrink predictably ───
  const SPACES_SEED = SPACES.slice();
  const EXPERIENCES_SEED = EXPERIENCES.slice();
  const TAPPOINTS_SEED = TAPPOINTS.slice();

  const SPACE_NAMES = [
    "Highland Heritage Centre, Inverness",
    "Maritime Discovery, Bristol",
    "Royal Aviation Hangar, Kent",
    "Frostlands Botanical Garden, Reykjavik",
    "Coral Bay Visitor Center, Sydney",
    "Stellar Observatory, Atacama",
    "Forge & Anvil Industrial Museum, Sheffield",
    "Pacific Ridge Aquarium, Monterey",
    "Tides & Tales Storybook Park, Dover",
    "Cobalt Press Print House, Boston",
    "Tundra Wildlife Station, Yellowknife",
    "Eastern Steam Railway, Yorkshire",
    "Volcano Quay Geology Hall, Naples",
    "Sapphire Lagoon Reefs, Maldives",
    "Polestar Planetarium, Helsinki",
  ];
  const SPACE_SHORTS = ["HHC", "MDB", "RAH", "FBG", "CBV", "STO", "FAM", "PRA", "TTP", "CPH", "TWS", "ESR", "VQH", "SLR", "PSP"];
  const EXP_NAMES = [
    "Aurora Chasers", "Whispering Reeds", "Ironworks Forge", "Stardust Voyage", "Tidal Garden",
    "Lost Cities Below", "Steamline Echoes", "Hidden Constellations", "Frostlight Halls", "Mariners' Tale",
    "Inkwell Stories", "Echoes of the Forge", "Sapphire Tide", "Coral Symphony", "Northern Drift",
    "Glassblower's Hand", "Compass & Quill", "Highland Songs", "Ember & Ash", "Petal Theatre",
  ];
  const EXP_TYPES = ["Hub", "Card", "Sticker", "Hub", "Card"];

  function applyDataTweaks(counts) {
    const wantSpaces = Math.max(0, counts.spaces != null ? counts.spaces : SPACES_SEED.length);
    const wantExps = Math.max(0, counts.experiences != null ? counts.experiences : EXPERIENCES_SEED.length);
    const wantTps = Math.max(0, counts.tappoints != null ? counts.tappoints : TAPPOINTS_SEED.length);
    const wantUsers = Math.max(0, counts.users != null ? counts.users : PEOPLE_SEED.length);

    // ─ Spaces ─
    const spaces = SPACES_SEED.slice(0, wantSpaces).map(s => ({ ...s }));
    while (spaces.length < wantSpaces) {
      const i = spaces.length - SPACES_SEED.length;
      const name = SPACE_NAMES[i % SPACE_NAMES.length];
      const short = SPACE_SHORTS[i % SPACE_SHORTS.length];
      const idBase = name.split(",")[0].toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 5);
      const id = idBase + (i + 1);
      const seed = (i + 1) * 9301 % 4096;
      spaces.push({
        id, name, short,
        members: 1 + (seed % 4),
        taps: 80 + ((seed * 13) % 800),
        devices: 2 + (seed % 18),
        experiences: 1 + (seed % 10),
        admins: seed % 2 === 0 ? ["Joe Bloggs"] : ["Joe Bloggs", "Jane Smith"],
        type: "Business",
        description: "Generated space for demo.",
        active: true,
        updated: ((seed % 28) + 1) + "d ago",
      });
    }

    // ─ Experiences ─
    const exps = EXPERIENCES_SEED.slice(0, wantExps).map(e => ({ ...e }));
    const EXTRA_TAG_POOL = ["family", "permanent", "promo", "educational", "event", "popular", "seasonal"];
    while (exps.length < wantExps && spaces.length > 0) {
      const i = exps.length - EXPERIENCES_SEED.length;
      const name = EXP_NAMES[i % EXP_NAMES.length] + (i >= EXP_NAMES.length ? " " + Math.floor(i / EXP_NAMES.length + 1) : "");
      const id = "ex" + (i + 100);
      const seed = (i + 7) * 4133;
      const spaceId = spaces[(i + 1) % spaces.length].id;
      const taps = 8 + (seed % 90);
      const tagCount = (seed % 3); // 0, 1 or 2 tags
      const tagList = [];
      for (let k = 0; k <= tagCount; k++) {
        const t = EXTRA_TAG_POOL[(seed + k * 17) % EXTRA_TAG_POOL.length];
        if (!tagList.includes(t)) tagList.push(t);
      }
      exps.push({
        id, name,
        type: EXP_TYPES[i % EXP_TYPES.length],
        spaceId,
        taps,
        visitors: Math.max(4, Math.round(taps * 0.45)),
        leads: Math.max(1, Math.round(taps * 0.09)),
        updated: ((seed % 28) + 1) + "d ago",
        delta: ((seed % 36) - 12),
        tags: tagList,
      });
    }

    // If we trimmed spaces, drop experiences that referenced removed spaces.
    const validSpaceIds = new Set(spaces.map(s => s.id));
    const expsFiltered = exps.filter(e => validSpaceIds.has(e.spaceId));

    // ─ TapPoints ─
    const tps = TAPPOINTS_SEED.slice(0, wantTps).map(t => ({ ...t }));
    while (tps.length < wantTps && expsFiltered.length > 0) {
      const i = tps.length - TAPPOINTS_SEED.length;
      const num = i + TAPPOINTS_SEED.length + 1;
      const seed = (i + 11) * 7237;
      const hex = ("0000000000000000" + (seed * 271828 % 0xffffffffff).toString(16).toUpperCase()).slice(-14);
      const exp = expsFiltered[(i + 1) % expsFiltered.length];
      tps.push({
        id: "tp" + num,
        name: "TapPoint " + num,
        xuid: hex,
        status: seed % 11 === 0 ? "Inactive" : "Active",
        experienceId: exp.id,
        spaceId: exp.spaceId,
        updated: ((seed % 28) + 1) + "d ago",
      });
    }
    // Drop TapPoints whose experience/space disappeared.
    const validExpIds = new Set(expsFiltered.map(e => e.id));
    const tpsFiltered = tps.filter(t => !t.experienceId || (validExpIds.has(t.experienceId) && validSpaceIds.has(t.spaceId)));

    // ─ Users ─
    const users = PEOPLE_SEED.slice(0, wantUsers).map(p => ({ ...p, spaceIds: p.spaceIds.filter(id => validSpaceIds.has(id)) }));
    while (users.length < wantUsers) {
      const i = users.length - PEOPLE_SEED.length;
      const first = USER_FIRST[i % USER_FIRST.length];
      const last = USER_LAST[(i * 3 + 1) % USER_LAST.length];
      const name = first + " " + last;
      const email = first.toLowerCase() + "." + last.toLowerCase().replace(/[^a-z]/g, "") + "@example.com";
      const seed = (i + 5) * 6151;
      const role = seed % 7 === 0 ? "Organization Admin" : "Space Admin";
      const status = seed % 9 === 0 ? "Inactive" : "Active";
      const sp = spaces.length === 0 ? [] : [spaces[seed % spaces.length].id];
      if (seed % 3 === 0 && spaces.length > 1) sp.push(spaces[(seed + 1) % spaces.length].id);
      users.push({ name, email, role, status, updated: ((seed % 28) + 1) + "d ago", spaceIds: Array.from(new Set(sp)) });
    }

    // Re-aggregate per-space rollups so the dashboards stay consistent.
    spaces.forEach(s => {
      s.experiences = expsFiltered.filter(e => e.spaceId === s.id).length;
      s.devices = tpsFiltered.filter(t => t.spaceId === s.id).length;
      s.members = users.filter(u => u.spaceIds.includes(s.id)).length;
    });

    window.DATA.SPACES = spaces;
    window.DATA.EXPERIENCES = expsFiltered;
    window.DATA.TAPPOINTS = tpsFiltered;
    window.DATA.PEOPLE = users;

    // ─ Announcements (per-space) ─
    // Seed every space's announcements into localStorage so the AnnouncementsTab
    // shows them out of the box. Re-runs whenever the tweak changes.
    const wantAnn = Math.max(0, counts.announcements != null ? counts.announcements : 6);
    const ANN_TITLES = [
      "Closed Monday for renovations", "New summer hours start June 1", "Members-only preview night",
      "Free family weekend", "Half-term holiday programme", "Workshop signups open",
      "Late opening this Thursday", "Annual fundraiser approaching", "School visit guidelines updated",
      "Volunteer day this Saturday", "Photography rules reminder", "Cafe menu refresh",
      "Lost & found: claim items by end of month", "New audio guide available", "Accessibility tour now monthly",
      "Survey reward — coffee voucher", "Gift shop seasonal sale", "Newsletter signup boost",
      "After-hours event tickets", "Garden re-opens next week",
    ];
    const ANN_BODIES = [
      "We're sprucing up the main hall. Doors reopen at 10am.",
      "Plan your visit with our new opening times.",
      "Members get an exclusive first look on Friday evening.",
      "Bring the kids — entry is free all weekend.",
      "Daily activities running through the break.",
      "Limited spots available — first come, first served.",
      "Stay past 6pm with reduced lighting and live music.",
      "Help us reach our goal — donations match this week.",
      "Updated guidance for booking school visits.",
      "Help us tidy the grounds — coffee and pastries provided.",
      "No flash photography in galleries 1–3.",
      "Try our new seasonal menu, available all summer.",
      "Items unclaimed after May 31 will be donated.",
      "Try our new audio guide on the lobby tablets.",
      "Monthly accessibility-focused tour every first Sunday.",
      "Take our 2-minute survey for a free coffee.",
      "20% off sale items, in-store only.",
      "Sign up at the welcome desk for monthly updates.",
      "Tickets now on sale for our after-hours event series.",
      "Garden reopens with new wildflower walkway.",
    ];
    spaces.forEach((s, spaceIdx) => {
      const storageKey = "tapin_announcements_" + s.id;
      let existing = null;
      try { existing = localStorage.getItem(storageKey); } catch (e) {}
      let cur = [];
      try { cur = existing ? JSON.parse(existing) : []; } catch (e) { cur = []; }
      // If the user has manually added/edited entries (i.e. there's a non-seeded item)
      // we don't blow them away. The seeded items have id prefix "ann-seed-".
      const userAdded = cur.filter((a) => !String(a.id || "").startsWith("ann-seed-"));
      const seeded = [];
      for (let i = 0; i < wantAnn; i++) {
        const seed = (spaceIdx * 31 + i * 7) | 0;
        const titleIdx = (Math.abs(seed) + spaceIdx) % ANN_TITLES.length;
        const bodyIdx = (Math.abs(seed * 3) + i) % ANN_BODIES.length;
        // Stagger dates: some active, some scheduled, some expired
        const daysOffset = ((seed % 60) - 20); // -20 to +40
        const start = new Date(2026, 4, 1 + daysOffset);
        const end = new Date(start.getTime() + ((Math.abs(seed) % 20) + 5) * 86400000);
        const iso = (d) => d.toISOString().slice(0, 10);
        const expIds = (i % 3 === 0)
          ? []  // All experiences
          : expsFiltered.filter((e) => e.spaceId === s.id).slice(0, (Math.abs(seed) % 3) + 1).map((e) => e.id);
        seeded.push({
          id: "ann-seed-" + s.id + "-" + i,
          title: ANN_TITLES[titleIdx],
          content: ANN_BODIES[bodyIdx],
          startDate: iso(start),
          endDate: iso(end),
          experienceIds: expIds,
        });
      }
      try { localStorage.setItem(storageKey, JSON.stringify([...seeded, ...userAdded])); } catch (e) {}
    });

    return { spaces, exps: expsFiltered, tps: tpsFiltered, users };
  }

  window.applyDataTweaks = applyDataTweaks;

  function multiSeriesForPeriod(period, scope, frequency) {
    const seriesKey = scope === "all" || !scope ? "all" : scope;
    const raw = seriesForPeriod(period, seriesKey);
    // Per-day uniqueVisitors + leadsCaptured derived from taps with a seeded RNG.
    // Ratios match metricsForPeriod (~0.46 uniques/tap, ~0.06 leads/tap) so totals line up.
    const seed = (scope || "all").split("").reduce((a, c) => a + c.charCodeAt(0), 17);
    let s = seed;
    const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const uniquesDaily = raw.values.map((v) => Math.max(0, Math.round(v * (0.40 + next() * 0.12))));
    const leadsDaily = raw.values.map((v, i) =>
      Math.max(0, Math.min(uniquesDaily[i], Math.round(v * (0.04 + next() * 0.04))))
    );

    // Aggregate each count series via aggregateSeries; recompute conversion per bucket.
    const tapsAgg = aggregateSeries({ dates: raw.dates, values: raw.values }, frequency);
    const uniquesAgg = aggregateSeries({ dates: raw.dates, values: uniquesDaily }, frequency);
    const leadsAgg = aggregateSeries({ dates: raw.dates, values: leadsDaily }, frequency);
    const conversionRate = uniquesAgg.values.map((u, i) =>
      u > 0 ? (leadsAgg.values[i] / u) * 100 : 0
    );
    return {
      dates: tapsAgg.dates,
      totalTaps: tapsAgg.values,
      uniqueVisitors: uniquesAgg.values,
      leadsCaptured: leadsAgg.values,
      conversionRate,
    };
  }

  Object.assign(window, { aggregateSeries, periodRange, formatRange, periodLabel, seriesForPeriod, multiSeriesForPeriod, experiencesForPeriod, metricsForPeriod, previousPeriodLabel, fmtDelta });


  Object.assign(window, {
    DATA: {
      SPACES, EXPERIENCES, TAPPOINTS, RECENT_TAPS, PEOPLE, PEOPLE_NHM, SPACE_TYPES,
      TAP_SERIES_ALL, TAP_SERIES_NHM, DAYS,
    },
  });
})();
