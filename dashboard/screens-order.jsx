// Order TapPoints screen — 3-step flow: Products → Shipping → Payment
const { useState: useStateOrder, useMemo: useMemoOrder } = React;

// ─────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────
const CATALOG_DEVICES = [
  { sku: "tp-card-personal", name: "Custom Personal Card",  kind: "Device", price: 25, glyph: "card-photo",   color: "#0b59b2", customizable: true,  rating: 4.8, reviews: 552, colorOptions: ["#FFFFFF", "#0b59b2", "#E2C49A", "#141d23"] },
  { sku: "tp-card-group",    name: "Custom Group Card",     kind: "Device", price: 15, glyph: "card-gradient",color: "#7434c2", customizable: true,  rating: 4.7, reviews: 318, colorOptions: ["#FFFFFF", "#7434c2", "#0b59b2", "#141d23"] },
  { sku: "tp-hub",           name: "Custom Hub",            kind: "Device", price: 75, glyph: "hub",          color: "#141d23", customizable: true,  rating: 4.9, reviews: 211, colorOptions: ["#141d23"] },
  { sku: "tp-card-case",     name: "Card Case",      kind: "Item",   price: 50, glyph: "case",         color: "#475569", customizable: false, rating: 4.6, reviews: 94,  colorOptions: ["#141d23"] },
  { sku: "hub-sign",         name: "Hub Sign",             kind: "Item",   price: 25, glyph: "sign",         color: "#1c8a36", customizable: true,  rating: 4.5, reviews: 67,  colorOptions: ["#141d23", "#1c8a36", "#0b59b2", "#7434c2"] },
  { sku: "tp-sticker",       name: "Custom Sticker",        kind: "Device", price: 15, glyph: "sticker",      color: "#1c8a36", customizable: true,  rating: 4.7, reviews: 142, colorOptions: ["#FFFFFF", "#1c8a36", "#0b59b2", "#7434c2", "#E07C2A"] },
];

const CATALOG_BUNDLES = [
  {
    id: "bnd-hub-events",
    name: "TapIn Hub with Events Subscription",
    desc: "TapIn Hub paired with an events-ready subscription.",
    glyph: "hub",
    color: "#141d23",
    items: [{ sku: "tp-hub", qty: 1 }],
    plans: [
      { id: "monthly", label: "Monthly", price: 9.99, cycle: "/mo", hint: "Cancel anytime" },
      { id: "events",  label: "Events",  price: 50,   cycle: "/yr", hint: "Best for one-off events" },
    ],
    defaultPlan: "monthly",
  },
  {
    id: "bnd-group-events",
    name: "TapIn Group Card with Events Subscription",
    desc: "Branded group card with an annual events plan.",
    glyph: "card-gradient",
    color: "#7434c2",
    items: [{ sku: "tp-card-group", qty: 1 }],
    plans: [{ id: "events", label: "TapIn Events", price: 50, cycle: "/yr", hint: "$50 yearly" }],
    defaultPlan: "events",
    flatPrice: 50,
  },
  {
    id: "bnd-personal-events",
    name: "TapIn Personal Card with Events Subscription",
    desc: "Personal card with the events subscription.",
    glyph: "card-photo",
    color: "#0b59b2",
    items: [{ sku: "tp-card-personal", qty: 1 }],
    plans: [{ id: "events", label: "Events Subscription", price: 50, cycle: "/yr", hint: "$50 yearly" }],
    defaultPlan: "events",
    flatPrice: 50,
  },
  {
    id: "bnd-tradeshow",
    name: "TapIn Tradeshow Booth Bundle",
    desc: "Everything to run an event booth: hubs, cards, signs and cases.",
    glyph: "tradeshow",
    color: "#0b59b2",
    items: [
      { sku: "tp-card-group", qty: 20 },
      { sku: "tp-hub",        qty: 2,  unitOverride: 50 },
      { sku: "hub-sign",      qty: 2 },
      { sku: "tp-card-case",  qty: 4,  unitOverride: 10, discountPct: 100 },
    ],
    plans: [{ id: "annual", label: "Annual Plan", price: 200, cycle: "/yr", hint: "Included" }],
    defaultPlan: "annual",
    flatPrice: 200,
  },
  {
    id: "bnd-sticker-events",
    name: "TapIn Sticker with Events Subscription",
    desc: "Stick-on TapPoint with an events subscription.",
    glyph: "sticker",
    color: "#1c8a36",
    items: [{ sku: "tp-sticker", qty: 1 }],
    plans: [{ id: "events", label: "Events Subscription", price: 50, cycle: "/yr", hint: "$50 yearly" }],
    defaultPlan: "events",
    flatPrice: 50,
  },
  {
    id: "bnd-business-starter",
    name: "TapIn Business Card Starter Kit",
    desc: "Two TapIn Personal Cards to get your team started.",
    glyph: "card-photo",
    color: "#0b59b2",
    items: [{ sku: "tp-card-personal", qty: 2, discountPct: 100 }],
    plans: [
      { id: "monthly", label: "Monthly", price: 10, cycle: "/mo", hint: "Business Card Monthly" },
      { id: "yearly",  label: "Yearly",  price: 99, cycle: "/yr", hint: "Business Card Yearly" },
    ],
    defaultPlan: "monthly",
  },
];

const findDevice = (sku) => CATALOG_DEVICES.find((d) => d.sku === sku);

// ─────────────────────────────────────────────────────────────
// Glyph (SVG product visuals — placeholders, no images)
// ─────────────────────────────────────────────────────────────
function Glyph({ kind, color, size = 56 }) {
  const sz = size;
  const Wrap = ({ children, bg }) => (
    <div className="glyph" style={{ width: sz, height: sz, background: bg || color }}>
      <svg viewBox="0 0 56 56" width={sz} height={sz}>{children}</svg>
    </div>
  );
  if (kind === "card-gradient") {
    return (
      <div className="glyph glyph--img" style={{ width: sz, height: sz }}>
        <img src="assets/group-card.png" alt="" />
      </div>
    );
  }
  if (kind === "hub") {
    return (
      <div className="glyph glyph--img" style={{ width: sz, height: sz }}>
        <img src="assets/hub.png" alt="" />
      </div>
    );
  }
  if (kind === "card-photo") {
    return (
      <div className="glyph glyph--img" style={{ width: sz, height: sz }}>
        <img src="assets/personal-card.png" alt="" />
      </div>
    );
  }
  if (kind === "case") {
    return (
      <div className="glyph glyph--img" style={{ width: sz, height: sz }}>
        <img src="assets/card-case.png" alt="" />
      </div>
    );
  }
  if (kind === "sticker") {
    return (
      <div className="glyph glyph--img" style={{ width: sz, height: sz }}>
        <img src="assets/sticker.png" alt="" />
      </div>
    );
  }
  if (kind === "sign") {
    return (
      <div className="glyph glyph--img" style={{ width: sz, height: sz }}>
        <img src="assets/hub-sign.png" alt="" />
      </div>
    );
  }
  if (kind === "tradeshow") {
    return (
      <div className="glyph glyph--img" style={{ width: sz, height: sz }}>
        <img src="assets/tradeshow.png" alt="" />
      </div>
    );
  }
  switch (kind) {
    case "hub":
      return (
        <Wrap bg="radial-gradient(circle at 30% 28%, #2a3138 0%, #0d1418 70%)">
          <circle cx="28" cy="28" r="20" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <path d="M28 14a14 14 0 0 1 14 14" fill="none" stroke="#1c8a36" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M28 19a9 9 0 0 1 9 9" fill="none" stroke="#0b59b2" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="28" cy="28" r="2.6" fill="#1c8a36" />
        </Wrap>
      );
    case "card-photo":
      return (
        <Wrap bg="linear-gradient(135deg, #0b59b2 0%, #1e2a44 100%)">
          <rect x="9" y="11" width="38" height="34" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
          <circle cx="20" cy="22" r="5" fill="rgba(255,255,255,0.85)" />
          <path d="M11 38c2-5 7-7 9-7s7 2 9 7" fill="rgba(255,255,255,0.85)" />
          <rect x="32" y="20" width="13" height="2.2" rx="1" fill="rgba(255,255,255,0.55)" />
          <rect x="32" y="25" width="11" height="2" rx="1" fill="rgba(255,255,255,0.35)" />
        </Wrap>
      );
    case "card-gradient":
      return (
        <Wrap bg="linear-gradient(135deg, #1c8a36 0%, #0b59b2 45%, #7434c2 100%)">
          <rect x="9" y="11" width="38" height="34" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.22)" />
          <path d="M14 38l8-12 6 8 5-6 9 10" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinejoin="round" />
        </Wrap>
      );
    case "case":
      return (
        <Wrap bg="linear-gradient(135deg, #2a3138 0%, #141d23 100%)">
          <rect x="13" y="9" width="30" height="38" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
          <rect x="18" y="14" width="20" height="28" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.20)" />
          <text x="28" y="32" fontSize="9" fill="rgba(255,255,255,0.65)" fontWeight="700" textAnchor="middle" fontFamily="inherit">Tap)))In</text>
        </Wrap>
      );
    case "sign":
      return (
        <Wrap bg="linear-gradient(135deg, #15793a 0%, #0d4a23 100%)">
          <ellipse cx="28" cy="30" rx="20" ry="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" />
          <rect x="16" y="18" width="24" height="11" rx="1.5" fill="rgba(255,255,255,0.10)" />
          <text x="28" y="26.5" fontSize="6" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="inherit" letterSpacing="0.5">CHARLOTTE</text>
        </Wrap>
      );
    case "sticker":
      return (
        <Wrap bg="conic-gradient(from 200deg at 60% 60%, #1c8a36 0%, #0b59b2 35%, #7434c2 65%, #1c8a36 100%)">
          <circle cx="28" cy="28" r="20" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" />
          <path d="M22 26a8 8 0 0 1 12 0" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M19 22a13 13 0 0 1 18 0" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="28" cy="32" r="2" fill="#fff" />
        </Wrap>
      );
    case "tradeshow":
      return (
        <Wrap bg="linear-gradient(135deg, #0b59b2 0%, #7434c2 100%)">
          <rect x="6"  y="32" width="13" height="14" rx="1.5" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.30)" />
          <rect x="21" y="22" width="13" height="24" rx="1.5" fill="rgba(255,255,255,0.30)" stroke="rgba(255,255,255,0.40)" />
          <rect x="36" y="28" width="13" height="18" rx="1.5" fill="rgba(255,255,255,0.20)" stroke="rgba(255,255,255,0.30)" />
          <circle cx="28" cy="14" r="4.5" fill="#fff" />
        </Wrap>
      );
    default:
      return <Wrap bg={color}><circle cx="28" cy="28" r="14" fill="rgba(255,255,255,0.25)" /></Wrap>;
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const fmt$ = (v) => "$" + (Math.round(v * 100) / 100).toFixed(2);

function QtyStepper({ qty, onChange, min = 0, max = 999, size = "md" }) {
  return (
    <div className={"qty " + (size === "sm" ? "qty--sm" : "")}>
      <button type="button" onClick={() => onChange(Math.max(min, qty - 1))} disabled={qty <= min} aria-label="Decrease">−</button>
      <input
        type="number"
        value={qty}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value || "0", 10);
          if (Number.isNaN(v)) return;
          onChange(Math.max(min, Math.min(max, v)));
        }}
      />
      <button type="button" onClick={() => onChange(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="Increase">+</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Order screen
// ─────────────────────────────────────────────────────────────
function OrderScreen({ onBack, onToast }) {
  const [step, setStep] = useStateOrder(1); // 1=products, 2=shipping, 3=payment
  const [tab, setTab] = useStateOrder("devices");
  const [search, setSearch] = useStateOrder("");
  const [preview, setPreview] = useStateOrder(null); // { sku, editIndex?, initial? }
  // cart: [{ kind: 'bundle'|'device', refId, qty, planId? }]
  const [cart, setCart] = useStateOrder([]);

  // Shipping & payment state
  const [shipping, setShipping] = useStateOrder({
    recipient: "Joe Bloggs",
    company: "Acme Museum Co.",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    phone: "",
    method: "standard",
  });
  const [payment, setPayment] = useStateOrder({
    cardName: "",
    cardNumber: "",
    exp: "",
    cvc: "",
    billingSame: true,
    poNumber: "",
  });

  // ── Cart operations
  const addDevice = (sku, qty = 1, custom = null) => {
    setCart((prev) => {
      if (custom) {
        return [...prev, { kind: "device", refId: sku, qty, custom }];
      }
      const i = prev.findIndex((l) => l.kind === "device" && l.refId === sku && !l.custom);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { kind: "device", refId: sku, qty }];
    });
  };
  const replaceLine = (idx, qty, custom) => {
    setCart((prev) => prev.map((l, i) => i === idx ? { ...l, qty, custom } : l));
  };
  const addBundle = (bundleId, planId) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.kind === "bundle" && l.refId === bundleId && l.planId === planId);
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = { ...copy[i], qty: copy[i].qty + 1 };
        return copy;
      }
      return [...prev, { kind: "bundle", refId: bundleId, planId, qty: 1 }];
    });
  };
  const setLineQty = (idx, qty) => {
    if (qty <= 0) {
      setCart((p) => p.filter((_, i) => i !== idx));
      return;
    }
    setCart((p) => p.map((l, i) => i === idx ? { ...l, qty } : l));
  };
  const removeLine = (idx) => setCart((p) => p.filter((_, i) => i !== idx));

  // ── Cart math
  const linePrice = (line) => {
    if (line.kind === "device") return findDevice(line.refId).price * line.qty;
    const b = CATALOG_BUNDLES.find((x) => x.id === line.refId);
    const plan = b.plans.find((p) => p.id === line.planId);
    // Plans with a 'cycle' carry separate billing semantics, but the order page totals them as a one-time charge for clarity (same as the source).
    const plansTotal = (plan ? plan.price : 0);
    const itemsTotal = b.flatPrice != null ? 0 : b.items.reduce((sum, it) => {
      const d = findDevice(it.sku);
      const unit = it.unitOverride != null ? it.unitOverride : d.price;
      const gross = unit * it.qty;
      return sum + gross * (1 - (it.discountPct || 0) / 100);
    }, 0);
    return ((b.flatPrice != null ? b.flatPrice : itemsTotal) + plansTotal) * line.qty;
  };
  const subtotal = cart.reduce((sum, l) => sum + linePrice(l), 0);
  const shippingCost = cart.length === 0 ? 0 : shipping.method === "express" ? 24.99 : shipping.method === "overnight" ? 49.99 : 9.99;
  const taxRate = 0.08;
  const tax = (subtotal + shippingCost) * taxRate;
  const total = subtotal + shippingCost + tax;
  const lineCount = cart.reduce((a, l) => a + l.qty, 0);

  // ── Filtering
  const bundles = useMemoOrder(() => CATALOG_BUNDLES.filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.desc.toLowerCase().includes(search.toLowerCase())), [search]);
  const devices = useMemoOrder(() => CATALOG_DEVICES.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.sku.toLowerCase().includes(search.toLowerCase())), [search]);

  // ── Step navigation
  const canContinueFromProducts = cart.length > 0;
  const canContinueFromShipping = shipping.recipient && shipping.address1 && shipping.city && shipping.state && shipping.zip;
  const canPlaceOrder = payment.cardName && payment.cardNumber.replace(/\s/g, "").length >= 13 && payment.exp && payment.cvc.length >= 3;

  return (
    <>
      <Topbar title="Order TapPoints" subtitle="Add devices, bundles, and subscriptions to your account." />

      {/* Back link + step indicator */}
      <div className="order-stepwrap">
        <button className="btn btn--sm" onClick={onBack}>← Back to TapPoints</button>
        <div className="order-steps">
          {[
            { n: 1, label: "Products" },
            { n: 2, label: "Shipping" },
            { n: 3, label: "Payment" },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <button
                type="button"
                className={"order-step " + (step === s.n ? "is-active" : step > s.n ? "is-done" : "")}
                onClick={() => { if (s.n < step) setStep(s.n); }}
              >
                <span className="order-step__num">{step > s.n ? "✓" : s.n}</span>
                <span className="order-step__label">{s.label}</span>
              </button>
              {i < arr.length - 1 && <span className={"order-step__bar" + (step > s.n ? " is-done" : "")} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="order-layout">

        {/* ─────── LEFT: per-step content ─────── */}
        <div className="order-main">

          {step === 1 && (
            <>
              {/* Catalog header */}
              <div className="card order-catalog-head">
                <div className="input-search" style={{ flex: 1 }}>
                  <span className="icon-search"><Icon.Search /></span>
                  <input placeholder="Search by product name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="order-tabs">
                  <button className={"order-tab" + (tab === "devices" ? " is-active" : "")} onClick={() => setTab("devices")}>Devices</button>
                  <button className={"order-tab" + (tab === "bundles" ? " is-active" : "")} onClick={() => setTab("bundles")}>Bundles & Subscriptions</button>
                </div>
              </div>

              {/* Helper banner on Devices tab */}
              {tab === "devices" && (
                <div className="info-banner">
                  <InfoIcon />
                  <div>
                    <div className="info-banner__title">Devices require an active subscription</div>
                    <div className="info-banner__hint">If your order doesn't include a bundle or subscription, make sure your organization has an active plan.</div>
                  </div>
                </div>
              )}

              {/* Result count */}
              <div className="order-result-count">
                {tab === "bundles" ? bundles.length : devices.length} {tab === "bundles" ? "bundle" : "product"}{(tab === "bundles" ? bundles.length : devices.length) === 1 ? "" : "s"} found
              </div>

              {/* Catalog body */}
              {tab === "bundles" && (
                <div className="order-bundle-list">
                  {bundles.map((b) => (
                    <BundleCard key={b.id} bundle={b} onAdd={addBundle} />
                  ))}
                  {bundles.length === 0 && <div className="empty-row">No bundles match your search.</div>}
                </div>
              )}

              {tab === "devices" && (
                <div className="order-device-grid">
                  {devices.map((d) => (
                    <DeviceCard key={d.sku} device={d} onOpen={() => setPreview({ sku: d.sku })} />
                  ))}
                  {devices.length === 0 && <div className="empty-row">No products match your search.</div>}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <ShippingForm shipping={shipping} setShipping={setShipping} />
          )}

          {step === 3 && (
            <PaymentForm payment={payment} setPayment={setPayment} shipping={shipping} />
          )}
        </div>

        {/* ─────── RIGHT: sticky cart ─────── */}
        <aside className="order-cart">
          <div className="card order-cart__card">
            <div className="order-cart__head">
              <h3 className="card-title" style={{ margin: 0 }}>Your Order</h3>
              <span className="pill pill--soft" style={{ fontWeight: 600 }}>{lineCount} {lineCount === 1 ? "item" : "items"}</span>
            </div>

            <div className="order-cart__body">
              {cart.length === 0 && (
                <div className="order-cart__empty">
                  <ShoppingIcon />
                  <div className="order-cart__empty-title">Your order is empty</div>
                  <div className="order-cart__empty-hint">Browse the catalog and add bundles or devices.</div>
                </div>
              )}
              {cart.map((line, i) => {
                if (line.kind === "device") {
                  const d = findDevice(line.refId);
                  const isCustom = !!line.custom;
                  return (
                    <div className="cart-line" key={i}>
                      {isCustom ? (
                        <MiniMock device={d} custom={line.custom} />
                      ) : (
                        <Glyph kind={d.glyph} color={d.color} size={40} />
                      )}
                      <div className="cart-line__main">
                        <div className="cart-line__title">
                          {d.name}
                          {isCustom && <span className="cart-line__badge">Customized</span>}
                        </div>
                        <div className="cart-line__hint">{d.kind} · {fmt$(d.price)}/ea</div>
                        <div className="cart-line__controls">
                          <QtyStepper size="sm" qty={line.qty} onChange={(q) => setLineQty(i, q)} min={0} />
                          {isCustom && (
                            <button
                              type="button"
                              className="cart-line__edit"
                              onClick={() => setPreview({ sku: line.refId, editIndex: i, initial: line.custom })}
                            >
                              <Icon.Edit /> Edit
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="cart-line__right">
                        <div className="cart-line__price">{fmt$(linePrice(line))}</div>
                        <button className="cart-line__remove" onClick={() => removeLine(i)} aria-label="Remove"><Icon.Trash /></button>
                      </div>
                    </div>
                  );
                }
                const b = CATALOG_BUNDLES.find((x) => x.id === line.refId);
                const plan = b.plans.find((p) => p.id === line.planId);
                return (
                  <div className="cart-line" key={i}>
                    <Glyph kind={b.glyph} color={b.color} size={40} />
                    <div className="cart-line__main">
                      <div className="cart-line__title">{b.name}</div>
                      <div className="cart-line__hint">Bundle · {plan.label} {fmt$(plan.price)}{plan.cycle}</div>
                      <QtyStepper size="sm" qty={line.qty} onChange={(q) => setLineQty(i, q)} min={0} />
                    </div>
                    <div className="cart-line__right">
                      <div className="cart-line__price">{fmt$(linePrice(line))}</div>
                      <button className="cart-line__remove" onClick={() => removeLine(i)} aria-label="Remove"><Icon.Trash /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="order-cart__totals">
              <div className="cart-row"><span>Subtotal</span><span>{fmt$(subtotal)}</span></div>
              <div className="cart-row"><span>Shipping</span><span>{cart.length === 0 ? "—" : fmt$(shippingCost)}</span></div>
              <div className="cart-row"><span>Estimated tax</span><span>{cart.length === 0 ? "—" : fmt$(tax)}</span></div>
              <div className="cart-row cart-row--total"><span>Total</span><span>{fmt$(total)}</span></div>
            </div>

            <div className="order-cart__actions">
              {step === 1 && (
                <button
                  className="btn btn--primary btn--block"
                  disabled={!canContinueFromProducts}
                  style={canContinueFromProducts ? null : { opacity: 0.5, pointerEvents: "none" }}
                  onClick={() => setStep(2)}
                >
                  Continue to Shipping →
                </button>
              )}
              {step === 2 && (
                <>
                  <button
                    className="btn btn--primary btn--block"
                    disabled={!canContinueFromShipping}
                    style={canContinueFromShipping ? null : { opacity: 0.5, pointerEvents: "none" }}
                    onClick={() => setStep(3)}
                  >
                    Continue to Payment →
                  </button>
                  <button className="btn btn--block" onClick={() => setStep(1)}>← Back to Products</button>
                </>
              )}
              {step === 3 && (
                <>
                  <button
                    className="btn btn--primary btn--block"
                    disabled={!canPlaceOrder}
                    style={canPlaceOrder ? null : { opacity: 0.5, pointerEvents: "none" }}
                    onClick={() => { onToast && onToast("Order placed — confirmation sent to your email"); onBack && onBack(); }}
                  >
                    Place Order · {fmt$(total)}
                  </button>
                  <button className="btn btn--block" onClick={() => setStep(2)}>← Back to Shipping</button>
                </>
              )}
              <p className="order-cart__legal">Subscriptions renew automatically. Cancel any time from the Account page.</p>
            </div>
          </div>
        </aside>

      </div>

      {preview && (
        <ProductDetailModal
          device={findDevice(preview.sku)}
          initial={preview.initial || null}
          editing={preview.editIndex != null}
          onClose={() => setPreview(null)}
          onAdd={(qty, custom) => {
            if (preview.editIndex != null) replaceLine(preview.editIndex, qty, custom);
            else addDevice(preview.sku, qty, custom);
            setPreview(null);
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Bundle card
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
function BundleCard({ bundle, onAdd }) {
  const [planId, setPlanId] = useStateOrder(bundle.defaultPlan);
  return (
    <div className="card bundle-card">
      <div className="bundle-card__head">
        <Glyph kind={bundle.glyph} color={bundle.color} size={64} />
        <div className="bundle-card__heading">
          <h3 className="bundle-card__title">{bundle.name}</h3>
          <p className="bundle-card__desc">{bundle.desc}</p>
          <div className="bundle-card__meta">
            <span className="pill pill--blue" style={{ fontSize: 10, fontWeight: 700 }}>Bundle</span>
            <span className="bundle-card__meta-dot" />
            <span className="bundle-card__meta-text">{bundle.items.length} product{bundle.items.length === 1 ? "" : "s"}</span>
            <span className="bundle-card__meta-dot" />
            <span className="bundle-card__meta-text">{bundle.plans.length} plan{bundle.plans.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className="bundle-card__price">
          <div className="bundle-card__price-num">
            {fmt$(
              (bundle.flatPrice != null
                ? bundle.flatPrice
                : bundle.items.reduce((s, it) => {
                    const d = findDevice(it.sku);
                    const u = it.unitOverride != null ? it.unitOverride : d.price;
                    return s + u * it.qty * (1 - (it.discountPct || 0) / 100);
                  }, 0)) +
                (bundle.plans.find((p) => p.id === planId)?.price || 0)
            )}
          </div>
          <div className="bundle-card__price-hint">starting price</div>
        </div>
      </div>

      <div className="bundle-card__divider" />

      <div className="bundle-card__included">
        <div className="bundle-card__section-label">What's included</div>
        <div className="bundle-card__items">
          {bundle.items.map((it, i) => {
            const d = findDevice(it.sku);
            const unit = it.unitOverride != null ? it.unitOverride : d.price;
            const gross = unit * it.qty;
            const net = gross * (1 - (it.discountPct || 0) / 100);
            return (
              <div className="bundle-card__item" key={i}>
                <Glyph kind={d.glyph} color={d.color} size={32} />
                <div className="bundle-card__item-main">
                  <div className="bundle-card__item-title">
                    <strong>{it.qty}×</strong> {d.name}
                  </div>
                  <div className="bundle-card__item-hint">{fmt$(unit)} each</div>
                </div>
                <div className="bundle-card__item-price">
                  {it.discountPct === 100 ? <span className="pill pill--green" style={{ fontSize: 10, fontWeight: 700 }}>Included</span> : fmt$(net)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {bundle.plans.length > 1 && (
        <div className="bundle-card__plans">
          <div className="bundle-card__section-label">Choose a plan</div>
          <div className="plan-grid">
            {bundle.plans.map((p) => (
              <button
                key={p.id}
                type="button"
                className={"plan-card" + (planId === p.id ? " is-on" : "")}
                onClick={() => setPlanId(p.id)}
              >
                <span className="plan-card__dot"></span>
                <div className="plan-card__main">
                  <div className="plan-card__name">{p.label}</div>
                  <div className="plan-card__hint">{p.hint}</div>
                </div>
                <div className="plan-card__price">{fmt$(p.price)}<span className="plan-card__cycle">{p.cycle}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {bundle.plans.length === 1 && (
        <div className="bundle-card__plan-single">
          <span className="plan-card__dot is-on"></span>
          <span style={{ fontWeight: 600 }}>{bundle.plans[0].label}</span>
          <span style={{ color: "var(--ink-600)" }}>· {fmt$(bundle.plans[0].price)}{bundle.plans[0].cycle}</span>
        </div>
      )}

      <div className="bundle-card__foot">
        <button className="btn btn--primary" onClick={() => onAdd(bundle.id, planId)}>
          <Icon.Plus /> Add to Order
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Device card
// ─────────────────────────────────────────────────────────────
function DeviceCard({ device, onOpen }) {
  return (
    <button type="button" className="card device-card" onClick={onOpen}>
      <div className="device-card__preview">
        <div className="device-card__hero">
          <Glyph kind={device.glyph} color={device.color} size={210} />
        </div>
      </div>
      <div className="device-card__body">
        <div className="device-card__name">{device.name}</div>
        <div className="device-card__price">{fmt$(device.price)}<span className="device-card__cycle">/ea</span></div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Product detail modal
// ─────────────────────────────────────────────────────────────
function ProductDetailModal({ device, onClose, onAdd, initial, editing }) {
  const [qty, setQty] = useStateOrder(initial?.qty || 1);
  const [color, setColor] = useStateOrder(device.colorOptions[0]);
  const [orientation, setOrientation] = useStateOrder(initial?.orientation || "portrait");
  const [bg, setBg] = useStateOrder(initial?.bg || "#FFFFFF");
  const [bgImage, setBgImage] = useStateOrder(initial?.bgImage || null);
  const [overlay, setOverlay] = useStateOrder(initial?.overlay || "none");
  const [logo, setLogo] = useStateOrder(initial?.logo || null);
  const [logoSize, setLogoSize] = useStateOrder(initial?.logoSize || 50);
  const [text, setText] = useStateOrder(initial?.text || "");
  const [markColor, setMarkColor] = useStateOrder(initial?.markColor || "auto");
  const [headshot, setHeadshot] = useStateOrder(initial?.headshot || null);
  const [template, setTemplate] = useStateOrder(initial?.template || "centered");
  const [hubMarkColor, setHubMarkColor] = useStateOrder(initial?.hubMarkColor || "#FFFFFF");
  const fileHeadshotRef = React.useRef(null);
  const fileLogoRef = React.useRef(null);
  const fileBgRef = React.useRef(null);

  const handleFile = (e, setter) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setter(ev.target.result);
    r.readAsDataURL(f);
  };

  const PALETTE = ["#141d23", "#FFFFFF", "#0b59b2", "#7434c2", "#1c8a36", "#E07C2A", "#B00020", "#E2C49A"];
  const OVERLAYS = [
    { id: "none",   label: "None",   color: "transparent" },
    { id: "soft",   label: "Soft",   color: "rgba(0,0,0,0.20)" },
    { id: "dark",   label: "Dark",   color: "rgba(0,0,0,0.45)" },
    { id: "light",  label: "Light",  color: "rgba(255,255,255,0.30)" },
    { id: "tinted", label: "Tinted", color: "rgba(116,52,194,0.35)" },
  ];

  const showCustomization = device.customizable;
  const isHub = device.sku === "tp-hub";
  const tone = (hex) => {
    if (!hex) return "#000";
    const c = hex.replace("#", "");
    if (c.length < 6) return "#000";
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 165 ? "#141d23" : "#fff";
  };

  const showTemplates = device.sku === "tp-card-personal";
  const PERSONAL_TEMPLATES = [
    { id: "centered",  label: "Centered",  hint: "Headshot mid, logo bottom" },
    { id: "spotlight", label: "Spotlight", hint: "Large headshot, small logo" },
    { id: "compact",   label: "Compact",   hint: "Headshot upper, logo lower" },
  ];

  // Preview shape: card | sticker | sign
  const previewShape = device.glyph === "sticker" ? "sticker" : device.glyph === "sign" ? "sign" : "card";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-modal__close" onClick={onClose} aria-label="Close">×</button>

        <div className="product-modal__grid">
          {/* ─── Live preview ─── */}
          <div className={"product-preview product-preview--" + previewShape + (orientation === "landscape" ? " is-landscape" : "")}>
            {isHub ? (
              <div className="hub-mock">
                <span className="hub-mock__tint" style={{ background: hubMarkColor }} />
                <img className="hub-mock__base" src="assets/hub-base.png" alt="" />
              </div>
            ) : !showCustomization ? (
              <div className="product-preview__image">
                <Glyph kind={device.glyph} color={device.color} size={320} />
              </div>
            ) : (
              <div className="product-preview__stage">
                <div
                  className={"product-mock product-mock--" + previewShape + (showTemplates ? " product-mock--tpl-" + template : "")}
                  style={{
                    background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bg,
                    color: tone(bg),
                  }}
                >
                  {/* overlay layer */}
                  <div className="product-mock__overlay" style={{ background: OVERLAYS.find((o) => o.id === overlay).color }} />

                  {/* TapIn mark — center, hidden on hub and sign (which have their own preview/shape) */}
                  {(previewShape === "card" || previewShape === "sticker") && (
                    <img
                      className={"product-mock__mark" + (previewShape === "sticker" ? " product-mock__mark--sticker" : "")}
                      src={(markColor === "auto" ? (tone(bg) === "#fff" ? "white" : "dark") : markColor) === "white" ? "assets/tapin-mark-white.png" : "assets/tapin-mark-dark.png"}
                      alt=""
                    />
                  )}

                  {/* headshot (personal card templates only) */}
                  {showTemplates && (
                    headshot
                      ? <img className="product-mock__headshot" src={headshot} alt="" />
                      : <div className="product-mock__headshot product-mock__headshot--placeholder" aria-hidden="true">
                          <svg viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="16" r="6" fill="currentColor" opacity="0.5" />
                            <path d="M8 32c2-7 7-10 12-10s10 3 12 10" fill="currentColor" opacity="0.5" />
                          </svg>
                          <span>Headshot</span>
                        </div>
                  )}

                  {/* logo */}
                  {logo
                    ? <img className="product-mock__logo" src={logo} alt="" style={{ width: logoSize + "%" }} />
                    : (previewShape === "card" || previewShape === "sign") && (
                      <div className="product-mock__logo product-mock__logo--placeholder" aria-hidden="true">
                        <svg viewBox="0 0 64 24" fill="none">
                          <rect x="1" y="1" width="62" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.55" />
                        </svg>
                        <span>Your logo</span>
                      </div>
                    )
                  }

                  {/* text */}
                  {text && <div className="product-mock__text">{text}</div>}
                </div>
              </div>
            )}
          </div>

          {/* ─── Info + customize panel ─── */}
          <div className="product-info">
            <div>
              <span className="pill pill--soft" style={{ fontWeight: 600, fontSize: 11 }}>{device.kind}</span>
            </div>
            <h2 className="product-info__title">{device.name}</h2>

            <div className="product-info__price">{fmt$(device.price)}<span className="product-info__price-cycle">/ea</span></div>
            <div className="product-info__shipping">
              <a href="#" onClick={(e) => e.preventDefault()}>Shipping</a> calculated at checkout
            </div>

            {showCustomization && (
              <>
                <div className="product-info__divider" />
                {isHub && (
                  <div className="custom-field">
                    <label className="custom-field__label">TapIn logo color</label>
                    <div className="swatch-row">
                      <div className="hex-picker">
                        <label className="hex-picker__swatch-label" aria-label="Pick a color">
                          <span className="hex-picker__swatch" style={{ background: hubMarkColor }} />
                          <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(hubMarkColor) ? hubMarkColor : "#FFFFFF"}
                            onChange={(e) => setHubMarkColor(e.target.value)}
                            className="hex-picker__native"
                          />
                        </label>
                        <span className="hex-picker__prefix">#</span>
                        <input
                          type="text"
                          className="hex-picker__input"
                          value={hubMarkColor.replace("#", "").toUpperCase()}
                          onChange={(e) => setHubMarkColor("#" + e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase())}
                          placeholder="FFFFFF"
                          maxLength={6}
                          spellCheck={false}
                        />
                      </div>
                    </div>
                    <p className="custom-field__hint">Pick the color of the TapIn logo on the front of your Hub.</p>
                  </div>
                )}
                {!isHub && showTemplates && (
                  <>
                    <div className="custom-field">
                      <label className="custom-field__label">Template</label>
                      <div className="template-grid">
                        {PERSONAL_TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={"template-card template-card--" + t.id + (template === t.id ? " is-on" : "")}
                            onClick={() => setTemplate(t.id)}
                          >
                            <div className="template-card__preview">
                              <div className="template-card__mark"></div>
                              <div className="template-card__head"></div>
                              <div className="template-card__logo"></div>
                            </div>
                            <div className="template-card__label">{t.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="custom-field">
                      <label className="custom-field__label">Headshot</label>
                      <div className="logo-row">
                        {headshot ? (
                          <>
                            <img src={headshot} className="logo-row__preview" alt="" style={{ borderRadius: 999 }} />
                            <button type="button" className="btn btn--sm" onClick={() => {
                              if (fileHeadshotRef.current) {
                                fileHeadshotRef.current.value = "";
                                fileHeadshotRef.current.click();
                              }
                            }}>Replace</button>
                            <button type="button" className="btn btn--sm" onClick={() => setHeadshot(null)}>Remove</button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="logo-row__upload" onClick={() => {
                              if (fileHeadshotRef.current) {
                                fileHeadshotRef.current.value = "";
                                fileHeadshotRef.current.click();
                              }
                            }}>
                              <UploadIcon /> <span>Upload headshot</span>
                            </button>
                            <span className="custom-field__hint">Square photo works best</span>
                          </>
                        )}
                        <input ref={fileHeadshotRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e, setHeadshot)} />
                      </div>
                    </div>
                  </>
                )}
                {!isHub && (<>
                <div className="custom-field">
                  <label className="custom-field__label">Background <span className="custom-field__sublabel">{bgImage ? "Custom image" : null}</span></label>
                  <div className="swatch-row">
                    <div className="hex-picker">
                      <label className="hex-picker__swatch-label" aria-label="Pick a color">
                        <span className="hex-picker__swatch" style={{ background: bg }} />
                        <input
                          type="color"
                          value={/^#[0-9a-fA-F]{6}$/.test(bg) ? bg : "#0b59b2"}
                          onChange={(e) => { setBg(e.target.value); setBgImage(null); }}
                          className="hex-picker__native"
                        />
                      </label>
                      <span className="hex-picker__prefix">#</span>
                      <input
                        type="text"
                        className="hex-picker__input"
                        value={bg.replace("#", "").toUpperCase()}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
                          setBg("#" + raw);
                          setBgImage(null);
                        }}
                        placeholder="0B59B2"
                        maxLength={6}
                        spellCheck={false}
                      />
                    </div>
                    <button
                      type="button"
                      className={"swatch swatch--upload" + (bgImage ? " is-on" : "")}
                      onClick={() => {
                        if (fileBgRef.current) {
                          fileBgRef.current.value = "";
                          fileBgRef.current.click();
                        }
                      }}
                      aria-label="Upload background image"
                    >
                      <UploadIcon />
                    </button>
                    <input ref={fileBgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e, setBgImage)} />
                    {bgImage && (
                      <button type="button" className="link-btn" onClick={() => setBgImage(null)}>Clear image</button>
                    )}
                  </div>
                </div>

                {!isHub && previewShape !== "sign" && (
                <div className="custom-field">
                  <label className="custom-field__label">TapIn icon color</label>
                  <div className="radio-group">
                    {[
                      { id: "auto",  label: "Auto",  hint: "Based on background" },
                      { id: "white", label: "White", hint: null },
                      { id: "dark",  label: "Black", hint: null },
                    ].map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={"radio-card" + (markColor === o.id ? " is-on" : "")}
                        onClick={() => setMarkColor(o.id)}
                      >
                        <span className="radio-card__dot"></span>
                        <span className="radio-card__label">{o.label}</span>
                        {o.hint && <span className="radio-card__hint">{o.hint}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                )}
                </>)}

                {previewShape === "card" && !isHub && !showTemplates && (
                  <div className="custom-field">
                    <label className="custom-field__label">Orientation</label>
                    <div className="radio-group">
                      {["portrait", "landscape"].map((o) => (
                        <button key={o} type="button" className={"radio-card" + (orientation === o ? " is-on" : "")} onClick={() => setOrientation(o)}>
                          <span className="radio-card__dot"></span>
                          <span className="radio-card__label" style={{ textTransform: "capitalize" }}>{o}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isHub && (
                <div className="custom-field">
                  <label className="custom-field__label">Logo</label>
                  <div className="logo-row">
                    {logo ? (
                      <>
                        <img src={logo} className="logo-row__preview" alt="" />
                        <button type="button" className="btn btn--sm" onClick={() => fileLogoRef.current && fileLogoRef.current.click()}>Replace</button>
                        <button type="button" className="btn btn--sm" onClick={() => setLogo(null)}>Remove</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="logo-row__upload" onClick={() => fileLogoRef.current && fileLogoRef.current.click()}>
                          <UploadIcon /> <span>Upload logo</span>
                        </button>
                        <span className="custom-field__hint">PNG or SVG, transparent background recommended</span>
                      </>
                    )}
                    <input ref={fileLogoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e, setLogo)} />
                  </div>
                  {logo && (
                    <div className="logo-size">
                      <span className="logo-size__label">Size</span>
                      <input
                        type="range"
                        min="20"
                        max="90"
                        step="1"
                        value={logoSize}
                        onChange={(e) => setLogoSize(parseInt(e.target.value, 10))}
                        className="logo-size__range"
                      />
                      <span className="logo-size__value">{logoSize}%</span>
                    </div>
                  )}
                </div>
                )}
              </>
            )}

            <div className="product-info__divider" />

            <div className="custom-field">
              <label className="custom-field__label">Quantity</label>
              <QtyStepper qty={qty} onChange={setQty} min={1} />
            </div>

            <ul className="product-bullets">
              <li><LeafIcon /> Unlimited Usage</li>
              <li><PhoneIcon2 /> iOS & Android Compatible</li>
              <li><GlobeIcon /> Worldwide Shipping</li>
              <li><LockIcon2 /> Secure & Trusted</li>
              <li className="product-bullets__stock"><span className="dot dot--green" /> In stock, ready to ship</li>
            </ul>

            <button
              className="btn btn--primary btn--block btn--lg"
              onClick={() => onAdd(qty, showCustomization ? { bg, bgImage, overlay, orientation, logo, logoSize, text, markColor, template, headshot } : null)}
            >
              <Icon.Plus /> {editing ? "Update order line" : "Add to Order"} · {fmt$(device.price * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mini mock for cart line preview ────────────────────────
function MiniMock({ device, custom }) {
  const shape = device.glyph === "sticker" ? "sticker" : device.glyph === "sign" ? "sign" : "card";
  const bg = custom.bg || "#0b59b2";
  const c = (bg || "#000").replace("#", "");
  const lum = c.length >= 6
    ? (parseInt(c.slice(0,2),16)*0.299 + parseInt(c.slice(2,4),16)*0.587 + parseInt(c.slice(4,6),16)*0.114)
    : 0;
  const isLight = lum > 165;
  const mc = custom.markColor || "auto";
  const markSrc = (mc === "auto" ? (isLight ? "dark" : "white") : mc) === "white"
    ? "assets/tapin-mark-white.png" : "assets/tapin-mark-dark.png";
  const tplClass = device.sku === "tp-card-personal" && custom.template ? " mini-mock--tpl-" + custom.template : "";
  const sticker = shape === "sticker";
  const markStroke = (mc === "auto" ? (isLight ? "#141d23" : "#fff") : mc === "white" ? "#fff" : "#141d23");
  return (
    <div className={"mini-mock mini-mock--" + shape + (custom.orientation === "landscape" ? " is-landscape" : "") + tplClass}
         style={{ background: custom.bgImage ? `url(${custom.bgImage}) center/cover no-repeat` : bg }}>
      {!sticker && <img className="mini-mock__mark" src={markSrc} alt="" />}
      {sticker && <img className="mini-mock__mark mini-mock__mark--sticker" src={markSrc} alt="" />}
      {custom.headshot && <img className="mini-mock__headshot" src={custom.headshot} alt="" />}
      {custom.logo && <img className="mini-mock__logo" src={custom.logo} alt="" style={{ width: Math.min(80, custom.logoSize || 50) + "%" }} />}
    </div>
  );
}

// ─── Detail-modal icons ─────────────────────────────────────
function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path d="M10 14V4M5 9l5-5 5 5M3 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LeafIcon() { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 17c0-7 5-13 14-13 0 9-6 14-13 14-1 0-1-1-1-1zm0 0c3-3 7-5 11-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>; }
function PhoneIcon2() { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="6" y="2.5" width="8" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><circle cx="10" cy="15" r="0.8" fill="currentColor" /></svg>; }
function GlobeIcon() { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="M2 10h16M10 2a13 13 0 0 1 0 16M10 2a13 13 0 0 0 0 16" stroke="currentColor" strokeWidth="1.4" /></svg>; }
function LockIcon2() { return <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.6" /></svg>; }

// ─────────────────────────────────────────────────────────────
// Shipping form
// ─────────────────────────────────────────────────────────────
function ShippingForm({ shipping, setShipping }) {
  const set = (k) => (e) => setShipping({ ...shipping, [k]: e.target ? e.target.value : e });
  const methods = [
    { id: "standard",  label: "Standard",  hint: "5–7 business days",   price: 9.99 },
    { id: "express",   label: "Express",   hint: "2–3 business days",   price: 24.99 },
    { id: "overnight", label: "Overnight", hint: "Next business day",   price: 49.99 },
  ];
  return (
    <>
      <div className="card account-section">
        <div className="account-section__head">
          <div>
            <h3 className="card-title">Shipping address</h3>
            <p className="card-subtitle">Where should we send your devices?</p>
          </div>
        </div>
        <div className="account-section__body">
          <div className="account-grid">
            <div className="field"><label>Recipient name *</label><input value={shipping.recipient} onChange={set("recipient")} /></div>
            <div className="field"><label>Company</label><input value={shipping.company} onChange={set("company")} /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Street address *</label><input value={shipping.address1} onChange={set("address1")} placeholder="123 Main St" /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Apt, suite, etc.</label><input value={shipping.address2} onChange={set("address2")} placeholder="Optional" /></div>
            <div className="field"><label>City *</label><input value={shipping.city} onChange={set("city")} /></div>
            <div className="field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label>State *</label><input value={shipping.state} onChange={set("state")} placeholder="NY" maxLength="3" /></div>
              <div><label>ZIP *</label><input value={shipping.zip} onChange={set("zip")} placeholder="10001" /></div>
            </div>
            <div className="field"><label>Country</label><input value={shipping.country} onChange={set("country")} /></div>
            <div className="field"><label>Phone</label><input value={shipping.phone} onChange={set("phone")} placeholder="+1 (555) 555-0100" /></div>
          </div>
        </div>
      </div>

      <div className="card account-section" style={{ marginTop: 16 }}>
        <div className="account-section__head">
          <div>
            <h3 className="card-title">Delivery method</h3>
            <p className="card-subtitle">Choose how fast to receive your order.</p>
          </div>
        </div>
        <div className="account-section__body">
          <div className="ship-methods">
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                className={"ship-method" + (shipping.method === m.id ? " is-on" : "")}
                onClick={() => setShipping({ ...shipping, method: m.id })}
              >
                <span className="ship-method__dot"></span>
                <div className="ship-method__main">
                  <div className="ship-method__title">{m.label}</div>
                  <div className="ship-method__hint">{m.hint}</div>
                </div>
                <div className="ship-method__price">{fmt$(m.price)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Payment form
// ─────────────────────────────────────────────────────────────
function PaymentForm({ payment, setPayment, shipping }) {
  const set = (k) => (e) => setPayment({ ...payment, [k]: e.target ? e.target.value : e });
  const setBilling = (k) => (e) => setPayment({ ...payment, billing: { ...(payment.billing || {}), [k]: e.target.value } });
  const formatCardNum = (v) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  const billing = payment.billing || { address1: "", address2: "", city: "", state: "", zip: "", country: "United States" };
  return (
    <>
      <div className="card account-section">
        <div className="account-section__head">
          <div>
            <h3 className="card-title">Payment method</h3>
            <p className="card-subtitle">All transactions are secure and encrypted.</p>
          </div>
          <div className="payment-icons">
            <span className="pay-icon">VISA</span>
            <span className="pay-icon">MC</span>
            <span className="pay-icon">AMEX</span>
          </div>
        </div>
        <div className="account-section__body">
          <div className="account-grid">
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Name on card *</label>
              <input value={payment.cardName} onChange={set("cardName")} placeholder="Joe Bloggs" />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Card number *</label>
              <input
                value={payment.cardNumber}
                onChange={(e) => setPayment({ ...payment, cardNumber: formatCardNum(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                maxLength="23"
                inputMode="numeric"
              />
            </div>
            <div className="field"><label>Expiry *</label><input value={payment.exp} onChange={set("exp")} placeholder="MM/YY" maxLength="5" /></div>
            <div className="field"><label>CVC *</label><input value={payment.cvc} onChange={(e) => setPayment({ ...payment, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" maxLength="4" /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>PO number (optional)</label>
              <input value={payment.poNumber} onChange={set("poNumber")} placeholder="For invoicing reference" />
            </div>
          </div>
        </div>
      </div>

      <div className="card account-section" style={{ marginTop: 16 }}>
        <div className="account-section__head">
          <div>
            <h3 className="card-title">Billing address</h3>
            <p className="card-subtitle">Where the card statement is sent.</p>
          </div>
        </div>
        <div className="account-section__body" style={{ paddingTop: 0 }}>
          <div className="ship-methods" style={{ marginBottom: payment.billingSame ? 0 : 14 }}>
            <button
              type="button"
              className={"ship-method" + (payment.billingSame ? " is-on" : "")}
              onClick={() => setPayment({ ...payment, billingSame: true })}
            >
              <span className="ship-method__dot"></span>
              <div className="ship-method__main">
                <div className="ship-method__title">Same as shipping address</div>
                <div className="ship-method__hint">{shipping.address1 ? shipping.address1 + ", " + shipping.city + ", " + shipping.state + " " + shipping.zip : "Use the shipping address you entered"}</div>
              </div>
            </button>
            <button
              type="button"
              className={"ship-method" + (!payment.billingSame ? " is-on" : "")}
              onClick={() => setPayment({ ...payment, billingSame: false })}
            >
              <span className="ship-method__dot"></span>
              <div className="ship-method__main">
                <div className="ship-method__title">Use a different billing address</div>
                <div className="ship-method__hint">Enter the address that matches your card statement.</div>
              </div>
            </button>
          </div>
          {!payment.billingSame && (
            <div className="account-grid" style={{ marginTop: 6 }}>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Street address *</label><input value={billing.address1} onChange={setBilling("address1")} placeholder="123 Main St" /></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Apt, suite, etc.</label><input value={billing.address2} onChange={setBilling("address2")} placeholder="Optional" /></div>
              <div className="field"><label>City *</label><input value={billing.city} onChange={setBilling("city")} /></div>
              <div className="field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label>State *</label><input value={billing.state} onChange={setBilling("state")} placeholder="NY" maxLength="3" /></div>
                <div><label>ZIP *</label><input value={billing.zip} onChange={setBilling("zip")} placeholder="10001" /></div>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Country</label><input value={billing.country} onChange={setBilling("country")} /></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Icons local to this screen
// ─────────────────────────────────────────────────────────────
function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9.2v4.2M10 6.4v.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function ShoppingIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M9 13h26l-3 18a2 2 0 0 1-2 1.7H14a2 2 0 0 1-2-1.7L9 13z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15 13a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

Object.assign(window, { OrderScreen });
