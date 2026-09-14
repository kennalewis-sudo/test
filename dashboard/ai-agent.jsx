// ai-agent.jsx
// "Ask TapIn AI" — agentic workflow assistant.
//
// Surface:
//   - Floating launcher pill (bottom-right) when the AI Agent tweak is ON.
//   - Right-side slide-out panel (~460px) with a real state machine:
//       step:   idle → asking → preview → applying → done
//                                        ↘ analytics  (for Q&A intents)
//       flow:   "setup-tappoints" | "create-experience" | "analyze-space"
//               | "improve-experience" | "analytics" | null
//
// Designed to feel like a workflow assistant, not a chatbot:
//   - large cards, checklist confirmations, summary rows
//   - the prompt input parses intent (keywords + suggested cards) then
//     advances through a slot-filling Q&A
//   - "Confirm & apply" actually mutates window.DATA and bumps the
//     re-render counter so the TapPoints / Experiences screens update
//
// Reviewers can still jump between the three example states using the
// "View" tabs in the header — those reset the panel to a representative
// pre-filled session so each design is reachable without typing through.

const { useState: useStateAA, useEffect: useEffectAA, useRef: useRefAA, useMemo: useMemoAA, useReducer: useReducerAA } = React;

// ─── Icons ──────────────────────────────────────────────────────────────
const AAIcon = {
  Sparkle: ({ s = 14, c = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5L13.6 9.2C13.85 10.25 14.7 11.06 15.76 11.27L22 12.5L15.76 13.73C14.7 13.94 13.85 14.75 13.6 15.8L12 22.5L10.4 15.8C10.15 14.75 9.3 13.94 8.24 13.73L2 12.5L8.24 11.27C9.3 11.06 10.15 10.25 10.4 9.2L12 2.5Z" fill={c}/>
      <path d="M19.5 3L19.95 4.55C20.05 4.88 20.31 5.13 20.63 5.22L22 5.6L20.63 5.98C20.31 6.07 20.05 6.32 19.95 6.65L19.5 8.2L19.05 6.65C18.95 6.32 18.69 6.07 18.37 5.98L17 5.6L18.37 5.22C18.69 5.13 18.95 4.88 19.05 4.55L19.5 3Z" fill={c} opacity="0.7"/>
    </svg>
  ),
  X: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  Send: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 8h12M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Mic: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="6" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M3.5 8a4.5 4.5 0 009 0M8 12.5V14M5.5 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  Plus: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  Arrow: ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M2 6h8M10 6L7 3M10 6L7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check: ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Pencil: ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2L4 10l-2.5.5L2 8l6.5-6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Tap: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  Layout: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 5.5h13M5.5 5.5v9" stroke="currentColor" strokeWidth="1.4"/></svg>,
  Chart: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 13h12M4 13V8M7 13V4M10 13V6M13 13V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Bolt: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M9 1L3 9.5h4L7 15l6-8.5H9L9 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  Wand: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M11 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM2 14l5-5M7 9l1 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Space: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 6l6-3.5L14 6 8 9.5 2 6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M2 10l6 3.5L14 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  Doc: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 1.5h7L13 4.5V14a.5.5 0 01-.5.5h-9A.5.5 0 013 14V2a.5.5 0 010-.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M5.5 8h5M5.5 10.5h5M5.5 5.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Stack: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 14h9V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  Refresh: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 14 14" fill="none"><path d="M12 3v3h-3M2 11V8h3M2.7 6A4.4 4.4 0 0111 5l1 1M11.3 8A4.4 4.4 0 013 9l-1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── Static config ──────────────────────────────────────────────────────
const SUGGESTED = [
  { id: "setup-tappoints",   icon: AAIcon.Tap,    title: "Set up TapPoints",        body: "Activate new devices, assign experiences, and publish." },
  { id: "create-experience", icon: AAIcon.Layout, title: "Create experiences",      body: "Generate from a template, in one space or many." },
  { id: "analyze-space",     icon: AAIcon.Chart,  title: "Analyze this space",      body: "Summarize performance, anomalies, and movers." },
  { id: "improve-experience",icon: AAIcon.Wand,   title: "Improve this experience", body: "Recommend content, layout, and CTA tweaks." },
];

const QUICK_ASKS = [
  "Why are taps down?",
  "Which exhibit is performing best?",
  "What should we improve first?",
  "Which TapPoints need attention?",
];

// Built-in templates. In production these would live in window.DATA, but the
// existing schema doesn't model them — so the agent ships a curated set.
const TEMPLATES = [
  { id: "tpl-nh",      name: "Natural History",  type: "Hub",     description: "Hero image, story sections, lead form." },
  { id: "tpl-aq",      name: "Aquarium",         type: "Hub",     description: "Tank guide layout with species cards." },
  { id: "tpl-gallery", name: "Art Gallery",      type: "Hub",     description: "Minimal artwork-first layout with captions." },
  { id: "tpl-welcome", name: "Welcome Card",     type: "Card",    description: "Single-screen visitor greeting." },
  { id: "tpl-event",   name: "Event Sticker",    type: "Sticker", description: "Lightweight promo for a single event." },
];

// ─── Workflow definitions ───────────────────────────────────────────────
// Each flow is a list of "slots" to fill. The runner asks one question
// per slot in order, accepting a free-text answer or an option chip.
function flowSteps(flowId) {
  if (flowId === "setup-tappoints") {
    return [
      { slot: "tappointIds", ask: "Which TapPoints would you like to set up? Filter by status or tag, then pick the ones you want.", kind: "tappoints-multi" },
      { slot: "targetRef",   ask: "What should they point to? Assign an existing experience, or create a new one from a template.", kind: "experience-or-template" },
      { slot: "status",      ask: "Should these go live as published, or save as drafts?",
        kind: "choice", options: [
          { value: "publish", label: "Publish to all", primary: true },
          { value: "draft",   label: "Save as drafts" },
        ]
      },
    ];
  }
  if (flowId === "create-experience") {
    return [
      { slot: "spaceId",    ask: "Which space is this experience for?",             kind: "space" },
      { slot: "templateId", ask: "Which template do you want to start from?",       kind: "template" },
      { slot: "name",       ask: "What should I name it?",                          kind: "text", suggest: ["Welcome", "Highlights", "New arrivals"] },
      { slot: "status",     ask: "Publish it now, or save as a draft?",
        kind: "choice", options: [
          { value: "publish", label: "Publish now", primary: true },
          { value: "draft",   label: "Save as draft" },
        ]
      },
    ];
  }
  if (flowId === "improve-experience") {
    return [
      { slot: "experienceId", ask: "Which experience should I review?", kind: "experience" },
    ];
  }
  if (flowId === "analyze-space") {
    return [
      { slot: "spaceId", ask: "Which space should I analyze?", kind: "space" },
    ];
  }
  return [];
}

function flowTitle(flowId) {
  return {
    "setup-tappoints":    "Set up TapPoints",
    "create-experience":  "Create an experience",
    "analyze-space":      "Analyze a space",
    "improve-experience": "Improve an experience",
    "analytics":          "Ask TapIn AI",
  }[flowId] || "Ask TapIn AI";
}

// ─── Intent detection ───────────────────────────────────────────────────
// Lightweight keyword router for the free-text prompt. The user's plain
// English maps to one of the four workflows or falls through to analytics.
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/\b(set ?up|configure|activate|register|provision)\b.*\btap/i.test(t)) return "setup-tappoints";
  if (/\b(tap ?points?)\b.*\b(set ?up|configure|activate|register|provision)\b/i.test(t)) return "setup-tappoints";
  if (/\b(create|build|make|new)\b.*\bexperience/i.test(t)) return "create-experience";
  if (/\bexperience\b.*\b(create|build|make|new)\b/i.test(t)) return "create-experience";
  if (/\banalyz|analys|summary|summarise|summarize|performance|how.*doing\b/.test(t)) return "analyze-space";
  if (/\bimprove|optimi[sz]e|fix|recommend|suggest|better\b/.test(t)) return "improve-experience";
  return "analytics";
}

// Crude noun extraction so an answer like "Natural History Museum" can pick
// the matching space without making the user type an exact name.
function findSpace(text) {
  const spaces = (window.DATA && window.DATA.SPACES) || [];
  const t = text.toLowerCase().trim();
  return spaces.find((s) => s.name.toLowerCase().includes(t) || t.includes(s.name.toLowerCase())
    || (s.short && t.includes(s.short.toLowerCase()))) || null;
}
function findTemplate(text) {
  const t = text.toLowerCase().trim();
  return TEMPLATES.find((p) => p.name.toLowerCase().includes(t) || t.includes(p.name.toLowerCase())) || null;
}
function findExperience(text) {
  const exps = (window.DATA && window.DATA.EXPERIENCES) || [];
  const t = text.toLowerCase().trim();
  return exps.find((e) => e.name.toLowerCase().includes(t) || t.includes(e.name.toLowerCase())) || null;
}
function parseNumber(text) {
  const m = text.match(/\b(\d{1,3})\b/);
  if (m) return parseInt(m[1], 10);
  const words = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, dozen:12 };
  const lower = text.toLowerCase();
  for (const w in words) if (lower.includes(w)) return words[w];
  return null;
}

// ─── Session reducer ────────────────────────────────────────────────────
const initialSession = {
  flow: null,
  stepIdx: 0,
  answers: {},      // slot → value
  messages: [],     // [{from: "ai"|"you", text, kind?, choices?}]
  status: "idle",   // idle | asking | preview | applying | done | analytics
  analytics: null,  // { question, answer, loading }
};

function sessionReducer(state, action) {
  switch (action.type) {
    case "RESET":
      return { ...initialSession, ...action.payload };
    case "START_FLOW": {
      const flow = action.flow;
      const steps = flowSteps(flow);
      const first = steps[0];
      return {
        ...initialSession,
        flow,
        status: "asking",
        stepIdx: 0,
        messages: action.greeting
          ? [
              { from: "you", text: action.greeting },
              { from: "ai", text: `Sure — let's ${flowTitle(flow).toLowerCase()}.` },
              { from: "ai", text: first.ask, kind: "question" },
            ]
          : [{ from: "ai", text: `Sure — let's ${flowTitle(flow).toLowerCase()}.` }, { from: "ai", text: first.ask, kind: "question" }],
      };
    }
    case "ANSWER": {
      const { slot, value, displayText, advance } = action;
      const newAnswers = { ...state.answers, [slot]: value };
      const newMessages = [...state.messages, { from: "you", text: displayText }];
      const steps = flowSteps(state.flow);
      const nextIdx = state.stepIdx + 1;
      if (nextIdx >= steps.length || !advance) {
        // Last slot — short-circuit some flows to preview, or to analytics-style summaries
        if (state.flow === "analyze-space" || state.flow === "improve-experience") {
          return { ...state, answers: newAnswers, status: "analytics", messages: newMessages };
        }
        return { ...state, answers: newAnswers, status: "preview", messages: newMessages };
      }
      const nextStep = steps[nextIdx];
      return {
        ...state,
        answers: newAnswers,
        stepIdx: nextIdx,
        status: "asking",
        messages: [...newMessages, { from: "ai", text: nextStep.ask, kind: "question" }],
      };
    }
    case "BACK_TO_QUESTIONING":
      return { ...state, status: "asking" };
    case "PATCH_ANSWERS":
      return { ...state, answers: { ...state.answers, ...action.patch } };
    case "GO_TO_PREVIEW":
      return { ...state, status: "preview" };
    case "APPLY_START":
      return { ...state, status: "applying" };
    case "APPLY_DONE":
      return { ...state, status: "done" };
    case "ANALYTICS_LOADING":
      return {
        ...state,
        flow: "analytics",
        status: "analytics",
        analytics: { question: action.question, answer: null, loading: true },
        messages: [...state.messages, { from: "you", text: action.question }],
      };
    case "ANALYTICS_RESULT":
      return {
        ...state,
        analytics: { ...state.analytics, answer: action.answer, loading: false },
      };
    case "EDIT_SLOT": {
      // Jump back to a specific slot so the user can amend it.
      const steps = flowSteps(state.flow);
      const idx = steps.findIndex((s) => s.slot === action.slot);
      if (idx < 0) return state;
      return {
        ...state,
        stepIdx: idx,
        status: "asking",
        messages: [...state.messages, { from: "ai", text: "Sure — " + steps[idx].ask.toLowerCase() }],
      };
    }
    default:
      return state;
  }
}

// ─── Pre-filled "demo" sessions ─────────────────────────────────────────
// The three "View" tabs in the header reset the panel to one of these so a
// reviewer can see each design without typing through. The dispatch picks
// a fresh start for each tab; no state leakage between them.
function demoSession(viewId) {
  if (viewId === "workflow") {
    // Mid-workflow: TapPoints already picked, on the experience/template step.
    const tps = (window.DATA?.TAPPOINTS) || [];
    const dinoHallTps = tps
      .filter((t) => (t.tags || []).includes("dinosaur-hall") || (t.spaceId === "nhm" && t.status !== "Active"))
      .slice(0, 6)
      .map((t) => t.id);
    const fallback = tps.filter((t) => t.spaceId === "nhm" && t.status !== "Active").slice(0, 6).map((t) => t.id);
    const selected = dinoHallTps.length >= 4 ? dinoHallTps : (fallback.length ? fallback : tps.slice(0, 4).map((t) => t.id));
    return {
      flow: "setup-tappoints",
      stepIdx: 1,
      status: "asking",
      answers: { tappointIds: selected },
      messages: [
        { from: "you", text: "Set up TapPoints for Dinosaur Hall." },
        { from: "ai",  text: "Sure — let's set up tappoints." },
        { from: "ai",  text: "Which TapPoints would you like to set up? Filter by status or tag, then pick the ones you want.", kind: "question" },
        { from: "you", text: `${selected.length} TapPoint${selected.length === 1 ? "" : "s"} selected` },
        { from: "ai",  text: "What should they point to? Assign an existing experience, or create a new one from a template.", kind: "question" },
      ],
      analytics: null,
    };
  }
  if (viewId === "preview") {
    const tps = (window.DATA?.TAPPOINTS) || [];
    const dinoHallTps = tps
      .filter((t) => (t.tags || []).includes("dinosaur-hall") || (t.spaceId === "nhm" && t.status !== "Active"))
      .slice(0, 6)
      .map((t) => t.id);
    const fallback = tps.filter((t) => t.spaceId === "nhm" && t.status !== "Active").slice(0, 6).map((t) => t.id);
    const selected = dinoHallTps.length >= 4 ? dinoHallTps : (fallback.length ? fallback : tps.slice(0, 4).map((t) => t.id));
    return {
      flow: "setup-tappoints",
      stepIdx: 3,
      status: "preview",
      answers: { tappointIds: selected, targetRef: "tpl:tpl-nh", status: "publish" },
      messages: [],
      analytics: null,
    };
  }
  return { ...initialSession };
}

// ─── Mock chat history ──────────────────────────────────────────────────
// Pre-loaded so reviewers can see past sessions in the ⋯ menu and jump
// straight to them. Live sessions are appended after each successful apply.
function buildMockChats() {
  return [
    {
      id: "chat-dh-preview",
      title: "Set up 6 TapPoints for Dinosaur Hall",
      stamp: "2h ago",
      summary: "Ready to apply · Natural History template · Publish",
      seed: () => demoSession("preview"),
    },
    {
      id: "chat-dh-workflow",
      title: "Configure new museum devices",
      stamp: "Yesterday",
      summary: "In progress · picking template",
      seed: () => demoSession("workflow"),
    },
    {
      id: "chat-analytics-taps",
      title: "Why are taps down?",
      stamp: "3 days ago",
      summary: "Asked TapIn AI",
      seed: () => ({
        flow: "analytics",
        status: "analytics",
        stepIdx: 0,
        answers: {},
        messages: [{ from: "you", text: "Why are taps down?" }],
        analytics: {
          question: "Why are taps down?",
          answer: "The biggest drag is Rhomaleosaurus, down 14% vs last period — likely a content-freshness issue. Your TapPoint counts are healthy, and mid-week traffic is steady. I'd refresh the hero on Rhomaleosaurus first.",
          loading: false,
        },
      }),
    },
    {
      id: "chat-improve",
      title: "Improve Mary Anning",
      stamp: "May 21",
      summary: "Recommendations applied",
      seed: () => ({
        flow: "improve-experience",
        status: "analytics",
        stepIdx: 0,
        answers: { experienceId: "mary" },
        messages: [
          { from: "you", text: "Improve this experience" },
          { from: "ai", text: "Which experience should I review?", kind: "question" },
          { from: "you", text: "Mary Anning" },
        ],
        analytics: null,
      }),
    },
  ];
}

// ─── Back-button targets ────────────────────────────────────────────────
// Where the back arrow should land for the current session state. Returns
// null when there's nowhere to go back to (we hide the button).
function backTargetFor(session) {
  if (session.status === "preview")   return { kind: "to-asking" };   // back to questions
  if (session.status === "asking")    return { kind: "reset" };       // back to greeting
  if (session.status === "analytics") return { kind: "reset" };
  if (session.status === "done")      return { kind: "reset" };
  return null;
}

// ─── Three-dot menu ─────────────────────────────────────────────────────
function AAMenu({ onNewChat, chats, onPickChat }) {
  const [open, setOpen] = useStateAA(false);
  const wrapRef = useRefAA(null);
  useEffectAA(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div className="aa-menu" ref={wrapRef}>
      <button className="aa-iconbtn" aria-label="Menu" aria-haspopup="menu" aria-expanded={open}
              onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="2.5" cy="7" r="1.4" fill="currentColor"/>
          <circle cx="7"   cy="7" r="1.4" fill="currentColor"/>
          <circle cx="11.5" cy="7" r="1.4" fill="currentColor"/>
        </svg>
      </button>
      {open && (
        <div className="aa-menu__pop" role="menu">
          <button className="aa-menu__item" role="menuitem"
                  onClick={() => { setOpen(false); onNewChat(); }}>
            <AAIcon.Plus s={12}/>
            <span>New chat</span>
          </button>
          <div className="aa-menu__sep"/>
          <p className="aa-menu__lbl">Chats</p>
          {chats.length === 0 && <p className="aa-menu__empty">No previous chats yet.</p>}
          {chats.map((c) => (
            <button key={c.id} className="aa-menu__chat" role="menuitem"
                    onClick={() => { setOpen(false); onPickChat(c); }}>
              <span className="aa-menu__chathead">
                <span className="aa-menu__chattitle">{c.title}</span>
                <span className="aa-menu__chatstamp">{c.stamp}</span>
              </span>
              <span className="aa-menu__chatsub">{c.summary}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function AIAgentLauncher({ open, onClick }) {
  if (open) return null;
  return (
    <button type="button" className="aa-launcher" onClick={onClick} aria-label="Open Ask TapIn AI">
      <span className="aa-launcher__mark"><AAIcon.Sparkle s={14} c="#fff"/></span>
      <span className="aa-launcher__text">Ask TapIn AI</span>
      <span className="aa-launcher__kbd">⌘K</span>
    </button>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────
function AAHeader({ session, onClose, onBack, onNewChat, chats, onPickChat }) {
  const title = (() => {
    if (session.status === "preview")  return "Review before applying";
    if (session.status === "applying") return "Applying changes…";
    if (session.status === "done")     return "Changes applied";
    if (session.status === "analytics") return flowTitle(session.flow);
    if (session.flow) return flowTitle(session.flow);
    return "Ask TapIn AI";
  })();
  const sub = (() => {
    if (session.flow && session.status === "asking") {
      const steps = flowSteps(session.flow);
      if (steps.length > 1) return `Step ${Math.min(session.stepIdx + 1, steps.length)} of ${steps.length} · gathering details`;
    }
    if (session.status === "preview") return "Confirm to publish";
    if (session.status === "applying") return "Saving…";
    if (session.status === "done") return "All good — you can close this panel";
    return "Your workflow assistant";
  })();
  const back = backTargetFor(session);

  return (
    <header className="aa-head">
      <div className="aa-head__top">
        <div className="aa-head__brand">
          {back && (
            <button className="aa-back" onClick={onBack} aria-label="Back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.5 2.5L4 7l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <span className="aa-head__mark"><AAIcon.Sparkle s={15} c="#fff"/></span>
          <div>
            <h2>{title}</h2>
            <p>{sub}</p>
          </div>
        </div>
        <div className="aa-head__chrome">
          <AAMenu onNewChat={onNewChat} chats={chats} onPickChat={onPickChat}/>
          <button className="aa-iconbtn aa-iconbtn--close" onClick={onClose} aria-label="Close"><AAIcon.X/></button>
        </div>
      </div>
    </header>
  );
}

// ─── Default screen ─────────────────────────────────────────────────────
function ScreenDefault({ onPickSuggestion, onPickQuickAsk }) {
  return (
    <div className="aa-body">
      <div className="aa-greet">
        <p className="aa-greet__hello">Hi Maya 👋</p>
        <h3 className="aa-greet__head">What would you like to do?</h3>
        <p className="aa-greet__sub">
          Describe a task in plain words, or pick a suggestion. I'll handle the
          setup and confirm with you before anything goes live.
        </p>
      </div>

      <section className="aa-sect">
        <p className="aa-sect__lbl">Suggested actions</p>
        <div className="aa-actions">
          {SUGGESTED.map((s) => (
            <button key={s.id} type="button" className="aa-action" onClick={() => onPickSuggestion(s.id, s.title)}>
              <span className="aa-action__icon"><s.icon s={16}/></span>
              <span className="aa-action__body">
                <span className="aa-action__title">{s.title}</span>
                <span className="aa-action__sub">{s.body}</span>
              </span>
              <span className="aa-action__chev"><AAIcon.Arrow/></span>
            </button>
          ))}
        </div>
      </section>

      <section className="aa-sect">
        <p className="aa-sect__lbl">Quick asks</p>
        <div className="aa-chips">
          {QUICK_ASKS.map((q) => (
            <button key={q} className="aa-chip" onClick={() => onPickQuickAsk(q)}>
              <AAIcon.Sparkle s={11} c="#007DF9"/>
              <span>{q}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="aa-sect">
        <div className="aa-recent">
          <div className="aa-recent__row">
            <span className="aa-recent__dot"/>
            <span className="aa-recent__title">Generated weekly report for Natural History</span>
            <span className="aa-recent__time">2h ago</span>
          </div>
          <div className="aa-recent__row">
            <span className="aa-recent__dot aa-recent__dot--warn"/>
            <span className="aa-recent__title">Flagged 3 idle TapPoints in Dinosaur Hall</span>
            <span className="aa-recent__time">Yesterday</span>
          </div>
          <div className="aa-recent__row">
            <span className="aa-recent__dot aa-recent__dot--ok"/>
            <span className="aa-recent__title">Published Mary Anning experience to 2 spaces</span>
            <span className="aa-recent__time">May 21</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── TapPoint picker (multi-select with filter chips) ──────────────────
const TP_FILTERS = [
  { id: "needs",   label: "Needs setup",  match: (t) => t.status !== "Active" || !t.experienceId },
  { id: "inactive",label: "Inactive",     match: (t) => t.status !== "Active" },
  { id: "unassigned", label: "Unassigned",match: (t) => !t.experienceId },
  { id: "all",     label: "All",          match: () => true },
];

function statusPill(t) {
  if (t.status !== "Active") return { cls: "aa-pill aa-pill--inactive", text: "Inactive" };
  if (!t.experienceId)       return { cls: "aa-pill aa-pill--warn",     text: "Unassigned" };
  return { cls: "aa-pill aa-pill--ok", text: "Active" };
}

function TappointPicker({ selectedIds, onChange, onContinue }) {
  const [filter, setFilter] = useStateAA("needs");
  const [tagFilter, setTagFilter] = useStateAA(null);
  const [search, setSearch] = useStateAA("");
  const tps = (window.DATA?.TAPPOINTS) || [];
  const spaces = (window.DATA?.SPACES) || [];
  const exps = (window.DATA?.EXPERIENCES) || [];

  // Tag pool drawn from anything matching the active status filter, so the
  // tag chips reflect what's actually pickable in the current scope.
  const baseList = useMemoAA(() => {
    const f = TP_FILTERS.find((x) => x.id === filter);
    return tps.filter((t) => f.match(t));
  }, [tps, filter]);

  const tagPool = useMemoAA(() => {
    const counts = {};
    baseList.forEach((t) => (t.tags || []).forEach((tag) => { counts[tag] = (counts[tag] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [baseList]);

  const list = useMemoAA(() => {
    const lowerSearch = search.toLowerCase().trim();
    return baseList.filter((t) => {
      if (tagFilter && !(t.tags || []).includes(tagFilter)) return false;
      if (lowerSearch && !(t.name + " " + t.xuid + " " + (t.tags || []).join(" ")).toLowerCase().includes(lowerSearch)) return false;
      return true;
    });
  }, [baseList, tagFilter, search]);

  const allVisibleSelected = list.length > 0 && list.every((t) => selectedIds.includes(t.id));
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      onChange(selectedIds.filter((id) => !list.find((t) => t.id === id)));
    } else {
      const merged = [...new Set([...selectedIds, ...list.map((t) => t.id)])];
      onChange(merged);
    }
  };
  const toggle = (id) => {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]);
  };

  // Auto-derived space label: if all selected share one space, show it.
  const spaceLabel = useMemoAA(() => {
    if (!selectedIds.length) return null;
    const picked = tps.filter((t) => selectedIds.includes(t.id));
    const uniqueSpaces = [...new Set(picked.map((t) => t.spaceId))];
    if (uniqueSpaces.length === 1) {
      const sp = spaces.find((s) => s.id === uniqueSpaces[0]);
      return sp?.name || uniqueSpaces[0];
    }
    return `${uniqueSpaces.length} spaces`;
  }, [selectedIds, tps, spaces]);

  return (
    <div className="aa-picker">
      <div className="aa-picker__filterbar">
        <div className="aa-picker__filters" role="tablist">
          {TP_FILTERS.map((f) => (
            <button key={f.id} className={"aa-picker__filter" + (filter === f.id ? " is-on" : "")}
                    onClick={() => { setFilter(f.id); setTagFilter(null); }}>
              {f.label}
              <span className="aa-picker__filtercount">{tps.filter(f.match).length}</span>
            </button>
          ))}
        </div>
        <div className="aa-picker__search">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <input placeholder="Search name, ID or tag…" value={search}
                 onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {tagPool.length > 0 && (
        <div className="aa-picker__tags">
          <span className="aa-picker__tagslbl">Filter by tag:</span>
          <button className={"aa-picker__tag" + (!tagFilter ? " is-on" : "")} onClick={() => setTagFilter(null)}>any</button>
          {tagPool.map(([tag, n]) => (
            <button key={tag} className={"aa-picker__tag" + (tagFilter === tag ? " is-on" : "")}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}>
              {tag} <span className="aa-picker__tagcount">{n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="aa-picker__head">
        <button className="aa-picker__selectall" onClick={toggleAllVisible} disabled={list.length === 0}>
          <span className={"aa-check" + (allVisibleSelected ? " is-on" : "")}>
            {allVisibleSelected && <AAIcon.Check s={10}/>}
          </span>
          {allVisibleSelected ? "Clear visible" : `Select all ${list.length}`}
        </button>
        <span className="aa-picker__count">{selectedIds.length} selected</span>
      </div>

      <ul className="aa-picker__list">
        {list.length === 0 && (
          <li className="aa-picker__empty">No TapPoints match this filter.</li>
        )}
        {list.map((t) => {
          const checked = selectedIds.includes(t.id);
          const sp = spaces.find((s) => s.id === t.spaceId);
          const ex = exps.find((e) => e.id === t.experienceId);
          const pill = statusPill(t);
          return (
            <li key={t.id} className={"aa-picker__row" + (checked ? " is-on" : "")}
                onClick={() => toggle(t.id)}>
              <span className={"aa-check" + (checked ? " is-on" : "")}>
                {checked && <AAIcon.Check s={10}/>}
              </span>
              <div className="aa-picker__main">
                <div className="aa-picker__row1">
                  <span className="aa-picker__name">{t.name}</span>
                  <span className={pill.cls}>{pill.text}</span>
                </div>
                <div className="aa-picker__row2">
                  <span className="aa-picker__xuid">{t.xuid}</span>
                  <span className="aa-picker__dot">·</span>
                  <span>{sp?.short || sp?.name || "—"}</span>
                  {ex && (<><span className="aa-picker__dot">·</span><span>→ {ex.name}</span></>)}
                </div>
                {(t.tags && t.tags.length > 0) && (
                  <div className="aa-picker__tagrow">
                    {t.tags.slice(0, 4).map((tg) => <span key={tg} className="aa-picker__minitag">{tg}</span>)}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="aa-picker__foot">
        {spaceLabel && selectedIds.length > 0 && (
          <span className="aa-picker__hint">
            <AAIcon.Space s={11}/> {spaceLabel}
          </span>
        )}
        <button className="aa-fbtn aa-fbtn--primary aa-picker__continue"
                disabled={selectedIds.length === 0} onClick={onContinue}>
          Continue with {selectedIds.length} TapPoint{selectedIds.length === 1 ? "" : "s"}
          <AAIcon.Arrow s={12}/>
        </button>
      </div>
    </div>
  );
}

// ─── Experience-or-template chooser ─────────────────────────────────────
// Step 2 of setup-tappoints: pick an existing experience OR create a new
// one from a template. Stored as `targetRef` = "exp:<id>" | "tpl:<id>".
function ExperienceOrTemplateChooser({ scopeSpaceId, onChoose }) {
  const exps = (window.DATA?.EXPERIENCES) || [];
  const scopedExps = scopeSpaceId
    ? exps.filter((e) => e.spaceId === scopeSpaceId)
    : exps.slice(0, 6);
  return (
    <div className="aa-chooser">
      <div className="aa-chooser__col">
        <p className="aa-chooser__lbl">Use an existing experience</p>
        <div className="aa-chooser__chips">
          {scopedExps.length === 0 && <p className="aa-chooser__empty">No experiences in this space yet.</p>}
          {scopedExps.map((e) => (
            <button key={e.id} className="aa-chooser__chip"
                    onClick={() => onChoose("exp:" + e.id, e.name)}>
              <span className="aa-chooser__chiphead">{e.name}</span>
              <span className="aa-chooser__chipsub">{e.type} · {e.taps} taps</span>
            </button>
          ))}
        </div>
      </div>
      <div className="aa-chooser__divider"><span>or</span></div>
      <div className="aa-chooser__col">
        <p className="aa-chooser__lbl">Create from template</p>
        <div className="aa-chooser__chips">
          {TEMPLATES.map((t) => (
            <button key={t.id} className="aa-chooser__chip"
                    onClick={() => onChoose("tpl:" + t.id, t.name + " (new)")}>
              <span className="aa-chooser__chiphead">{t.name}</span>
              <span className="aa-chooser__chipsub">{t.type} · {t.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
function ScreenWorkflow({ session, onAnswer, onEditSlot, threadRef, dispatch }) {
  const steps = flowSteps(session.flow);
  const stepLabels = (() => {
    if (session.flow === "setup-tappoints")   return ["TapPoints", "Experience", "Publish"];
    if (session.flow === "create-experience") return ["Space", "Template", "Name", "Publish"];
    return steps.map((s) => s.slot);
  })();
  const stepCount = Math.max(stepLabels.length, 1);
  const doneCount = session.stepIdx;
  const progressPct = Math.round(((doneCount + 0.4) / stepCount) * 100);
  const currentStep = steps[session.stepIdx];
  const tps = (window.DATA?.TAPPOINTS) || [];

  // Confirmed-so-far summary rows — derived from current answers.
  const confirmed = useMemoAA(() => {
    const rows = [];
    const a = session.answers;
    if (a.tappointIds && a.tappointIds.length) {
      const picked = tps.filter((t) => a.tappointIds.includes(t.id));
      const uniqueSpaces = [...new Set(picked.map((t) => t.spaceId))];
      const spaces = (window.DATA?.SPACES) || [];
      const sp = uniqueSpaces.length === 1 ? spaces.find((s) => s.id === uniqueSpaces[0]) : null;
      rows.push({
        slot: "tappointIds", label: "TapPoints", icon: AAIcon.Tap,
        value: `${picked.length} device${picked.length === 1 ? "" : "s"}${sp ? ` · ${sp.name?.split(",")[0]}` : ` · ${uniqueSpaces.length} spaces`}`,
      });
    }
    if (a.spaceLabel || a.spaceId) {
      const spaces = (window.DATA?.SPACES) || [];
      const sp = spaces.find((s) => s.id === a.spaceId);
      rows.push({ slot: "spaceId", label: "Space", value: a.spaceLabel || sp?.name || a.spaceId, icon: AAIcon.Space });
    }
    if (a.targetRef) {
      const [kind, id] = a.targetRef.split(":");
      if (kind === "tpl") {
        const tpl = TEMPLATES.find((t) => t.id === id);
        rows.push({ slot: "targetRef", label: "Experience", icon: AAIcon.Doc,
          value: tpl ? `New from "${tpl.name}" template · ${tpl.type}` : a.targetRef });
      } else if (kind === "exp") {
        const ex = ((window.DATA?.EXPERIENCES) || []).find((e) => e.id === id);
        rows.push({ slot: "targetRef", label: "Experience", icon: AAIcon.Layout,
          value: ex ? `${ex.name} (existing)` : a.targetRef });
      }
    }
    if (a.templateId && !a.targetRef) {
      const tpl = TEMPLATES.find((t) => t.id === a.templateId);
      rows.push({ slot: "templateId", label: "Template", value: tpl ? `${tpl.name} · ${tpl.type} layout` : a.templateId, icon: AAIcon.Doc });
    }
    if (a.name) {
      rows.push({ slot: "name", label: "Name", value: a.name, icon: AAIcon.Layout });
    }
    if (a.experienceId) {
      const exps = (window.DATA?.EXPERIENCES) || [];
      const ex = exps.find((e) => e.id === a.experienceId);
      rows.push({ slot: "experienceId", label: "Experience", value: ex?.name || a.experienceId, icon: AAIcon.Layout });
    }
    return rows;
  }, [session.answers]);

  // Auto-scope the experience/template chooser to the space of the picked
  // TapPoints so we don't offer experiences from a different museum.
  const scopeSpaceId = useMemoAA(() => {
    if (!session.answers.tappointIds) return null;
    const picked = tps.filter((t) => session.answers.tappointIds.includes(t.id));
    const u = [...new Set(picked.map((t) => t.spaceId))];
    return u.length === 1 ? u[0] : null;
  }, [session.answers.tappointIds]);

  // Render a dedicated picker/chooser surface above the conversation when
  // the active step's kind needs more than a chat-bubble can hold.
  const renderActiveSurface = () => {
    if (!currentStep || session.status !== "asking") return null;
    if (currentStep.kind === "tappoints-multi") {
      const sel = session.answers.tappointIds || [];
      return (
        <TappointPicker
          selectedIds={sel}
          onChange={(ids) => dispatch({ type: "PATCH_ANSWERS", patch: { tappointIds: ids } })}
          onContinue={() => onAnswer("tappointIds", sel, `${sel.length} TapPoint${sel.length === 1 ? "" : "s"} selected`, true)}
        />
      );
    }
    if (currentStep.kind === "experience-or-template") {
      return (
        <ExperienceOrTemplateChooser
          scopeSpaceId={scopeSpaceId}
          onChoose={(ref, label) => onAnswer("targetRef", ref, label, true)}
        />
      );
    }
    return null;
  };
  const activeSurface = renderActiveSurface();

  return (
    <div className="aa-body">
      <div className="aa-progress">
        <div className="aa-progress__steps">
          {stepLabels.map((s, i) => {
            const status = i < doneCount ? "done" : i === doneCount ? "active" : "pending";
            return (
              <div key={s} className={"aa-progress__step aa-progress__step--" + status}>
                <span className="aa-progress__dot">
                  {status === "done" ? <AAIcon.Check s={10}/> : i + 1}
                </span>
                <span className="aa-progress__label">{s}</span>
              </div>
            );
          })}
        </div>
        <div className="aa-progress__bar"><span style={{ width: progressPct + "%" }}/></div>
      </div>

      {confirmed.length > 0 && (
        <section className="aa-sect">
          <p className="aa-sect__lbl">Confirmed so far</p>
          <div className="aa-summary">
            {confirmed.map((row) => (
              <div key={row.slot} className="aa-summary__row">
                <span className="aa-summary__icon"><row.icon s={14}/></span>
                <div className="aa-summary__main">
                  <span className="aa-summary__label">{row.label}</span>
                  <span className="aa-summary__value">{row.value}</span>
                </div>
                <button className="aa-summary__edit" aria-label={`Edit ${row.label}`} onClick={() => onEditSlot(row.slot)}>
                  <AAIcon.Pencil s={11}/>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSurface && (
        <section className="aa-sect">
          <p className="aa-sect__lbl">
            {currentStep.kind === "tappoints-multi" ? "Pick TapPoints" : "Pick the target"}
          </p>
          <p className="aa-prompt-line">{currentStep.ask}</p>
          {activeSurface}
        </section>
      )}

      <section className="aa-sect">
        <p className="aa-sect__lbl">Conversation</p>
        <div className="aa-thread" ref={threadRef}>
          {session.messages.map((m, i) => {
            const isQuestion = m.kind === "question";
            const isLast = i === session.messages.length - 1;
            const isActiveQuestion = isQuestion && isLast && session.status === "asking";
            const surfaceHandledHere = isActiveQuestion && activeSurface;
            return (
              <div key={i} className={"aa-msg aa-msg--" + m.from + (isActiveQuestion && !surfaceHandledHere ? " aa-msg--active" : "")}>
                {m.from === "ai" && <span className="aa-msg__avatar"><AAIcon.Sparkle s={10} c="#fff"/></span>}
                {isActiveQuestion && !surfaceHandledHere
                  ? <ActiveQuestion session={session} onAnswer={onAnswer}/>
                  : <span className="aa-msg__bubble">{surfaceHandledHere ? "See the picker above ↑" : m.text}</span>
                }
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// Rendered as the last bubble in the thread when the AI is waiting on an
// answer. Shows the question + a set of contextual choices.
function ActiveQuestion({ session, onAnswer }) {
  const step = flowSteps(session.flow)[session.stepIdx];
  if (!step) return null;
  const spaces = (window.DATA?.SPACES) || [];
  const exps = (window.DATA?.EXPERIENCES) || [];

  let chips = [];
  if (step.kind === "space") {
    chips = spaces.slice(0, 6).map((s) => ({
      value: s.id, label: s.name, onPick: () => onAnswer(step.slot, s.id, s.name, true),
    }));
  } else if (step.kind === "template") {
    chips = TEMPLATES.map((t) => ({
      value: t.id, label: t.name + " · " + t.type, onPick: () => onAnswer(step.slot, t.id, t.name, true),
    }));
  } else if (step.kind === "experience") {
    chips = exps.slice(0, 6).map((e) => ({
      value: e.id, label: e.name, onPick: () => onAnswer(step.slot, e.id, e.name, true),
    }));
  } else if (step.kind === "choice") {
    chips = step.options.map((o) => ({
      value: o.value, label: o.label, primary: o.primary,
      onPick: () => onAnswer(step.slot, o.value, o.label, true),
    }));
  } else if (step.kind === "number" && step.suggest) {
    chips = step.suggest.map((n) => ({
      value: n, label: n, onPick: () => onAnswer(step.slot, parseInt(n, 10), n, true),
    }));
  } else if (step.suggest) {
    chips = step.suggest.map((n) => ({
      value: n, label: n, onPick: () => onAnswer(step.slot, n, n, true),
    }));
  }

  return (
    <div className="aa-msg__bubble aa-msg__bubble--prompt">
      <p>{step.ask}</p>
      {chips.length > 0 && (
        <div className="aa-msg__choices">
          {chips.map((c) => (
            <button
              key={c.value}
              className={"aa-msg__choice" + (c.primary ? " aa-msg__choice--primary" : "")}
              onClick={c.onPick}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <p className="aa-msg__hint">…or type your answer in the box below.</p>
    </div>
  );
}

// ─── Preview screen ─────────────────────────────────────────────────────
function buildPlan(session) {
  const a = session.answers;
  const allSpaces = (window.DATA?.SPACES) || [];
  const allTps = (window.DATA?.TAPPOINTS) || [];
  const allExps = (window.DATA?.EXPERIENCES) || [];

  // ── setup-tappoints: configure existing (pre-loaded) TapPoints ───
  if (session.flow === "setup-tappoints") {
    const selected = allTps.filter((t) => (a.tappointIds || []).includes(t.id));
    const uniqueSpaceIds = [...new Set(selected.map((t) => t.spaceId))];
    const space = uniqueSpaceIds.length === 1 ? allSpaces.find((s) => s.id === uniqueSpaceIds[0]) : null;

    // Determine target experience: existing or new from template
    let target = null, newExperience = null;
    if (a.targetRef && a.targetRef.startsWith("exp:")) {
      target = allExps.find((e) => e.id === a.targetRef.slice(4)) || null;
    } else if (a.targetRef && a.targetRef.startsWith("tpl:")) {
      const tpl = TEMPLATES.find((t) => t.id === a.targetRef.slice(4));
      if (tpl) {
        newExperience = {
          id: `exp-${Date.now().toString(36)}`,
          name: `${space?.name?.split(",")[0] || "New"} · ${tpl.name}`,
          type: tpl.type, spaceId: space?.id || uniqueSpaceIds[0],
          taps: 0, visitors: 0, leads: 0, updated: "just now",
          delta: 0, tags: ["new", "from-template"], templateId: tpl.id,
        };
        target = newExperience;
      }
    }
    return {
      kind: "setup-tappoints",
      space, selected, target, newExperience,
      status: a.status || "publish",
      multiSpace: uniqueSpaceIds.length > 1,
    };
  }

  // ── create-experience: only produce an experience ───
  if (session.flow === "create-experience") {
    const space = allSpaces.find((s) => s.id === a.spaceId);
    const tpl = TEMPLATES.find((t) => t.id === a.templateId);
    const newExperience = tpl ? {
      id: `exp-${Date.now().toString(36)}`,
      name: a.name || `${space?.name?.split(",")[0] || "New"} · ${tpl.name}`,
      type: tpl.type, spaceId: a.spaceId,
      taps: 0, visitors: 0, leads: 0, updated: "just now",
      delta: 0, tags: ["new", "from-template"], templateId: tpl.id,
    } : null;
    return { kind: "create-experience", space, selected: [], target: newExperience, newExperience,
             status: a.status || "publish", multiSpace: false };
  }
  return { kind: session.flow || "noop", space: null, selected: [], target: null, newExperience: null, status: "publish", multiSpace: false };
}

function ScreenPreview({ session, onApply, onBackToWorkflow, onCancel, onSaveDraft }) {
  const plan = useMemoAA(() => buildPlan(session), [session.answers, session.flow]);
  const { space, selected, target, newExperience, status, multiSpace } = plan;

  const summaryRows = [
    { label: "Space",       icon: AAIcon.Space, value: multiSpace ? "Multiple spaces" : (space?.name || "—") },
    { label: "Experience",  icon: AAIcon.Doc,
      value: newExperience
        ? `New · ${newExperience.name} (${newExperience.type})`
        : (target ? `${target.name} (existing)` : "—")
    },
    { label: "Status",      icon: AAIcon.Bolt,  value: status === "publish" ? "Published immediately" : "Saved as draft" },
  ];

  const allExps = (window.DATA?.EXPERIENCES) || [];
  const allTps  = (window.DATA?.TAPPOINTS) || [];
  const expByPlan = newExperience || target;
  const existingInSpaceTps  = space ? allTps.filter((t)  => t.spaceId === space.id).length : 0;
  const existingInSpaceExps = space ? allExps.filter((e) => e.spaceId === space.id).length : 0;
  const reassignCount = selected.filter((t) => t.experienceId && t.experienceId !== expByPlan?.id).length;

  return (
    <div className="aa-body">
      <div className="aa-banner">
        <span className="aa-banner__icon"><AAIcon.Sparkle s={14} c="#0066cc"/></span>
        <div>
          <p className="aa-banner__title">Ready to apply {selected.length + (newExperience ? 1 : 0)} changes</p>
          <p className="aa-banner__sub">Nothing has been saved yet. Review below and pick how to proceed.</p>
        </div>
      </div>

      <section className="aa-sect">
        <p className="aa-sect__lbl">Plan</p>
        <div className="aa-summary aa-summary--tight">
          {summaryRows.map((row) => (
            <div key={row.label} className="aa-summary__row">
              <span className="aa-summary__icon"><row.icon s={14}/></span>
              <div className="aa-summary__main">
                <span className="aa-summary__label">{row.label}</span>
                <span className="aa-summary__value">{row.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected.length > 0 && (
        <section className="aa-sect">
          <div className="aa-sect__head">
            <p className="aa-sect__lbl">TapPoints to configure · {selected.length}</p>
            <button className="aa-linkbtn" onClick={onBackToWorkflow}>Edit list</button>
          </div>
          <ul className="aa-tplist">
            {selected.map((t) => (
              <li key={t.id} className="aa-tplist__row">
                <span className="aa-tplist__check"><AAIcon.Check s={10}/></span>
                <span className="aa-tplist__name">{t.name}</span>
                <span className="aa-tplist__xuid">{t.xuid}</span>
                <span className="aa-tplist__exp">→ {expByPlan?.name || "—"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {newExperience && (
        <section className="aa-sect">
          <p className="aa-sect__lbl">Experience to be created</p>
          <ul className="aa-newlist">
            <li className="aa-newlist__row">
              <span className="aa-newlist__plus"><AAIcon.Plus s={10}/></span>
              <span>{newExperience.name} ({newExperience.type})</span>
            </li>
            {reassignCount > 0 && (
              <li className="aa-newlist__row aa-newlist__row--muted">
                <span className="aa-newlist__plus aa-newlist__plus--neutral"><AAIcon.Refresh s={10}/></span>
                <span>{reassignCount} TapPoint{reassignCount === 1 ? "" : "s"} will be reassigned (no tap history lost)</span>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="aa-sect aa-sect--diff">
        <p className="aa-sect__lbl">What changes after apply</p>
        <div className="aa-diff">
          <div className="aa-diff__col aa-diff__col--before">
            <span className="aa-diff__lbl">Before</span>
            <p className="aa-diff__line">{selected.filter((t) => t.status !== "Active").length} of {selected.length} selected are Inactive</p>
            <p className="aa-diff__line">{selected.filter((t) => !t.experienceId).length} unassigned · {existingInSpaceExps} experience{existingInSpaceExps === 1 ? "" : "s"} in scope</p>
          </div>
          <span className="aa-diff__arrow"><AAIcon.Arrow s={14}/></span>
          <div className="aa-diff__col aa-diff__col--after">
            <span className="aa-diff__lbl">After</span>
            <p className="aa-diff__line">{selected.length} {status === "publish" ? "Active" : "drafts saved"}, all routed to one experience</p>
            <p className="aa-diff__line">{existingInSpaceExps + (newExperience ? 1 : 0)} experience{(existingInSpaceExps + (newExperience ? 1 : 0)) === 1 ? "" : "s"}{newExperience ? " (1 new)" : ""}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Applying / Done screens ────────────────────────────────────────────
function ScreenApplying() {
  return (
    <div className="aa-body aa-body--center">
      <div className="aa-applying">
        <div className="aa-applying__spin"/>
        <p className="aa-applying__head">Applying changes</p>
        <p className="aa-applying__sub">Provisioning TapPoints, publishing experience, updating spaces…</p>
      </div>
    </div>
  );
}

function ScreenDone({ summary, onNewSession, onNav, onClose }) {
  return (
    <div className="aa-body">
      <div className="aa-done">
        <span className="aa-done__icon"><AAIcon.Check s={20}/></span>
        <h3 className="aa-done__head">All set</h3>
        <p className="aa-done__sub">{summary}</p>
      </div>
      <section className="aa-sect">
        <p className="aa-sect__lbl">What's next</p>
        <div className="aa-actions aa-actions--single">
          <button className="aa-action" onClick={() => { onNav?.("tappoints"); onClose?.(); }}>
            <span className="aa-action__icon"><AAIcon.Tap s={16}/></span>
            <span className="aa-action__body">
              <span className="aa-action__title">Open TapPoints</span>
              <span className="aa-action__sub">See your newly-active devices in the list.</span>
            </span>
            <span className="aa-action__chev"><AAIcon.Arrow/></span>
          </button>
          <button className="aa-action" onClick={() => { onNav?.("experiences"); onClose?.(); }}>
            <span className="aa-action__icon"><AAIcon.Layout s={16}/></span>
            <span className="aa-action__body">
              <span className="aa-action__title">View experience</span>
              <span className="aa-action__sub">Customize copy, layout, and CTAs.</span>
            </span>
            <span className="aa-action__chev"><AAIcon.Arrow/></span>
          </button>
          <button className="aa-action" onClick={onNewSession}>
            <span className="aa-action__icon"><AAIcon.Sparkle s={16}/></span>
            <span className="aa-action__body">
              <span className="aa-action__title">Start something new</span>
              <span className="aa-action__sub">Run another task with TapIn AI.</span>
            </span>
            <span className="aa-action__chev"><AAIcon.Arrow/></span>
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Analytics screen (free-text Q&A + scoped analyze/improve) ──────────
function ScreenAnalytics({ session, onAskAnother, onNav }) {
  const a = session.analytics || {};
  const q = a.question || (session.flow === "analyze-space" ? `Summarize ${flowTitle(session.flow)}` : "");
  const answer = a.answer;
  const loading = a.loading;

  // Computed-locally summary for analyze/improve flows (no Claude call needed)
  const localSummary = useMemoAA(() => {
    if (session.flow === "analyze-space" && session.answers.spaceId) {
      const sp = (window.DATA?.SPACES || []).find((s) => s.id === session.answers.spaceId);
      const exps = (window.DATA?.EXPERIENCES || []).filter((e) => e.spaceId === session.answers.spaceId);
      const tps = (window.DATA?.TAPPOINTS || []).filter((t) => t.spaceId === session.answers.spaceId);
      const top = [...exps].sort((a, b) => (b.taps || 0) - (a.taps || 0))[0];
      const worst = [...exps].sort((a, b) => (a.delta || 0) - (b.delta || 0))[0];
      if (!sp) return null;
      return [
        { kind: "headline", text: `${sp.name} has ${sp.taps?.toLocaleString() || 0} taps across ${exps.length} experience${exps.length === 1 ? "" : "s"} and ${tps.length} device${tps.length === 1 ? "" : "s"}.` },
        top && { kind: "good", text: `Top performer: ${top.name} (${top.taps || 0} taps${top.delta ? `, ${top.delta > 0 ? "+" : ""}${top.delta}%` : ""}).` },
        worst && worst !== top && (worst.delta || 0) < 0 && { kind: "warn", text: `Watch: ${worst.name} is down ${Math.abs(worst.delta)}% — likely needs a content refresh.` },
        tps.filter((t) => t.status !== "Active").length > 0 && { kind: "warn", text: `${tps.filter((t) => t.status !== "Active").length} device${tps.filter((t) => t.status !== "Active").length === 1 ? " is" : "s are"} not Active.` },
      ].filter(Boolean);
    }
    if (session.flow === "improve-experience" && session.answers.experienceId) {
      const ex = (window.DATA?.EXPERIENCES || []).find((e) => e.id === session.answers.experienceId);
      if (!ex) return null;
      const conv = ex.taps ? ((ex.leads || 0) / ex.taps * 100) : 0;
      return [
        { kind: "headline", text: `${ex.name} pulled ${ex.taps} taps with ${conv.toFixed(1)}% lead conversion.` },
        conv < 12 && { kind: "warn", text: `Lead conversion is low — try a one-field email capture above the fold.` },
        (ex.delta || 0) < 0 && { kind: "warn", text: `Down ${Math.abs(ex.delta)}% vs last period — refresh the hero copy/image.` },
        (ex.delta || 0) >= 0 && { kind: "good", text: `Trend is healthy. Consider cloning to another space to compound the lift.` },
        { kind: "neutral", text: `Add tags ("entry", "promo") so it shows up in cohort reports.` },
      ].filter(Boolean);
    }
    return null;
  }, [session.flow, session.answers]);

  return (
    <div className="aa-body">
      {q && (
        <div className="aa-q">
          <span className="aa-q__lbl">Your question</span>
          <p className="aa-q__text">{q}</p>
        </div>
      )}

      {loading && (
        <div className="aa-thinking">
          <span className="aa-thinking__orb"><AAIcon.Sparkle s={12} c="#fff"/></span>
          <span>Thinking<span className="aa-thinking__dots"><i/><i/><i/></span></span>
        </div>
      )}

      {answer && (
        <div className="aa-answer">
          <p className="aa-answer__lbl"><AAIcon.Sparkle s={11} c="#007DF9"/> Answer</p>
          <p className="aa-answer__text">{answer}</p>
        </div>
      )}

      {localSummary && (
        <section className="aa-sect">
          <p className="aa-sect__lbl">{session.flow === "analyze-space" ? "Snapshot" : "What I'd improve first"}</p>
          <ul className="aa-bullets">
            {localSummary.map((b, i) => (
              <li key={i} className={"aa-bullet aa-bullet--" + (b.kind || "neutral")}>
                <span className="aa-bullet__dot"/>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="aa-sect">
        <p className="aa-sect__lbl">Try another question</p>
        <div className="aa-chips">
          {QUICK_ASKS.map((q) => (
            <button key={q} className="aa-chip" onClick={() => onAskAnother(q)}>
              <AAIcon.Sparkle s={11} c="#007DF9"/>
              <span>{q}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────
function AAFooter({ session, onPromptSubmit, onCancel, onApply, onEdit, onSaveDraft, onNewSession, onClose }) {
  const [q, setQ] = useStateAA("");
  const send = () => {
    const text = q.trim();
    if (!text) return;
    onPromptSubmit(text);
    setQ("");
  };

  // Preview-state footer: confirm bar
  if (session.status === "preview") {
    return (
      <footer className="aa-foot aa-foot--actions">
        <div className="aa-foot__row aa-foot__row--secondary">
          <button className="aa-fbtn aa-fbtn--ghost" onClick={onCancel}>Cancel</button>
          <button className="aa-fbtn aa-fbtn--ghost" onClick={onEdit}>Edit selections</button>
          <button className="aa-fbtn aa-fbtn--ghost" onClick={onSaveDraft}>Save as draft</button>
        </div>
        <button className="aa-fbtn aa-fbtn--primary" onClick={onApply}>
          <AAIcon.Check s={14}/> Confirm &amp; apply
        </button>
      </footer>
    );
  }

  // Applying — disable everything
  if (session.status === "applying") {
    return (
      <footer className="aa-foot aa-foot--actions">
        <button className="aa-fbtn aa-fbtn--primary" disabled>
          <span className="aa-fbtn__spin"/> Applying…
        </button>
      </footer>
    );
  }

  // Done — close shortcut
  if (session.status === "done") {
    return (
      <footer className="aa-foot aa-foot--actions">
        <div className="aa-foot__row aa-foot__row--secondary">
          <button className="aa-fbtn aa-fbtn--ghost" onClick={onNewSession}>Start something new</button>
        </div>
        <button className="aa-fbtn aa-fbtn--primary" onClick={onClose}>Close</button>
      </footer>
    );
  }

  const placeholder = session.status === "asking"
    ? "Type your answer, or ask something else…"
    : session.status === "analytics"
      ? "Ask another question…"
      : "Ask anything, or describe a task…";

  return (
    <footer className="aa-foot">
      <div className="aa-prompt">
        <span className="aa-prompt__mark"><AAIcon.Sparkle s={13} c="#007DF9"/></span>
        <input
          className="aa-prompt__input"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button className="aa-prompt__icon" aria-label="Voice input"><AAIcon.Mic/></button>
        <button className="aa-prompt__send" disabled={!q.trim()} onClick={send} aria-label="Send"><AAIcon.Send/></button>
      </div>
      <p className="aa-foot__hint">
        AI Agent confirms every action before applying. Powered by TapIn AI.
      </p>
    </footer>
  );
}

// ─── Main component ─────────────────────────────────────────────────────
function AIAgent({ state, onStateChange, onNav, onToast }) {
  const [open, setOpen] = useStateAA(false);
  const [session, dispatch] = useReducerAA(sessionReducer, initialSession);
  const [chats, setChats] = useStateAA(() => buildMockChats());
  const threadRef = useRefAA(null);

  // Open on ⌘K / Ctrl-K
  useEffectAA(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Auto-scroll thread to the bottom on new messages
  useEffectAA(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [session.messages.length, session.status]);

  // When the Tweaks "Preview state" select changes (external trigger),
  // seed the panel with the matching demo session so reviewers can still
  // jump straight to a representative workflow/preview without typing.
  const lastSeenStateRef = useRefAA(state);
  useEffectAA(() => {
    if (lastSeenStateRef.current === state) return;
    lastSeenStateRef.current = state;
    if (state === "workflow" || state === "preview") {
      dispatch({ type: "RESET", payload: demoSession(state) });
      setOpen(true);
    } else if (state === "default") {
      dispatch({ type: "RESET", payload: { ...initialSession } });
    }
  }, [state]);

  const close = () => setOpen(false);
  const reset = () => {
    dispatch({ type: "RESET", payload: { ...initialSession } });
    onStateChange?.("default");
  };
  const pickChat = (chat) => {
    if (chat?.seed) {
      dispatch({ type: "RESET", payload: chat.seed() });
      // Keep the Tweaks "Preview state" in sync if we landed on a known view
      if (chat.id === "chat-dh-preview")   onStateChange?.("preview");
      else if (chat.id === "chat-dh-workflow") onStateChange?.("workflow");
      else onStateChange?.("default");
    }
  };
  const onBack = () => {
    const t = backTargetFor(session);
    if (!t) return;
    if (t.kind === "to-asking") {
      dispatch({ type: "BACK_TO_QUESTIONING" });
      onStateChange?.("workflow");
    } else {
      reset();
    }
  };

  // Suggested action card → start the matching flow
  const onPickSuggestion = (flowId, label) => {
    dispatch({ type: "START_FLOW", flow: flowId, greeting: label });
    // Bring the demo-tab strip to match
    if (flowId === "setup-tappoints" || flowId === "create-experience") onStateChange?.("workflow");
    else onStateChange?.("default");
  };

  // Quick-ask chip → analytics flow
  const onPickQuickAsk = (q) => askAnalytics(q);

  // ── Prompt input handler ────────────────────────────────────────────
  const onPromptSubmit = (text) => {
    if (session.status === "asking") {
      // We're inside a workflow — parse the answer against the current slot
      const step = flowSteps(session.flow)[session.stepIdx];
      if (!step) return;
      let value = null, displayText = text;
      if (step.kind === "space") {
        const sp = findSpace(text);
        if (sp) { value = sp.id; displayText = sp.name; }
        else { onToast?.("Couldn't find that space — try another name"); return; }
      } else if (step.kind === "template") {
        const tpl = findTemplate(text);
        if (tpl) { value = tpl.id; displayText = tpl.name; }
        else { onToast?.("Couldn't match that template — try one of the chips"); return; }
      } else if (step.kind === "experience") {
        const ex = findExperience(text);
        if (ex) { value = ex.id; displayText = ex.name; }
        else { onToast?.("Couldn't find that experience"); return; }
      } else if (step.kind === "tappoints-multi") {
        onToast?.("Use the picker above to select TapPoints");
        return;
      } else if (step.kind === "experience-or-template") {
        // Allow free-text shortcut: try to match an existing experience first,
        // then fall back to template matching.
        const ex = findExperience(text);
        if (ex) { value = "exp:" + ex.id; displayText = ex.name + " (existing)"; }
        else {
          const tpl = findTemplate(text);
          if (tpl) { value = "tpl:" + tpl.id; displayText = tpl.name + " (new)"; }
          else { onToast?.("Couldn't match that — try a chip above"); return; }
        }
      } else if (step.kind === "number") {
        const n = parseNumber(text);
        if (n != null && n > 0) { value = n; displayText = String(n); }
        else { onToast?.("Please tell me a number (try 3, 6 or 12)"); return; }
      } else if (step.kind === "choice") {
        const opt = step.options.find((o) => text.toLowerCase().includes(o.value) || text.toLowerCase().includes(o.label.toLowerCase()));
        if (opt) { value = opt.value; displayText = opt.label; }
        else if (/publish|live|now/i.test(text)) { value = "publish"; displayText = "Publish"; }
        else if (/draft|later|save/i.test(text)) { value = "draft"; displayText = "Save as draft"; }
        else { onToast?.("Choose publish or save as draft"); return; }
      } else {
        value = text;
      }
      dispatch({ type: "ANSWER", slot: step.slot, value, displayText, advance: true });
      return;
    }
    // Free-text from idle / analytics — route by intent
    const intent = detectIntent(text);
    if (intent === "analytics") {
      askAnalytics(text);
    } else {
      dispatch({ type: "START_FLOW", flow: intent, greeting: text });
      if (intent === "setup-tappoints" || intent === "create-experience") onStateChange?.("workflow");
    }
  };

  // ── Analytics (Claude) ───────────────────────────────────────────────
  const askAnalytics = async (question) => {
    dispatch({ type: "ANALYTICS_LOADING", question });
    onStateChange?.("default");
    try {
      const exps = (window.DATA?.EXPERIENCES || []);
      const spaces = (window.DATA?.SPACES || []);
      const tps = (window.DATA?.TAPPOINTS || []);
      const top = [...exps].sort((a, b) => (b.taps || 0) - (a.taps || 0))[0];
      const worst = [...exps].sort((a, b) => (a.delta || 0) - (b.delta || 0))[0];
      const idleCount = tps.filter((t) => t.status !== "Active").length;
      const prompt = `You are an analytics assistant for a TapIn admin dashboard (NFC TapPoints that drive engagement experiences). Be specific, concise, and reference only the data given. Reply in 2-4 short sentences. Do not greet.

Org stats: ${spaces.length} spaces, ${exps.length} experiences, ${tps.length} TapPoints (${idleCount} not Active).
Top experience: ${top ? `${top.name} — ${top.taps} taps, ${top.delta >= 0 ? "+" : ""}${top.delta}% vs prev` : "n/a"}.
Worst mover: ${worst ? `${worst.name} — ${worst.taps} taps, ${worst.delta >= 0 ? "+" : ""}${worst.delta}%` : "n/a"}.

Admin question: ${question}`;
      let resp = "";
      if (window.claude && window.claude.complete) {
        resp = await window.claude.complete(prompt);
      } else {
        await new Promise((r) => setTimeout(r, 900));
        resp = top
          ? `Based on the current data, the biggest signal is ${top.name} (${top.taps} taps${top.delta >= 0 ? `, up ${top.delta}%` : ""}). ${worst && (worst.delta || 0) < 0 ? `${worst.name} is down ${Math.abs(worst.delta)}% — that's where I'd focus first.` : "Mid-week traffic is your strongest window."}`
          : "Not enough data yet — once you have a few experiences live I'll be able to spot patterns.";
      }
      dispatch({ type: "ANALYTICS_RESULT", answer: resp });
    } catch (e) {
      dispatch({ type: "ANALYTICS_RESULT", answer: "Sorry — I couldn't generate an answer just now. Try again in a moment." });
    }
  };

  // ── Apply (mutates window.DATA) ──────────────────────────────────────
  const applyPlan = async () => {
    if (session.flow !== "setup-tappoints" && session.flow !== "create-experience") {
      dispatch({ type: "APPLY_DONE" });
      return;
    }
    dispatch({ type: "APPLY_START" });
    onStateChange?.("preview");
    await new Promise((r) => setTimeout(r, 900));

    const plan = buildPlan(session);
    if (!window.DATA) window.DATA = { SPACES: [], EXPERIENCES: [], TAPPOINTS: [] };

    // Add a new experience if planned
    if (plan.newExperience) {
      window.DATA.EXPERIENCES = [plan.newExperience, ...(window.DATA.EXPERIENCES || [])];
    }

    // Mutate selected existing TapPoints in place (setup-tappoints flow)
    if (plan.kind === "setup-tappoints" && plan.selected.length > 0) {
      const targetId = plan.target?.id;
      const newStatus = plan.status === "draft" ? "Inactive" : "Active";
      const idSet = new Set(plan.selected.map((t) => t.id));
      window.DATA.TAPPOINTS = (window.DATA.TAPPOINTS || []).map((t) => {
        if (!idSet.has(t.id)) return t;
        const cleanTags = (t.tags || []).filter((tg) => tg !== "needs-setup" && tg !== "new-stock");
        return {
          ...t,
          experienceId: targetId || t.experienceId,
          status: newStatus,
          updated: "just now",
          tags: cleanTags.length ? cleanTags : t.tags,
        };
      });
    }

    // Recompute the affected space's rollups
    if (plan.space) {
      const sp = window.DATA.SPACES.find((s) => s.id === plan.space.id);
      if (sp) {
        sp.experiences = (window.DATA.EXPERIENCES || []).filter((e) => e.spaceId === sp.id).length;
        sp.devices = (window.DATA.TAPPOINTS || []).filter((t) => t.spaceId === sp.id && t.status === "Active").length;
        sp.updated = "just now";
      }
    }

    if (typeof window.__tapinBumpData === "function") window.__tapinBumpData();

    const summary = plan.kind === "setup-tappoints"
      ? (plan.status === "publish"
          ? `${plan.selected.length} TapPoint${plan.selected.length === 1 ? "" : "s"} activated and routed to "${plan.target?.name || "the experience"}".`
          : `${plan.selected.length} TapPoint${plan.selected.length === 1 ? "" : "s"} saved as drafts, routed to "${plan.target?.name || "the experience"}".`)
      : `Your new experience ${plan.status === "draft" ? "is saved as a draft" : "is live"}.`;

    // Snapshot this completed session into the chats history so the user
    // can scroll back to it from the ⋯ menu later.
    const snapshotAnswers = { ...session.answers };
    const snapshotFlow = session.flow;
    const snapshotMessages = session.messages.slice();
    setChats((prev) => [{
      id: "chat-" + Date.now().toString(36),
      title: plan.kind === "setup-tappoints"
        ? `Set up ${plan.selected.length} TapPoint${plan.selected.length === 1 ? "" : "s"}${plan.space ? ` · ${plan.space.short || plan.space.name?.split(",")[0]}` : ""}`
        : `Create experience · ${plan.newExperience?.name || ""}`,
      stamp: "just now",
      summary,
      seed: () => ({
        flow: snapshotFlow, status: "done", stepIdx: 99,
        answers: snapshotAnswers, messages: snapshotMessages, analytics: null,
      }),
    }, ...prev]);

    dispatch({ type: "APPLY_DONE" });
    onToast?.(`✓ ${summary}`);
  };

  // ── Body selector ────────────────────────────────────────────────────
  let body;
  if (session.status === "preview")     body = <ScreenPreview session={session} onApply={applyPlan} onBackToWorkflow={() => { dispatch({ type: "BACK_TO_QUESTIONING" }); onStateChange?.("workflow"); }} onCancel={reset} onSaveDraft={() => { applyPlan(); /* status was set earlier — keep behaviour same */ }} />;
  else if (session.status === "applying") body = <ScreenApplying/>;
  else if (session.status === "done")   body = <ScreenDone summary={lastApplySummary(session)} onNewSession={reset} onNav={onNav} onClose={close}/>;
  else if (session.status === "analytics") body = <ScreenAnalytics session={session} onAskAnother={askAnalytics} onNav={onNav}/>;
  else if (session.flow && session.status === "asking") body = <ScreenWorkflow session={session} dispatch={dispatch} onAnswer={(slot, value, displayText, advance) => dispatch({ type: "ANSWER", slot, value, displayText, advance })} onEditSlot={(slot) => dispatch({ type: "EDIT_SLOT", slot })} threadRef={threadRef}/>;
  else body = <ScreenDefault onPickSuggestion={onPickSuggestion} onPickQuickAsk={onPickQuickAsk}/>;

  return (
    <>
      <AIAgentLauncher open={open} onClick={() => setOpen(true)}/>
      <div className={"aa-overlay" + (open ? " is-open" : "")} onClick={close} aria-hidden={!open}/>
      <aside className={"aa-panel" + (open ? " is-open" : "")} role="dialog" aria-label="Ask TapIn AI">
        <AAHeader
          session={session}
          onClose={close}
          onBack={onBack}
          onNewChat={reset}
          chats={chats}
          onPickChat={pickChat}
        />
        <div className="aa-scroll">{body}</div>
        <AAFooter
          session={session}
          onPromptSubmit={onPromptSubmit}
          onCancel={() => { reset(); }}
          onApply={applyPlan}
          onEdit={() => { dispatch({ type: "BACK_TO_QUESTIONING" }); onStateChange?.("workflow"); }}
          onSaveDraft={() => {
            // Override status to draft, then apply
            session.answers.status = "draft";
            applyPlan();
          }}
          onNewSession={reset}
          onClose={close}
        />
      </aside>
    </>
  );
}

// Pull a friendly summary out of the session for the Done screen
function lastApplySummary(session) {
  const a = session.answers;
  if (session.flow === "setup-tappoints") {
    const n = (a.tappointIds || []).length;
    return `${n} TapPoint${n === 1 ? "" : "s"} ${a.status === "draft" ? "saved as draft" : "set up and live"}.`;
  }
  if (session.flow === "create-experience") {
    return `Your new experience ${a.status === "draft" ? "is saved as a draft" : "is live"}.`;
  }
  return "Done.";
}

window.AIAgent = AIAgent;
