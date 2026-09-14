// Account settings screen
const { useState: useStateAccount } = React;

function AccountScreen({ onToast }) {
  // Profile
  const [firstName, setFirstName] = useStateAccount("Joe");
  const [lastName, setLastName] = useStateAccount("Bloggs");
  const [displayName, setDisplayName] = useStateAccount("Joe Bloggs");
  const [email] = useStateAccount("joe@acmeco.com");
  const [phone, setPhone] = useStateAccount("+1 (415) 555-0142");
  const [jobTitle, setJobTitle] = useStateAccount("Marketing Executive");

  // Preferences
  const TIMEZONES = [
    "(HST) Hawaii Standard Time — UTC−10",
    "(AKST) Alaska Standard Time — UTC−09",
    "(PST) Pacific Standard Time — UTC−08",
    "(MST) Mountain Standard Time — UTC−07",
    "(CST) Central Standard Time — UTC−06",
    "(EST) Eastern Standard Time — UTC−05",
    "(AST) Atlantic Standard Time — UTC−04",
    "(BRT) Brasília Time — UTC−03",
    "(UTC) Coordinated Universal Time",
    "(GMT) Greenwich Mean Time — UTC+00",
    "(CET) Central European Time — UTC+01",
    "(EET) Eastern European Time — UTC+02",
    "(MSK) Moscow Standard Time — UTC+03",
    "(GST) Gulf Standard Time — UTC+04",
    "(IST) India Standard Time — UTC+05:30",
    "(CST) China Standard Time — UTC+08",
    "(SGT) Singapore Time — UTC+08",
    "(JST) Japan Standard Time — UTC+09",
    "(AEST) Australian Eastern Standard Time — UTC+10",
    "(NZST) New Zealand Standard Time — UTC+12",
  ];
  const LANGUAGES = [
    { code: "en-US", label: "English (US)" },
    { code: "en-GB", label: "English (UK)" },
    { code: "es-ES", label: "Spanish (Spain)" },
    { code: "es-MX", label: "Spanish (Mexico)" },
    { code: "fr-FR", label: "French" },
    { code: "de-DE", label: "German" },
    { code: "pt-BR", label: "Portuguese (Brazil)" },
    { code: "it-IT", label: "Italian" },
    { code: "ja-JP", label: "Japanese" },
    { code: "zh-CN", label: "Chinese (Simplified)" },
  ];
  const [timezone, setTimezone] = useStateAccount("(EST) Eastern Standard Time — UTC−05");
  const [language, setLanguage] = useStateAccount("en-US");
  const [dateFormat, setDateFormat] = useStateAccount("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useStateAccount("12h");
  const [weekStart, setWeekStart] = useStateAccount("Sunday");

  // Notifications
  const [notifs, setNotifs] = useStateAccount({
    weeklyDigest: true,
    newLead: true,
    deviceOffline: true,
    productNews: false,
  });
  const toggleNotif = (k) => setNotifs({ ...notifs, [k]: !notifs[k] });

  // Security
  const [twoFA, setTwoFA] = useStateAccount(true);
  const [confirmDelete, setConfirmDelete] = useStateAccount(false);
  const [deleteText, setDeleteText] = useStateAccount("");

  const sessions = [
    { id: 1, device: "MacBook Pro · Chrome", location: "New York, US", lastActive: "Active now", current: true },
    { id: 2, device: "iPhone 15 · TapIn iOS", location: "New York, US", lastActive: "2h ago", current: false },
    { id: 3, device: "Windows · Edge", location: "London, UK", lastActive: "3d ago", current: false },
  ];

  // Organization-section edit state (Org Admins only)
  const isOrgAdmin = (typeof window !== "undefined" && window.__viewerRole !== "Space Admin");
  const [orgName, setOrgName] = useStateAccount("Acme Museum Co.");
  const [orgIndustry, setOrgIndustry] = useStateAccount("Cultural & Educational");

  return (
    <>
      <Topbar title="Account" subtitle="Manage your profile, preferences, and security." />

      <div className="account-layout">
        <nav className="account-nav">
          <a href="#section-org" className="account-nav__item">Organization</a>
          <a href="#section-profile" className="account-nav__item">Profile</a>
          <a href="#section-prefs" className="account-nav__item">Preferences</a>
          <a href="#section-notifs" className="account-nav__item">Notifications</a>
          <a href="#section-security" className="account-nav__item">Security</a>
        </nav>

        <div className="account-content">

          {/* ─── Organization ────────────────────── */}
          <section id="section-org" className="card account-section">
            <div className="account-section__head">
              <div>
                <h3 className="card-title">Organization</h3>
                <p className="card-subtitle">Information about the parent organization you belong to.</p>
              </div>
              {!isOrgAdmin && (
                <span className="locked-chip" aria-label="Locked">
                  <LockIcon /> Locked
                </span>
              )}
            </div>
            <div className="account-section__body">
              {!isOrgAdmin && (
                <div className="locked-banner">
                  <LockIcon className="locked-banner__icon" />
                  <div>
                    <div className="locked-banner__title">Read-only for Space admins</div>
                    <div className="locked-banner__hint">Only Organization admins can edit organization-level details. <a href="#" onClick={(e) => { e.preventDefault(); onToast && onToast("Contact request sent"); }}>Contact an org admin</a></div>
                  </div>
                </div>
              )}

              <div className="account-grid">
                {isOrgAdmin ? (
                  <div className="field"><label>Organization name</label><input value={orgName} onChange={(e) => setOrgName(e.target.value)} /></div>
                ) : (
                  <ReadonlyField label="Organization name" value={orgName} />
                )}
                <ReadonlyField label="Organization ID" value="org_4n8q2zxK" mono />
                {isOrgAdmin ? (
                  <div className="field"><label>Industry</label><input value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} /></div>
                ) : (
                  <ReadonlyField label="Industry" value={orgIndustry} />
                )}
                <ReadonlyField label="Plan" value="Enterprise" pill="green" />
                <ReadonlyField label="Created" value="03/14/2023" />
                <ReadonlyField label="Your role" value={isOrgAdmin ? "Organization Admin" : "Space Admin"} pill="blue" />
              </div>
            </div>
            {isOrgAdmin && (
              <div className="account-section__footer">
                <button className="btn btn--primary" onClick={() => onToast && onToast("Organization details saved")}>Save changes</button>
              </div>
            )}
          </section>

          {/* ─── Profile ──────────────────────────────────── */}
          <section id="section-profile" className="card account-section">
            <div className="account-section__head">
              <div>
                <h3 className="card-title">Profile</h3>
                <p className="card-subtitle">Your personal information.</p>
              </div>
            </div>
            <div className="account-section__body">
              <div className="account-avatar-row">
                <div className="account-avatar">JB</div>
                <div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn--sm" onClick={() => onToast && onToast("Upload not wired up")}>Upload photo</button>
                    <button className="btn btn--sm" onClick={() => onToast && onToast("Photo removed")}>Remove</button>
                  </div>
                  <p className="card-subtitle" style={{ margin: "8px 0 0" }}>PNG or JPG, up to 2 MB.</p>
                </div>
              </div>

              <div className="account-grid">
                <div className="field"><label>First name</label><input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                <div className="field"><label>Last name</label><input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                <div className="field"><label>Display name</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                <div className="field">
                  <label>Email <span className="locked-inline"><LockIcon /> Verified</span></label>
                  <input value={email} disabled />
                </div>
                <div className="field"><label>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div className="field"><label>Job title</label><input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></div>
              </div>
            </div>
            <div className="account-section__footer">
              <button className="btn">Discard</button>
              <button className="btn btn--primary" onClick={() => onToast && onToast("Profile saved")}>Save changes</button>
            </div>
          </section>

          {/* ─── Preferences ──────────────────────────────── */}
          <section id="section-prefs" className="card account-section">
            <div className="account-section__head">
              <div>
                <h3 className="card-title">Preferences</h3>
                <p className="card-subtitle">Region, language, and how dates and times display.</p>
              </div>
            </div>
            <div className="account-section__body">
              <div className="account-grid">
                <div className="field">
                  <label>Timezone</label>
                  <SelectInput options={TIMEZONES.map((t) => ({ value: t, label: t }))} value={timezone} onChange={setTimezone} />
                </div>
                <div className="field">
                  <label>Language</label>
                  <SelectInput options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} value={language} onChange={setLanguage} />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Date format</label>
                  <RadioGroup
                    value={dateFormat}
                    onChange={setDateFormat}
                    options={[
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY", hint: "05/13/2026" },
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY", hint: "13/05/2026" },
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD", hint: "2026-05-13" },
                    ]}
                  />
                </div>
              </div>
            </div>
            <div className="account-section__footer">
              <button className="btn btn--primary" onClick={() => onToast && onToast("Preferences saved")}>Save changes</button>
            </div>
          </section>

          {/* ─── Notifications ────────────────────────────── */}
          <section id="section-notifs" className="card account-section">
            <div className="account-section__head">
              <div>
                <h3 className="card-title">Notifications</h3>
                <p className="card-subtitle">Email alerts you receive from TapIn.</p>
              </div>
            </div>
            <div className="account-section__body" style={{ paddingTop: 0 }}>
              <div className="notif-list">
                <NotifRow title="Weekly digest" desc="Summary of taps and top performers for spaces you admin." on={notifs.weeklyDigest} onToggle={() => toggleNotif("weeklyDigest")} />
                <NotifRow title="New lead captured" desc="Email whenever a visitor submits a lead form." on={notifs.newLead} onToggle={() => toggleNotif("newLead")} />
                <NotifRow title="Device offline alert" desc="Notify me if a TapPoint hasn't reported in 24h." on={notifs.deviceOffline} onToggle={() => toggleNotif("deviceOffline")} />
                <NotifRow title="Product updates" desc="Occasional product news, tips, and feature launches." on={notifs.productNews} onToggle={() => toggleNotif("productNews")} />
              </div>
            </div>
          </section>

          {/* ─── Security ─────────────────────────────────── */}
          <section id="section-security" className="card account-section">
            <div className="account-section__head">
              <div>
                <h3 className="card-title">Security</h3>
                <p className="card-subtitle">Password, two-factor authentication, and active sessions.</p>
              </div>
            </div>
            <div className="account-section__body">
              <div className="security-row">
                <div>
                  <div className="security-row__title">Password</div>
                  <div className="security-row__hint">Last changed 28 days ago.</div>
                </div>
                <button className="btn" onClick={() => onToast && onToast("Password reset email sent")}>Change password</button>
              </div>
              <div className="security-row">
                <div>
                  <div className="security-row__title">Two-factor authentication
                    {twoFA && <span className="pill pill--green" style={{ marginLeft: 10, fontSize: 10 }}>Enabled</span>}
                  </div>
                  <div className="security-row__hint">Add an extra layer of security to your account.</div>
                </div>
                <button className={"toggle" + (twoFA ? " on" : "")} onClick={() => setTwoFA(!twoFA)} />
              </div>

              <div className="account-section__subhead">Active sessions</div>
              <div className="session-list">
                {sessions.map((s) => (
                  <div className="session-row" key={s.id}>
                    <div className="session-row__icon">
                      {s.device.includes("iPhone") ? <PhoneIcon /> : s.device.includes("Windows") ? <WindowsIcon /> : <LaptopIcon />}
                    </div>
                    <div className="session-row__main">
                      <div className="session-row__title">
                        {s.device}
                        {s.current && <span className="pill pill--green" style={{ marginLeft: 8, fontSize: 10 }}>This device</span>}
                      </div>
                      <div className="session-row__hint">{s.location} · {s.lastActive}</div>
                    </div>
                    {!s.current && <button className="btn btn--sm" onClick={() => onToast && onToast("Session signed out")}>Sign out</button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="account-section__footer" style={{ justifyContent: "space-between" }}>
              <button className="btn btn--danger" onClick={() => setConfirmDelete(true)}><Icon.Trash /> Delete account</button>
              <button className="btn" onClick={() => onToast && onToast("All sessions signed out")}>Sign out all other sessions</button>
            </div>
          </section>

        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => { setConfirmDelete(false); setDeleteText(""); }}>
          <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="confirm-delete__icon"><Icon.Trash /></div>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>Delete account?</h3>
                  <p className="card-subtitle" style={{ margin: "2px 0 0" }}>This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--ink-800)", lineHeight: 1.55, margin: 0 }}>
                This will permanently remove your account and any assets you own — including spaces where you're the sole admin, experiences you created, and assigned TapPoints. Team members will lose access to anything you exclusively own.
              </p>
              <ul style={{ fontSize: 12, color: "var(--ink-700)", paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
                <li>Your profile, sessions, and personal data will be deleted within 30 days.</li>
                <li>Spaces you co-admin will remain with their other admins.</li>
                <li>This cannot be reversed.</li>
              </ul>
              <div className="field" style={{ margin: 0 }}>
                <label>Type <strong style={{ color: "var(--ink-900)" }}>DELETE</strong> to confirm</label>
                <input
                  autoFocus
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
            </div>
            <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={() => { setConfirmDelete(false); setDeleteText(""); }}>Cancel</button>
              <button
                className="btn btn--danger"
                style={deleteText === "DELETE" ? null : { opacity: 0.5, pointerEvents: "none" }}
                onClick={() => { setConfirmDelete(false); setDeleteText(""); onToast && onToast("Account deletion scheduled"); }}
              ><Icon.Trash /> Permanently delete account</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Small subcomponents
// ─────────────────────────────────────────────────────────────
function ReadonlyField({ label, value, mono, pill }) {
  return (
    <div className="readonly-field">
      <div className="readonly-field__label">{label}</div>
      <div className="readonly-field__value">
        {pill ? (
          <span className={"pill pill--" + pill}>{value}</span>
        ) : (
          <span style={mono ? { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "var(--ink-800)" } : null}>{value}</span>
        )}
      </div>
    </div>
  );
}

function SelectInput({ options, value, onChange }) {
  const [open, setOpen] = useStateAccount(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const current = options.find((o) => o.value === value);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <div className="select" onClick={() => setOpen(!open)}>
        <span>{current ? current.label : "Select…"}</span>
        <Icon.Caret />
      </div>
      {open && (
        <div className="dropdown-menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, maxHeight: 280, overflow: "auto", minWidth: "auto", display: "flex", flexDirection: "column", padding: 4, boxShadow: "0 6px 18px rgba(0,13,50,0.10)", zIndex: 10 }}>
          {options.map((o) => (
            <div key={o.value} className={"item" + (o.value === value ? " is-selected" : "")} style={{ padding: "8px 12px" }} onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div className="radio-group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={"radio-card" + (value === o.value ? " is-on" : "")}
          onClick={() => onChange(o.value)}
        >
          <span className="radio-card__dot"></span>
          <span className="radio-card__label">{o.label}</span>
          {o.hint && <span className="radio-card__hint">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

function NotifRow({ title, desc, on, onToggle }) {
  return (
    <div className="notif-row">
      <div>
        <div className="notif-row__title">{title}</div>
        <div className="notif-row__hint">{desc}</div>
      </div>
      <button className={"toggle" + (on ? " on" : "")} onClick={onToggle} />
    </div>
  );
}

// ─── Inline icons ────────────────────────────────────────────
function LockIcon(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...props}>
      <rect x="2.75" y="6.5" width="8.5" height="5.75" rx="1.25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.5 6.5V4.75a2.5 2.5 0 015 0V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function LaptopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 16h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="6" y="2.5" width="8" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="15" r="0.8" fill="currentColor" />
    </svg>
  );
}
function WindowsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="7" height="7" fill="currentColor" />
      <rect x="11" y="3" width="7" height="7" fill="currentColor" />
      <rect x="2" y="11" width="7" height="7" fill="currentColor" />
      <rect x="11" y="11" width="7" height="7" fill="currentColor" />
    </svg>
  );
}

Object.assign(window, { AccountScreen });
