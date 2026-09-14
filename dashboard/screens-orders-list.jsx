// Orders list — order history for the organization.
// Shows KPI tiles, filters, and a sortable table of past orders with
// a detail drawer on row click.
const { useState: useStateOL, useMemo: useMemoOL } = React;

// ─────────────────────────────────────────────────────────────
// Mock orders
// ─────────────────────────────────────────────────────────────
const ORDERS = [
  {
    id: "ORD-2026-0142",
    date: "2026-05-18",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "nhm",
    destination: "Natural History Museum, London",
    address: "Cromwell Rd, South Kensington, London SW7 5BD",
    items: [
      { sku: "tp-card-group", name: "Custom Group Card", qty: 50, unit: 15 },
      { sku: "tp-hub", name: "Custom Hub", qty: 4, unit: 75 },
    ],
    subtotal: 1050, shipping: 24.99, tax: 86, total: 1160.99,
    status: "In transit",
    method: "Express",
    tracking: "1Z999AA10123456784",
    eta: "2026-05-27",
  },
  {
    id: "ORD-2026-0138",
    date: "2026-05-10",
    placedBy: "Jane Smith",
    destinationSpaceId: "aqs",
    destination: "Aquarium of Sea",
    address: "Pier 39, San Francisco, CA 94133",
    items: [
      { sku: "tp-card-personal", name: "Custom Personal Card", qty: 12, unit: 25 },
      { sku: "tp-sticker", name: "Custom Sticker", qty: 20, unit: 15 },
    ],
    subtotal: 600, shipping: 9.99, tax: 48.80, total: 658.79,
    status: "Delivered",
    method: "Standard",
    tracking: "1Z999AA10987654321",
    eta: "2026-05-16",
    deliveredOn: "2026-05-15",
  },
  {
    id: "ORD-2026-0131",
    date: "2026-04-28",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "nwg",
    destination: "Norwich Museum",
    address: "Castle Hill, Norwich NR1 3JU",
    items: [
      { sku: "bnd-tradeshow", name: "TapIn Tradeshow Booth Bundle", qty: 1, unit: 200 },
    ],
    subtotal: 200, shipping: 49.99, tax: 20, total: 269.99,
    status: "Delivered",
    method: "Overnight",
    tracking: "1Z999AA10456789123",
    eta: "2026-04-30",
    deliveredOn: "2026-04-30",
  },
  {
    id: "ORD-2026-0124",
    date: "2026-04-15",
    placedBy: "Jane Smith",
    destinationSpaceId: "cdm",
    destination: "Cromer Discovery Museum",
    address: "East Cliff, Cromer NR27 9EZ",
    items: [
      { sku: "tp-card-group", name: "Custom Group Card", qty: 25, unit: 15 },
      { sku: "hub-sign", name: "Hub Sign", qty: 4, unit: 25 },
      { sku: "tp-card-case", name: "Card Case", qty: 10, unit: 50 },
    ],
    subtotal: 975, shipping: 9.99, tax: 78.80, total: 1063.79,
    status: "Processing",
    method: "Standard",
    tracking: null,
    eta: "2026-05-30",
  },
  {
    id: "ORD-2026-0119",
    date: "2026-04-03",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "swv",
    destination: "Seaside View",
    address: "1 The Promenade, Brighton BN1 1AA",
    items: [
      { sku: "tp-card-personal", name: "Custom Personal Card", qty: 8, unit: 25 },
    ],
    subtotal: 200, shipping: 9.99, tax: 16.80, total: 226.79,
    status: "Delivered",
    method: "Standard",
    tracking: "1Z999AA10234567891",
    eta: "2026-04-09",
    deliveredOn: "2026-04-08",
  },
  {
    id: "ORD-2026-0108",
    date: "2026-03-22",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "nhm",
    destination: "Natural History Museum, London",
    address: "Cromwell Rd, South Kensington, London SW7 5BD",
    items: [
      { sku: "tp-hub", name: "Custom Hub", qty: 2, unit: 75 },
      { sku: "tp-card-group", name: "Custom Group Card", qty: 40, unit: 15 },
    ],
    subtotal: 750, shipping: 9.99, tax: 60.80, total: 820.79,
    status: "Delivered",
    method: "Standard",
    tracking: "1Z999AA10345678912",
    eta: "2026-03-28",
    deliveredOn: "2026-03-27",
  },
  {
    id: "ORD-2026-0097",
    date: "2026-03-04",
    placedBy: "Jane Smith",
    destinationSpaceId: "aqs",
    destination: "Aquarium of Sea",
    address: "Pier 39, San Francisco, CA 94133",
    items: [
      { sku: "tp-sticker", name: "Custom Sticker", qty: 50, unit: 15 },
    ],
    subtotal: 750, shipping: 9.99, tax: 60.80, total: 820.79,
    status: "Delivered",
    method: "Standard",
    tracking: "1Z999AA10567891234",
    eta: "2026-03-10",
    deliveredOn: "2026-03-09",
  },
  {
    id: "ORD-2026-0085",
    date: "2026-02-19",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "nhm",
    destination: "Natural History Museum, London",
    address: "Cromwell Rd, South Kensington, London SW7 5BD",
    items: [
      { sku: "tp-card-group", name: "Custom Group Card", qty: 100, unit: 15 },
    ],
    subtotal: 1500, shipping: 24.99, tax: 122, total: 1646.99,
    status: "Cancelled",
    method: "Express",
    tracking: null,
    eta: null,
    cancelledOn: "2026-02-20",
    cancelReason: "Switched to bundle order",
  },
  {
    id: "ORD-2026-0078",
    date: "2026-02-08",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "nhm",
    destination: "Natural History Museum, London",
    address: "Cromwell Rd, South Kensington, London SW7 5BD",
    items: [
      { sku: "bnd-hub-events", name: "TapIn Hub with Events Subscription", qty: 2, unit: 84.99 },
      { sku: "tp-card-group", name: "Custom Group Card", qty: 120, unit: 15 },
    ],
    subtotal: 1969.98, shipping: 24.99, tax: 159.60, total: 2154.57,
    status: "Delivered",
    method: "Express",
    tracking: "1Z999AA10678912345",
    eta: "2026-02-13",
    deliveredOn: "2026-02-12",
  },
  {
    id: "ORD-2026-0064",
    date: "2026-01-23",
    placedBy: "Jane Smith",
    destinationSpaceId: "nwg",
    destination: "Norwich Museum",
    address: "Castle Hill, Norwich NR1 3JU",
    items: [
      { sku: "tp-card-personal", name: "Custom Personal Card", qty: 6, unit: 25 },
      { sku: "tp-card-case", name: "Card Case", qty: 6, unit: 50 },
    ],
    subtotal: 450, shipping: 9.99, tax: 36.80, total: 496.79,
    status: "Delivered",
    method: "Standard",
    tracking: "1Z999AA10789123456",
    eta: "2026-01-29",
    deliveredOn: "2026-01-28",
  },
  {
    id: "ORD-2026-0051",
    date: "2026-01-09",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "cdm",
    destination: "Cromer Discovery Museum",
    address: "East Cliff, Cromer NR27 9EZ",
    items: [
      { sku: "tp-hub", name: "Custom Hub", qty: 1, unit: 75 },
      { sku: "hub-sign", name: "Hub Sign", qty: 1, unit: 25 },
    ],
    subtotal: 100, shipping: 9.99, tax: 8.80, total: 118.79,
    status: "Delivered",
    method: "Standard",
    tracking: "1Z999AA10891234567",
    eta: "2026-01-15",
    deliveredOn: "2026-01-14",
  },
  {
    id: "ORD-2025-0412",
    date: "2025-12-12",
    placedBy: "Joe Bloggs",
    destinationSpaceId: "nhm",
    destination: "Natural History Museum, London",
    address: "Cromwell Rd, South Kensington, London SW7 5BD",
    items: [
      { sku: "tp-card-group", name: "Custom Group Card", qty: 80, unit: 15 },
      { sku: "tp-card-case", name: "Card Case", qty: 20, unit: 50 },
    ],
    subtotal: 2200, shipping: 24.99, tax: 178, total: 2402.99,
    status: "Delivered",
    method: "Express",
    tracking: "1Z999AA10912345678",
    eta: "2025-12-15",
    deliveredOn: "2025-12-15",
  },
];

const STATUS_PILL = {
  "Delivered":   "pill--green",
  "In transit":  "pill--blue",
  "Processing":  "pill--soft-strong",
  "Pending":     "pill--soft-strong",
  "Cancelled":   "pill--red",
};

const fmtMoney = (n) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const fmtShortDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─────────────────────────────────────────────────────────────
// Detail drawer
// ─────────────────────────────────────────────────────────────
function OrderDetailDrawer({ order, onClose, onReorder }) {
  if (!order) return null;
  const itemsCount = order.items.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 720, maxHeight: "88vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h3 className="card-title" style={{ margin: 0 }}>{order.id}</h3>
              <span className={"pill " + (STATUS_PILL[order.status] || "pill--soft")}>{order.status}</span>
            </div>
            <p className="card-subtitle" style={{ margin: 0 }}>
              Placed {fmtDate(order.date)} by {order.placedBy} · {itemsCount} {itemsCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          {/* Status timeline */}
          <div style={{ background: "var(--tapin-blue-50, #F7FCFF)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 18px" }}>
            {order.status === "Delivered" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-600)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Delivered</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", marginTop: 2 }}>{fmtDate(order.deliveredOn)}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-600)" }}>Tracking #{order.tracking}</div>
              </div>
            )}
            {order.status === "In transit" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-600)", letterSpacing: "0.04em", textTransform: "uppercase" }}>In transit · ETA {fmtDate(order.eta)}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", marginTop: 2 }}>Tracking #{order.tracking}</div>
                </div>
                <button className="btn btn--sm">Track shipment</button>
              </div>
            )}
            {order.status === "Processing" && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-600)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Processing</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", marginTop: 2 }}>Estimated ship by {fmtDate(order.eta)} · custom devices in production</div>
              </div>
            )}
            {order.status === "Cancelled" && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red-text-soft, #B12C2C)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Cancelled · {fmtDate(order.cancelledOn)}</div>
                <div style={{ fontSize: 13, color: "var(--ink-700)", marginTop: 2 }}>{order.cancelReason}</div>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-600)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>Items</div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              {order.items.map((it, i) => (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 60px 100px 100px",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: i < order.items.length - 1 ? "1px solid var(--line)" : "none",
                  fontSize: 13,
                }}>
                  <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{it.name}<div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-500)", marginTop: 2 }}>SKU {it.sku}</div></div>
                  <div style={{ color: "var(--ink-600)", textAlign: "center" }}>×{it.qty}</div>
                  <div style={{ color: "var(--ink-600)", textAlign: "right" }}>{fmtMoney(it.unit)}</div>
                  <div style={{ color: "var(--ink-900)", textAlign: "right", fontWeight: 600 }}>{fmtMoney(it.unit * it.qty)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals + ship-to grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-600)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>Ship to</div>
              <div style={{ fontSize: 13, color: "var(--ink-900)", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600 }}>{order.destination}</div>
                <div style={{ color: "var(--ink-700)" }}>{order.address}</div>
                <div style={{ color: "var(--ink-600)", marginTop: 4 }}>{order.method} shipping</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-600)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>Summary</div>
              <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-700)" }}><span>Subtotal</span><span>{fmtMoney(order.subtotal)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-700)" }}><span>Shipping</span><span>{fmtMoney(order.shipping)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-700)" }}><span>Tax</span><span>{fmtMoney(order.tax)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-900)", fontWeight: 700, borderTop: "1px solid var(--line)", paddingTop: 6, marginTop: 4 }}><span>Total</span><span>{fmtMoney(order.total)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 26px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 10 }}>
          <button className="btn">Download invoice</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={onClose}>Close</button>
            {window.__viewerRole !== "Space Admin" && (
              <button className="btn btn--primary" onClick={() => { onClose(); onReorder && onReorder(order); }}>Reorder</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────
function OrdersListScreen({ onNav, onToast }) {
  const [search, setSearch] = useStateOL("");
  const [statusFilter, setStatusFilter] = useStateOL([]);
  const [spaceFilter, setSpaceFilter] = useStateOL([]);
  const [sortBy, setSortBy] = useStateOL({ key: "date", dir: "desc" });
  const [selected, setSelected] = useStateOL(null);

  const spaces = window.DATA.SPACES;

  const filtered = useMemoOL(() => {
    let rows = ORDERS.slice();
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.destination.toLowerCase().includes(q) ||
        o.placedBy.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    if (statusFilter.length) rows = rows.filter((o) => statusFilter.includes(o.status));
    if (spaceFilter.length) rows = rows.filter((o) => spaceFilter.includes(o.destinationSpaceId));
    rows.sort((a, b) => {
      const k = sortBy.key, d = sortBy.dir === "asc" ? 1 : -1;
      if (k === "total") return (a.total - b.total) * d;
      if (k === "date") return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) * d;
      if (k === "id") return (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) * d;
      return 0;
    });
    return rows;
  }, [search, statusFilter, spaceFilter, sortBy]);

  const toggleSort = (key) => {
    setSortBy((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  };

  // KPI math (from full mock dataset, not filtered — represents lifetime org stats)
  const kpis = useMemoOL(() => {
    const now = new Date("2026-05-25");
    const ytd = ORDERS.filter((o) => o.date.startsWith("2026"));
    const totalSpendYTD = ytd.reduce((s, o) => s + o.total, 0);
    const devicesOrdered = ORDERS.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.qty, 0), 0);
    const inTransit = ORDERS.filter((o) => o.status === "In transit").length;
    const processing = ORDERS.filter((o) => o.status === "Processing").length;
    return { totalSpendYTD, devicesOrdered, inTransit, processing, ytdCount: ytd.length };
  }, []);

  const isSpaceAdmin = window.__viewerRole === "Space Admin";

  return (
    <>
      <Topbar title="Orders" subtitle="Order history and shipment status across your organization." />

      <div style={{ marginBottom: 14 }}>
        <button className="btn btn--sm" onClick={() => window.__tapinNav && window.__tapinNav("tappoints")}>← Back to TapPoints</button>
      </div>

      {/* KPI tiles */}
      <div className="orders-kpis">
        <div className="orders-kpi">
          <div className="orders-kpi__label">Total spend YTD</div>
          <div className="orders-kpi__value">{fmtMoney(kpis.totalSpendYTD)}</div>
          <div className="orders-kpi__hint">Across {kpis.ytdCount} {kpis.ytdCount === 1 ? "order" : "orders"} in 2026</div>
        </div>
        <div className="orders-kpi">
          <div className="orders-kpi__label">Devices ordered</div>
          <div className="orders-kpi__value">{kpis.devicesOrdered.toLocaleString()}</div>
          <div className="orders-kpi__hint">All-time across all spaces</div>
        </div>
        <div className="orders-kpi">
          <div className="orders-kpi__label">In transit</div>
          <div className="orders-kpi__value">{kpis.inTransit}</div>
          <div className="orders-kpi__hint">{kpis.inTransit === 0 ? "Nothing currently shipping" : "Shipments en route"}</div>
        </div>
        <div className="orders-kpi">
          <div className="orders-kpi__label">In production</div>
          <div className="orders-kpi__value">{kpis.processing}</div>
          <div className="orders-kpi__hint">{kpis.processing === 0 ? "No active custom builds" : "Custom devices being built"}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="exp-toolbar">
        <div className="input-search" style={{ flex: 1, maxWidth: 360 }}>
          <span className="icon-search"><Icon.Search /></span>
          <input placeholder="Search by order #, item, recipient" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <MultiSelect
          label="Status"
          allLabel="All statuses"
          placeholder="Filter status"
          options={["Delivered","In transit","Processing","Cancelled"].map((s) => ({ id: s, label: s }))}
          values={statusFilter}
          onChange={setStatusFilter}
        />
        <MultiSelect
          label="Space"
          allLabel="All spaces"
          placeholder="Filter space"
          options={spaces.map((s) => ({ id: s.id, label: s.name }))}
          values={spaceFilter}
          onChange={setSpaceFilter}
        />
        <div style={{ flex: 1 }} />
        <ExportButton
          tooltip="Export orders"
          options={[
            { label: "Download CSV", onClick: () => onToast && onToast("Orders exported as CSV") },
            { label: "Download PDF", onClick: () => onToast && onToast("Orders exported as PDF") },
          ]}
        />
        {isSpaceAdmin ? (
          <button className="btn" onClick={() => onToast && onToast("Permission request sent to your Organization admin")}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Request permission to order
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => window.__tapinNav && window.__tapinNav("order")}><Icon.Plus /> Place new order</button>
        )}
      </div>

      {/* Orders table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th className="sort-th" onClick={() => toggleSort("id")}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Order #
                  <span className={"sort-th__arrow" + (sortBy.key === "id" ? " is-on" : "")}>{sortBy.key === "id" && sortBy.dir === "asc" ? "▲" : "▼"}</span>
                </span>
              </th>
              <th className="sort-th" onClick={() => toggleSort("date")}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Date
                  <span className={"sort-th__arrow" + (sortBy.key === "date" ? " is-on" : "")}>{sortBy.key === "date" && sortBy.dir === "asc" ? "▲" : "▼"}</span>
                </span>
              </th>
              <th>Items</th>
              <th>Destination</th>
              <th className="sort-th" onClick={() => toggleSort("total")} style={{ textAlign: "right" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Total
                  <span className={"sort-th__arrow" + (sortBy.key === "total" ? " is-on" : "")}>{sortBy.key === "total" && sortBy.dir === "asc" ? "▲" : "▼"}</span>
                </span>
              </th>
              <th>Status</th>
              <th>Tracking / ETA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "var(--ink-500)" }}>No orders match your filters.</td></tr>
            )}
            {filtered.map((o) => {
              const itemsCount = o.items.reduce((s, i) => s + i.qty, 0);
              const space = spaces.find((s) => s.id === o.destinationSpaceId);
              const firstItem = o.items[0];
              const moreLabel = o.items.length > 1 ? ` +${o.items.length - 1} more` : "";
              return (
                <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: "pointer" }}>
                  <td>
                    <span className="link" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>{o.id}</span>
                    <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>by {o.placedBy}</div>
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--ink-800)" }}>{fmtShortDate(o.date)}<div style={{ fontSize: 11, color: "var(--ink-500)" }}>{o.date.slice(0, 4)}</div></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>{firstItem.name}<span style={{ fontWeight: 400, color: "var(--ink-500)" }}> ×{firstItem.qty}{moreLabel}</span></div>
                    <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>{itemsCount} {itemsCount === 1 ? "unit" : "units"} total</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      {space && <SpaceAvatar space={space} size={28} />}
                      <span style={{ fontSize: 13, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.destination}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--ink-900)", whiteSpace: "nowrap" }}>{fmtMoney(o.total)}</td>
                  <td><span className={"pill " + (STATUS_PILL[o.status] || "pill--soft")}>{o.status}</span></td>
                  <td style={{ fontSize: 12, color: "var(--ink-700)" }}>
                    {o.status === "Delivered" && <span>Delivered {fmtShortDate(o.deliveredOn)}</span>}
                    {o.status === "In transit" && <span style={{ color: "var(--tapin-blue)", fontWeight: 600 }}>ETA {fmtShortDate(o.eta)}</span>}
                    {o.status === "Processing" && <span>Ships by {fmtShortDate(o.eta)}</span>}
                    {o.status === "Cancelled" && <span style={{ color: "var(--ink-500)" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrderDetailDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onReorder={(o) => { onToast && onToast(`Reorder of ${o.id} started`); window.__tapinNav && window.__tapinNav("order"); }}
        />
      )}
    </>
  );
}

Object.assign(window, { OrdersListScreen });
