// // FILE: client/src/pages/Reports.jsx
// // ============================================
// import React from 'react';
// import Chart from '../components/Chart';
// import '../styles/dashboard.css';

// const Reports = () => {
//   return (
//     <div className="reports-page">
//       <div className="page-header">
//         <h2>Financial Reports</h2>
//         <div className="report-filters">
//           <select className="filter-select">
//             <option>This Month</option>
//             <option>Last Month</option>
//             <option>This Year</option>
//           </select>
//           <button className="btn-primary">Export PDF</button>
//         </div>
//       </div>

//       <div className="reports-grid">
//         <div className="report-card">
//           <h3>Revenue Overview</h3>
//           <div className="report-value">$125,430</div>
//           <div className="report-change positive">+12.5% from last month</div>
//         </div>
        
//         <div className="report-card">
//           <h3>Total Orders</h3>
//           <div className="report-value">1,247</div>
//           <div className="report-change positive">+8.3% from last month</div>
//         </div>
        
//         <div className="report-card">
//           <h3>Average Order Value</h3>
//           <div className="report-value">$100.58</div>
//           <div className="report-change negative">-2.1% from last month</div>
//         </div>
        
//         <div className="report-card">
//           <h3>Profit Margin</h3>
//           <div className="report-value">34.2%</div>
//           <div className="report-change positive">+1.5% from last month</div>
//         </div>
//       </div>

//       <div className="charts-section">
//         <Chart title="Monthly Sales Trend" />
//         <Chart title="Category Performance" />
//         <Chart title="Payment Methods" />
//       </div>
//     </div>
//   );
// };

// export default Reports;






// ============================================
// FILE: client/src/pages/Reports.jsx
// ============================================
import React, { useEffect, useMemo, useState } from "react";
import { Download, Printer, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { orderAPI, authAPI } from "../api";
import "../styles/dashboard.css";
import "../styles/reports.css";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const startOfDay = (date) => new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString();
const endOfDay = (date) => new Date(new Date(date).setHours(23, 59, 59, 999)).toISOString();

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const QuickRanges = ({ onRange, dateFrom, dateTo }) => {
  const t = todayISO();
  const firstDayMonth = new Date();
  firstDayMonth.setDate(1);
  const firstDayMonthISO = firstDayMonth.toISOString().slice(0, 10);

  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay(); // Sun=0
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  })();

  const presets = [
    { label: "Today", from: t, to: t },
    { label: "This Week", from: weekStart, to: t },
    { label: "This Month", from: firstDayMonthISO, to: t },
    { label: "Last 7 Days", from: addDays(t, -6), to: t },
    { label: "Last 30 Days", from: addDays(t, -29), to: t },
  ];

  return (
    <div className="quick-range-group">
      {presets.map((preset) => {
        const isActive = preset.from === dateFrom && preset.to === dateTo;
        return (
          <button
            type="button"
            key={preset.label}
            className={`quick-range${isActive ? " is-active" : ""}`}
            onClick={() => onRange(preset.from, preset.to)}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
};

const Reports = () => {
  // Tabs: "invoices" | "products"
  const [activeTab, setActiveTab] = useState("invoices");

  // Filters
  const [dateFrom, setDateFrom] = useState(todayISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [cashiers, setCashiers] = useState([]);
  const [cashierId, setCashierId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");

  // Data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Expand states (C3)
  const [openDays, setOpenDays] = useState(() => new Set());     // keys = YYYY-MM-DD
  const [openRows, setOpenRows] = useState(() => new Set());     // keys = order._id

  // ---- Summary KPI (invoices) ----
  const summary = useMemo(() => {
    const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    return { count: orders.length, total, avg: orders.length ? total / orders.length : 0 };
  }, [orders]);

  // ---- Grouped by day ----
  const grouped = useMemo(() => {
    const byDay = {};
    for (const o of orders) {
      const dayKey = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(o);
    }
    const sortedKeys = Object.keys(byDay).sort((a, b) => (a < b ? 1 : -1));
    return { byDay, sortedKeys };
  }, [orders]);

  // ---- Product Sales (A1) aggregated from orders.items ----
  const productSales = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      if (!o?.items) continue;
      for (const it of o.items) {
        const key = it.product?._id || it.product || it.name; // robust key
        const name = it.name || it.product?.name || "Unnamed";
        const qty = Number(it.quantity || 0);
        // Prefer row total if provided, else price * qty
        const revenue = Number(
          (it.total != null ? it.total : (it.price || 0) * qty) || 0
        );

        if (!map.has(key)) {
          map.set(key, { key, name, qty: 0, revenue: 0, ordersCount: 0 });
        }
        const row = map.get(key);
        row.qty += qty;
        row.revenue += revenue;
        row.ordersCount += 1;
      }
    }
    const rows = Array.from(map.values());
    rows.sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);
    return rows;
  }, [orders]);

  const productTotals = useMemo(() => {
    const totalQty = productSales.reduce((s, r) => s + r.qty, 0);
    const totalRevenue = productSales.reduce((s, r) => s + r.revenue, 0);
    return { totalQty, totalRevenue };
  }, [productSales]);

  // ---- Fetchers ----
  const fetchUsers = async () => {
    try {
      const res = await authAPI.getUsers();
      if (res?.data?.users) {
        const onlyCashiers = res.data.users.filter((u) => !!u.role);
        setCashiers(onlyCashiers);
      }
    } catch { /* silent */ }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        start: startOfDay(dateFrom),
        end: endOfDay(dateTo),
        cashier: cashierId || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        limit: 1000,
      };
      const res = await orderAPI.getAll(params);
      setOrders(res?.data?.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchOrders(); }, [dateFrom, dateTo, cashierId, paymentMethod, status]);

  // ---- Handlers ----
  const handleQuickRange = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const exportCSV = () => {
    const rows = [
      ["Order #","Date","Time","Cashier","Payment","Status","Subtotal","Discount","Tax","Total","Items"],
      ...orders.map((o) => [
        o.orderNumber || o._id,
        fmtDate(o.createdAt),
        fmtTime(o.createdAt),
        o.cashier?.fullName || o.cashier?.username || "—",
        o.paymentMethod,
        o.status,
        (o.subtotal ?? 0).toFixed(2),
        (o.discount?.amount ?? 0).toFixed(2),
        (o.tax?.amount ?? 0).toFixed(2),
        (o.total ?? 0).toFixed(2),
        o.items?.length ?? 0,
      ]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Expand helpers (C3) ----
  const toggleDay = (dayKey) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      next.has(dayKey) ? next.delete(dayKey) : next.add(dayKey);
      return next;
    });
  };
  const toggleRow = (id) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ---- UI ----
  const rangeLabel = `${fmtDate(dateFrom)} → ${fmtDate(dateTo)}`;
  const heroSubtitle =
    activeTab === "invoices"
      ? "Track daily invoice performance and cash desk activity with a classic ledger-inspired view."
      : "Review product momentum, revenue mix, and order cadence across the catalogue.";

  const heroMetrics = activeTab === "invoices"
    ? [
        { label: "Invoices", value: summary.count.toLocaleString() },
        { label: "Gross Total", value: `$${summary.total.toFixed(2)}` },
        { label: "Average Ticket", value: `$${summary.avg.toFixed(2)}` },
      ]
    : [
        { label: "Units Sold", value: productTotals.totalQty.toLocaleString() },
        { label: "Revenue", value: `$${productTotals.totalRevenue.toFixed(2)}` },
        { label: "Unique SKUs", value: productSales.length.toLocaleString() },
      ];

  return (
    <div className="reports-page">
      <section className="reports-hero">
        <div className="reports-hero__copy">
          <span className="reports-hero__eyebrow">Business Intelligence</span>
          <h1 className="reports-hero__title">Operational Reports</h1>
          <p className="reports-hero__subtitle">{heroSubtitle}</p>
          <p className="reports-hero__range">{rangeLabel}</p>
        </div>
        <div className="reports-hero__panel">
          <QuickRanges onRange={handleQuickRange} dateFrom={dateFrom} dateTo={dateTo} />
          <div className="reports-hero__meta">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="reports-hero__stat">
                <span className="reports-hero__stat-label">{metric.label}</span>
                <span className="reports-hero__stat-value">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="reports-toolbar">
        <nav className="reports-tabs" aria-label="Report views">
          <button
            type="button"
            className={`reports-tab${activeTab === "invoices" ? " is-active" : ""}`}
            onClick={() => setActiveTab("invoices")}
          >
            Invoices
          </button>
          <button
            type="button"
            className={`reports-tab${activeTab === "products" ? " is-active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Product Sales
          </button>
        </nav>

        <div className="reports-toolbar__actions">
          <button type="button" className="btn-secondary" onClick={fetchOrders} title="Refresh">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </button>
          {activeTab === "invoices" && (
            <button type="button" className="btn-primary" onClick={exportCSV}>
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="report-filters reports-filter-grid">
        <div>
          <label className="filter-label">From</label>
          <input type="date" className="filter-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="filter-label">To</label>
          <input type="date" className="filter-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div>
          <label className="filter-label">Cashier</label>
          <select className="filter-select" value={cashierId} onChange={(e) => setCashierId(e.target.value)}>
            <option value="">All</option>
            {cashiers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.fullName || c.username} ({c.role})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="filter-label">Payment</label>
          <select className="filter-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="split">Split</option>
            <option value="transfer">Transfer</option>
            <option value="credit">Credit</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="filter-label">Status</label>
          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="partial_refund">Partial Refund</option>
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {activeTab === "invoices" ? (
        <>
          {/* KPI Cards */}
          <div className="reports-grid reports-kpi-grid">
            <div className="report-card">
              <h3>Total Invoices</h3>
              <div className="report-value">{summary.count}</div>
            </div>
            <div className="report-card">
              <h3>Total Amount</h3>
              <div className="report-value">${summary.total.toFixed(2)}</div>
            </div>
            <div className="report-card">
              <h3>Average Invoice</h3>
              <div className="report-value">${summary.avg.toFixed(2)}</div>
            </div>
          </div>

          {/* C3: Expandable Day → Invoices → Items */}
          <div className="reports-section">
            {loading ? (
              <div className="report-card">
                <div className="reports-empty">Loading invoices…</div>
              </div>
            ) : grouped.sortedKeys.length === 0 ? (
              <div className="report-card">
                <div className="reports-empty">No invoices for this range.</div>
              </div>
            ) : (
              grouped.sortedKeys.map((day) => {
                const list = grouped.byDay[day].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const dayTotal = list.reduce((s, o) => s + Number(o.total || 0), 0);
                const isOpen = openDays.has(day);

                return (
                  <div key={day} className={`report-card report-card--accordion${isOpen ? " is-open" : ""}`}>
                    <button type="button" onClick={() => toggleDay(day)} className="accordion-trigger">
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <span>{fmtDate(day)}</span>
                      <span className="accordion-trigger__meta">
                        <span>{list.length} invoices</span>
                        <span>Total ${dayTotal.toFixed(2)}</span>
                      </span>
                    </button>

                    {/* Invoices Table */}
                    {isOpen && (
                      <div className="reports-table-wrapper">
                        <table className="data-table reports-table">
                          <thead>
                            <tr>
                              <th></th>
                              <th style={{ whiteSpace: "nowrap" }}>Order #</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Cashier</th>
                              <th>Payment</th>
                              <th>Status</th>
                              <th style={{ textAlign: "right" }}>Subtotal</th>
                              <th style={{ textAlign: "right" }}>Discount</th>
                              <th style={{ textAlign: "right" }}>Tax</th>
                              <th style={{ textAlign: "right" }}>Total</th>
                              <th style={{ textAlign: "center" }}>Items</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((o) => {
                              const rowOpen = openRows.has(o._id);
                              return (
                                <React.Fragment key={o._id}>
                                  <tr>
                                    <td style={{ width: 36 }}>
                                      <button
                                        type="button"
                                        className="reports-table-toggle"
                                        onClick={() => toggleRow(o._id)}
                                        title={rowOpen ? "Hide items" : "Show items"}
                                      >
                                        {rowOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                    </td>
                                    <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                                      {o.orderNumber || o._id.slice(-8).toUpperCase()}
                                    </td>
                                    <td>{fmtDate(o.createdAt)}</td>
                                    <td>{fmtTime(o.createdAt)}</td>
                                    <td>{o.cashier?.fullName || o.cashier?.username || "—"}</td>
                                    <td style={{ textTransform: "capitalize" }}>{o.paymentMethod}</td>
                                    <td style={{ textTransform: "capitalize" }}>{o.status}</td>
                                    <td style={{ textAlign: "right" }}>${(o.subtotal ?? 0).toFixed(2)}</td>
                                    <td style={{ textAlign: "right" }}>${(o.discount?.amount ?? 0).toFixed(2)}</td>
                                    <td style={{ textAlign: "right" }}>${(o.tax?.amount ?? 0).toFixed(2)}</td>
                                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                                      ${(o.total ?? 0).toFixed(2)}
                                    </td>
                                    <td style={{ textAlign: "center" }}>{o.items?.length ?? 0}</td>
                                  </tr>

                                  {/* Items Row */}
                                  {rowOpen && (
                                    <tr>
                                      <td colSpan={12} className="reports-subtable">
                                        <div className="reports-table-wrapper">
                                          {o.items?.length ? (
                                            <table className="data-table">
                                              <thead>
                                                <tr>
                                                  <th>Item</th>
                                                  <th>Price</th>
                                                  <th>Qty</th>
                                                  <th style={{ textAlign: "right" }}>Line Total</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {o.items.map((it, idx) => (
                                                  <tr key={idx}>
                                                    <td style={{ maxWidth: 420 }}>
                                                      {it.name || it.product?.name || "—"}
                                                    </td>
                                                    <td>${Number(it.price ?? 0).toFixed(2)}</td>
                                                    <td>{Number(it.quantity ?? 0)}</td>
                                                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                                                      ${Number(
                                                        it.total != null ? it.total : (it.price || 0) * (it.quantity || 0)
                                                      ).toFixed(2)}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          ) : (
                                            <em>No items</em>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        // ===== Product Sales (A1 Simple Table) =====
        <div className="reports-section">
          {/* KPIs for products */}
          <div className="reports-grid reports-kpi-grid">
            <div className="report-card">
              <h3>Total Items Sold</h3>
              <div className="report-value">
                {productTotals.totalQty.toLocaleString()}
              </div>
            </div>
            <div className="report-card">
              <h3>Total Revenue</h3>
              <div className="report-value">
                ${productTotals.totalRevenue.toFixed(2)}
              </div>
            </div>
            <div className="report-card">
              <h3>Unique Products</h3>
              <div className="report-value">{productSales.length.toLocaleString()}</div>
            </div>
          </div>

          <div className="report-card report-card--table">
            <div className="reports-card__header">
              <h3>Product Sales</h3>
              <div className="reports-meta-list">
                <span>{rangeLabel}</span>
                <span>{productSales.length} items</span>
              </div>
            </div>
            <div className="reports-card__body">
              <div className="reports-table-wrapper">
                <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th style={{ textAlign: "right" }}>Units Sold</th>
                    <th style={{ textAlign: "right" }}>Revenue</th>
                    <th style={{ textAlign: "right" }}>Avg Price</th>
                    <th style={{ textAlign: "right" }}>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="reports-empty">Loading…</div>
                        </td>
                      </tr>
                  ) : productSales.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="reports-empty">No product sales in this range.</div>
                        </td>
                      </tr>
                  ) : (
                    productSales.map((r, i) => {
                      const avg = r.qty ? r.revenue / r.qty : 0;
                      return (
                        <tr key={r.key}>
                          <td>{i + 1}</td>
                          <td>{r.name}</td>
                          <td style={{ textAlign: "right" }}>{r.qty}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>${r.revenue.toFixed(2)}</td>
                          <td style={{ textAlign: "right" }}>${avg.toFixed(2)}</td>
                          <td style={{ textAlign: "right" }}>{r.ordersCount}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
