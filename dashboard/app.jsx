// App shell: routing + persistence
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "spaces": 6,
  "experiences": 20,
  "tappoints": 22,
  "users": 12,
  "announcements": 6,
  "viewerRole": "Organization Admin",
  "aiPanel": true,
  "aiChips": true,
  "aiTone": "factual",
  "aiAgent": true,
  "aiAgentState": "default"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Expose viewer role globally so any screen can branch on it without prop-drilling.
  // Bump dataRev so child screens remount and pick up the new role reads.
  useEffectApp(() => {
    window.__viewerRole = t.viewerRole;
    setDataRev((n) => n + 1);
  }, [t.viewerRole]);
  // Re-apply data whenever tweak counts change, force children to re-read window.DATA.
  const [dataRev, setDataRev] = useStateApp(0);
  useEffectApp(() => {
    window.applyDataTweaks({
      spaces: t.spaces,
      experiences: t.experiences,
      tappoints: t.tappoints,
      users: t.users,
      announcements: t.announcements,
    });
    // If the currently-selected space disappeared (e.g. spaces dropped below its index), reset to "all".
    if (spaceCtx !== "all" && !window.DATA.SPACES.find(s => s.id === spaceCtx)) {
      setSpaceCtx("all");
    }
    // If we're editing a space/experience that no longer exists, bail back to its index page.
    if (route === "space-edit" && editingSpaceId && !window.DATA.SPACES.find(s => s.id === editingSpaceId)) {
      setEditingSpaceId(null);
      setRoute("spaces");
    }
    if (route === "experience-edit" && editingExpId && !window.DATA.EXPERIENCES.find(e => e.id === editingExpId)) {
      setEditingExpId(null);
      setRoute("experiences");
    }
    setDataRev((n) => n + 1);
  }, [t.spaces, t.experiences, t.tappoints, t.users, t.announcements]);

  const [route, setRoute] = useStateApp(() => localStorage.getItem("tapin_route") || "dashboard");
  const [spaceCtx, setSpaceCtx] = useStateApp(() => localStorage.getItem("tapin_space") || "all");
  const [period, setPeriod] = useStateApp({ kind: "28" });
  const [frequency, setFrequency] = useStateApp("weekly");
  const [editingSpaceId, setEditingSpaceId] = useStateApp(null);
  const [editingExpId, setEditingExpId] = useStateApp(null);
  const [expInitialTab, setExpInitialTab] = useStateApp(null);
  const [showTypeModal, setShowTypeModal] = useStateApp(false);
  const [toast, setToast] = useStateApp(null);

  useEffectApp(() => { localStorage.setItem("tapin_route", route); }, [route]);
  useEffectApp(() => { localStorage.setItem("tapin_space", spaceCtx); }, [spaceCtx]);
  useEffectApp(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  // Expose toast trigger globally so screens (TapPoints, etc) can flash a confirmation.
  window.__tapinToast = setToast;
  // Expose a data-bump hook so the AI Agent can force re-renders after it
  // mutates window.DATA directly (without going through the tweak counts).
  window.__tapinBumpData = () => setDataRev((n) => n + 1);

  const onNav = (key) => {
    if (key === "logout") { setToast("Signed out (demo)"); return; }
    if (["dashboard","experiences","tappoints","spaces","people","reports","account","helpdesk","order","orders"].includes(key)) {
      setRoute(key);
      setEditingSpaceId(null);
    }
  };
  window.__tapinNav = onNav;

  const onSelectSpace = (id) => {
    if (route === "spaces") {
      setEditingSpaceId(id);
      setRoute("space-edit");
    } else {
      setSpaceCtx(id);
      setRoute("dashboard");
    }
  };

  let content = null;
  if (route === "dashboard") {
    const onSelectExperience = (id, tab) => { setEditingExpId(id); setExpInitialTab(tab || null); setRoute("experience-edit"); };
    content = spaceCtx === "all"
      ? <DashboardAllSpaces onNav={onNav} onSelectSpace={(id) => { setSpaceCtx(id); }} onSelectExperience={onSelectExperience} spaceCtx={spaceCtx} setSpaceCtx={setSpaceCtx} period={period} setPeriod={setPeriod} frequency={frequency} setFrequency={setFrequency} ai={t} />
      : <DashboardSelectedSpace spaceId={spaceCtx} onNav={onNav} onSelectExperience={onSelectExperience} spaceCtx={spaceCtx} setSpaceCtx={setSpaceCtx} period={period} setPeriod={setPeriod} frequency={frequency} setFrequency={setFrequency} ai={t} />;
  } else if (route === "experiences") {
    content = <ExperiencesScreen ai={t} onNav={onNav} onSelectExperience={(id, tab) => { setEditingExpId(id); setExpInitialTab(tab || null); setRoute("experience-edit"); }} />;
  } else if (route === "experience-edit") {
    content = <ExperienceEditScreen expId={editingExpId} initialTab={expInitialTab} onNav={onNav} onBack={() => setRoute("experiences")} onToast={setToast} />;
  } else if (route === "tappoints") {
    content = <TapPointsScreen ai={t} onNav={onNav} />;
  } else if (route === "spaces") {
    content = <SpacesScreen ai={t} onNav={onNav} onSelectSpace={(id) => { setEditingSpaceId(id); setRoute("space-edit"); }} />;
  } else if (route === "people") {
    content = <PeopleScreen ai={t} onNav={onNav} onSelectSpace={(id) => { setSpaceCtx(id); setRoute("dashboard"); }} />;
  } else if (route === "space-edit") {
    content = <SpaceEditScreen spaceId={editingSpaceId} onNav={onNav} onBack={() => setRoute("spaces")} onSelectExperience={(id, tab) => { setEditingExpId(id); setExpInitialTab(tab || null); setRoute("experience-edit"); }} />;
  } else if (route === "reports") {
    content = <ReportsScreen ai={t} onNav={onNav} spaceCtx={spaceCtx} setSpaceCtx={setSpaceCtx} period={period} setPeriod={setPeriod} frequency={frequency} setFrequency={setFrequency} onSelectExperience={(id, tab) => { setEditingExpId(id); setExpInitialTab(tab || null); setRoute("experience-edit"); }} />;
  } else if (route === "account") {
    content = <AccountScreen onToast={setToast} />;
  } else if (route === "order") {
    content = <OrderScreen onBack={() => setRoute("tappoints")} onToast={setToast} />;
  } else if (route === "orders") {
    content = <OrdersListScreen onNav={onNav} onToast={setToast} />;
  } else if (route === "helpdesk") {
    content = (
      <>
        <Topbar title="Helpdesk" subtitle="Get help and support." />
        <div className="card" style={{ padding: 80, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 8px" }}>Help center</p>
          <p style={{ fontSize: 13, color: "var(--ink-600)", margin: 0 }}>Section coming soon.</p>
        </div>
      </>
    );
  }

  return (
    <div className="app">
      <Sidebar route={route === "space-edit" ? "spaces" : route === "experience-edit" ? "experiences" : route} onNav={onNav} />
      <main className="main" key={dataRev}>
        <div className="page-frame" key={route}>
          {content}
        </div>
      </main>
      {showTypeModal && (
        <EditSpaceTypeModal onClose={() => setShowTypeModal(false)} current={""} onSelect={() => {}} />
      )}
      {toast && <div className="toast">{toast}</div>}
      {t.aiAgent && (
        <AIAgent
          state={t.aiAgentState}
          onStateChange={(s) => setTweak('aiAgentState', s)}
          onNav={onNav}
          onToast={setToast}
        />
      )}
      <TweaksPanel>
        <TweakSection label="Viewing as" />
        <TweakRadio  label="Logged-in role" value={t.viewerRole}
                     options={['Organization Admin', 'Space Admin']}
                     onChange={(v) => setTweak('viewerRole', v)} />
        <TweakSection label="AI Insights" />
        <TweakToggle label="AI Insights panel" value={t.aiPanel}
                     onChange={(v) => setTweak('aiPanel', v)} />
        <TweakToggle label={'"Why?" chips on stats'} value={t.aiChips}
                     onChange={(v) => setTweak('aiChips', v)} />
        <TweakRadio  label="Tone" value={t.aiTone}
                     options={['factual', 'conversational']}
                     onChange={(v) => setTweak('aiTone', v)} />
        <TweakSection label="Ask TapIn AI" />
        <TweakToggle label="AI Agent assistant" value={t.aiAgent}
                     onChange={(v) => setTweak('aiAgent', v)} />
        <TweakSelect label="Demo seed" value={t.aiAgentState}
                     options={[
                       { value: 'default',  label: 'Empty panel' },
                       { value: 'workflow', label: 'Mid-workflow' },
                       { value: 'preview',  label: 'Action preview' },
                     ]}
                     onChange={(v) => setTweak('aiAgentState', v)} />
        <TweakSection label="Sample data" />
        <TweakSlider label="Spaces" value={t.spaces} min={0} max={20} step={1}
                     onChange={(v) => setTweak('spaces', v)} />
        <TweakSlider label="Experiences" value={t.experiences} min={0} max={50} step={1}
                     onChange={(v) => setTweak('experiences', v)} />
        <TweakSlider label="TapPoints" value={t.tappoints} min={0} max={60} step={1}
                     onChange={(v) => setTweak('tappoints', v)} />
        <TweakSlider label="Users" value={t.users} min={0} max={50} step={1}
                     onChange={(v) => setTweak('users', v)} />
        <TweakSlider label="Announcements per space" value={t.announcements} min={0} max={30} step={1}
                     onChange={(v) => setTweak('announcements', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
