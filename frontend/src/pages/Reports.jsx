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

const QuickRanges = ({ onRange }) => {
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

  // return (
  //   <div className="report-filters" style={{ gap: 8, flexWrap: "wrap" }}>
  //     <button className="btn-primary" onClick={() => onRange(t, t)}>Today</button>
  //     <button className="btn-secondary" onClick={() => onRange(weekStart, t)}>This Week</button>
  //     <button className="btn-secondary" onClick={() => onRange(firstDayMonthISO, t)}>This Month</button>
  //     <button className="btn-secondary" onClick={() => onRange(addDays(t, -6), t)}>Last 7 Days</button>
  //     <button className="btn-secondary" onClick={() => onRange(addDays(t, -29), t)}>Last 30 Days</button>
  //   </div>
  // );
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
  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header" style={{ gap: 12 }}>
        <h2>Reports</h2>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={activeTab === "invoices" ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab("invoices")}
          >
            Invoices
          </button>
          <button
            className={activeTab === "products" ? "btn-primary" : "btn-secondary"}
            onClick={() => setActiveTab("products")}
          >
            Product Sales
          </button>
        </div>

        {/* Quick Ranges */}
        <QuickRanges onRange={handleQuickRange} />

        {/* Actions */}
        {activeTab === "invoices" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn-secondary" onClick={fetchOrders} title="Refresh">
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              <Printer size={16} />
              Print
            </button>
            <button className="btn-primary" onClick={exportCSV}>
              <Download size={16} />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Filters Row (shared) */}
      <div
        className="report-filters"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          alignItems: "end",
        }}
      >
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
          <div className="reports-grid" style={{ marginTop: 16 }}>
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
          <div className="reports-section" style={{ marginTop: 16 }}>
            {loading ? (
              <div className="report-card"><p>Loading invoices…</p></div>
            ) : grouped.sortedKeys.length === 0 ? (
              <div className="report-card"><p>No invoices for this range.</p></div>
            ) : (
              grouped.sortedKeys.map((day) => {
                const list = grouped.byDay[day].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const dayTotal = list.reduce((s, o) => s + Number(o.total || 0), 0);
                const isOpen = openDays.has(day);

                return (
                  <div key={day} className="report-card" style={{ padding: 0 }}>
                    {/* Day header (click to toggle) */}
                    <button
                      onClick={() => toggleDay(day)}
                      className="report-card"
                      style={{
                        borderBottomLeftRadius: isOpen ? 0 : undefined,
                        borderBottomRightRadius: isOpen ? 0 : undefined,
                        margin: 0,
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <h3 style={{ marginBottom: 0 }}>
                        {fmtDate(day)} • {list.length} invoices • Total ${dayTotal.toFixed(2)}
                      </h3>
                    </button>

                    {/* Invoices Table */}
                    {isOpen && (
                      <div style={{ overflowX: "auto" }}>
                        <table className="data-table" style={{ width: "100%" }}>
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
                                        className="btn-secondary"
                                        onClick={() => toggleRow(o._id)}
                                        title={rowOpen ? "Hide items" : "Show items"}
                                        style={{ padding: "2px 6px" }}
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
                                      <td colSpan={12} style={{ background: "var(--table-alt,#fafafa)" }}>
                                        <div style={{ padding: 12 }}>
                                          {o.items?.length ? (
                                            <table className="data-table" style={{ width: "100%" }}>
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
        <div className="reports-section" style={{ marginTop: 16 }}>
          {/* KPIs for products */}
          <div className="reports-grid" style={{ marginBottom: 16 }}>
            <div className="report-card">
              <h3>Total Items Sold</h3>
              <div className="report-value">
                {productSales.reduce((s, r) => s + r.qty, 0)}
              </div>
            </div>
            <div className="report-card">
              <h3>Total Revenue</h3>
              <div className="report-value">
                ${productSales.reduce((s, r) => s + r.revenue, 0).toFixed(2)}
              </div>
            </div>
            <div className="report-card">
              <h3>Unique Products</h3>
              <div className="report-value">{productSales.length}</div>
            </div>
          </div>

          <div className="report-card" style={{ padding: 0 }}>
            <div className="report-card" style={{ margin: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
              <h3 style={{ marginBottom: 0 }}>
                Product Sales • {fmtDate(dateFrom)} → {fmtDate(dateTo)}
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%" }}>
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
                    <tr><td colSpan={6}>Loading…</td></tr>
                  ) : productSales.length === 0 ? (
                    <tr><td colSpan={6}>No product sales in this range.</td></tr>
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
      )}
    </div>
  );
};

export default Reports;
