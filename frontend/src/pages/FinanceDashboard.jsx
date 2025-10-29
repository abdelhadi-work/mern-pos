import React, { useEffect, useMemo, useState } from 'react';
import api, { analyticsAPI, categoryAPI, authAPI } from '../api';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';

const formatCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);

const presetRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { start: start.toISOString(), end: end.toISOString() };
};

const Button = ({ children, onClick, variant = 'primary', disabled }) => {
  const [hovered, setHovered] = useState(false);
  const base = {
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 13,
    border: '1px solid',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.7 : 1,
  };
  const variants = {
    primary: {
      ...base,
      background: hovered ? '#0b1220' : '#1e293b',
      color: '#fff',
      borderColor: hovered ? '#0b1220' : '#1e293b',
      boxShadow: hovered ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
    },
    brand: {
      ...base,
      background: hovered ? '#1d4ed8' : '#2563eb',
      color: '#fff',
      borderColor: hovered ? '#1d4ed8' : '#2563eb',
      boxShadow: hovered ? '0 1px 4px rgba(37,99,235,0.35)' : 'none',
    },
    subtle: {
      ...base,
      background: hovered ? '#f8fafc' : '#ffffff',
      color: '#0f172a',
      borderColor: '#cbd5e1',
      boxShadow: hovered ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    },
    ghost: {
      ...base,
      background: hovered ? '#f8fafc' : 'transparent',
      color: '#0f172a',
      borderColor: '#cbd5e1',
    },
  };
  const style = variants[variant] || variants.primary;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

const FiltersBar = ({ filters, setFilters, categories, cashiers }) => {
  const onPreset = (d) => setFilters((f) => ({ ...f, ...presetRange(d) }));
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
      <Button variant="subtle" onClick={() => onPreset(7)}>Last 7d</Button>
      <Button variant="subtle" onClick={() => onPreset(30)}>Last 30d</Button>
      <input type="date" value={filters.start?.slice(0,10) || ''}
        onChange={(e) => {
          const d = new Date(e.target.value);
          d.setHours(0,0,0,0);
          setFilters((f) => ({ ...f, start: d.toISOString() }));
        }} />
      <input type="date" value={filters.end?.slice(0,10) || ''}
        onChange={(e) => {
          const d = new Date(e.target.value);
          d.setHours(23,59,59,999);
          setFilters((f) => ({ ...f, end: d.toISOString() }));
        }} />
      <select value={filters.status || ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="cancelled">Cancelled</option>
        <option value="refunded">Refunded</option>
      </select>
      <select value={filters.paymentMethod || ''} onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value || undefined }))}>
        <option value="">All Payments</option>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="split">Split</option>
        <option value="transfer">Transfer</option>
        <option value="credit">Credit</option>
      </select>
      <select value={filters.category || ''} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}>
        <option value="">All Categories</option>
        {(categories || []).map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
      {(cashiers?.length > 0) && (
        <select value={filters.cashier || ''} onChange={(e) => setFilters((f) => ({ ...f, cashier: e.target.value || undefined }))}>
          <option value="">All Cashiers</option>
          {cashiers.map((u) => (
            <option key={u._id} value={u._id}>{u.fullName}</option>
          ))}
        </select>
      )}
    </div>
  );
};

const KpiCards = ({ summary }) => {
  const items = [
    { label: 'Revenue', value: formatCurrency(summary?.revenue) },
    { label: 'Orders', value: summary?.ordersCount || 0 },
    { label: 'Avg Ticket', value: formatCurrency(summary?.avgTicket) },
    { label: 'Items/Order', value: (summary?.itemsPerOrder || 0).toFixed(2) },
    { label: 'Tax', value: formatCurrency(summary?.taxCollected) },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
      {items.map((k) => (
        <div key={k.label} style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#64748b', fontSize: 12 }}>{k.label}</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{k.value}</div>
        </div>
      ))}
    </div>
  );
};

const SalesTimeSeries = ({ data }) => {
  const buckets = data?.buckets || [];
  const width = 560;
  const height = 260;
  const padding = 36;
  const [hover, setHover] = React.useState(null); // { i, x, y, b }

  const salesMax = Math.max(1, ...buckets.map(b => b.sales || 0));
  const ordersMax = Math.max(1, ...buckets.map(b => b.orders || 0));
  const x = (i) => padding + (i * (width - padding * 2)) / Math.max(1, buckets.length - 1);
  const ySales = (v) => height - padding - (v / salesMax) * (height - padding * 2);
  const yOrders = (v) => height - padding - (v / ordersMax) * (height - padding * 2);
  const salesPath = buckets.map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${ySales(b.sales || 0)}`).join(' ');
  const ordersPath = buckets.map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yOrders(b.orders || 0)}`).join(' ');

  // Axis ticks (Y left for sales, Y right for orders, X minimal)
  const yTicks = 4;
  const salesTicks = Array.from({ length: yTicks + 1 }, (_, i) => ({ v: Math.round((salesMax * i) / yTicks), i }));
  const ordersTicks = Array.from({ length: yTicks + 1 }, (_, i) => ({ v: Math.round((ordersMax * i) / yTicks), i }));

  const onMouseMove = (e) => {
    if (!buckets.length) { setHover(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseXChart = mouseX * (width / rect.width);
    const positions = buckets.map((_, i) => x(i));
    let nearest = 0;
    let minDist = Infinity;
    positions.forEach((px, i) => {
      const d = Math.abs(px - mouseXChart);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    const b = buckets[nearest];
    if (!b) { setHover(null); return; }
    setHover({ i: nearest, x: x(nearest), y: ySales(b.sales || 0), b });
  };

  const onLeave = () => setHover(null);

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Sales vs Orders</div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="260" role="img" aria-label="Sales vs Orders chart" onMouseMove={onMouseMove} onMouseLeave={onLeave}>
        <rect x="0" y="0" width={width} height={height} fill="#fff" />
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" />
        <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" />
        {/* Left Y ticks (Sales) */}
        {salesTicks.map(({ v, i }) => (
          <g key={`ls-${i}-${v}`}> 
            <line x1={padding - 4} x2={padding} y1={ySales(v)} y2={ySales(v)} stroke="#cbd5e1" />
            <text x={padding - 8} y={ySales(v) + 4} fontSize="10" fill="#64748b" textAnchor="end">{v}</text>
          </g>
        ))}
        {/* Right Y ticks (Orders) */}
        {ordersTicks.map(({ v, i }) => (
          <g key={`ro-${i}-${v}`}> 
            <line x1={width - padding} x2={width - padding + 4} y1={yOrders(v)} y2={yOrders(v)} stroke="#cbd5e1" />
            <text x={width - padding + 8} y={yOrders(v) + 4} fontSize="10" fill="#64748b">{v}</text>
          </g>
        ))}
        {/* Sales line */}
        <path d={salesPath} fill="none" stroke="#2563eb" strokeWidth="2" />
        {/* Orders line */}
        <path d={ordersPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" />
        {/* Hover marker and tooltip */}
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padding} y2={height - padding} stroke="#e2e8f0" />
            <circle cx={hover.x} cy={ySales(hover.b.sales || 0)} r={3} fill="#2563eb" />
            <circle cx={hover.x} cy={yOrders(hover.b.orders || 0)} r={3} fill="#10b981" />
            <g transform={`translate(${Math.min(Math.max(hover.x + 8, padding), width - padding - 140)}, ${padding + 8})`}>
              <rect width="140" height="54" rx="6" ry="6" fill="#0f172a" opacity="0.9" />
              <text x="8" y="16" fontSize="12" fill="#e2e8f0">{hover.b.date}</text>
              <text x="8" y="32" fontSize="12" fill="#93c5fd">Sales: {formatCurrency(hover.b.sales)}</text>
              <text x="8" y="48" fontSize="12" fill="#86efac">Orders: {hover.b.orders}</text>
            </g>
          </g>
        )}
        {/* Legend */}
        <g>
          <rect x={padding} y={8} width="10" height="2" fill="#2563eb" />
          <text x={padding + 16} y={12} fontSize="12" fill="#334155">Sales</text>
          <rect x={padding + 70} y={8} width="10" height="2" fill="#10b981" />
          <text x={padding + 86} y={12} fontSize="12" fill="#334155">Orders</text>
        </g>
      </svg>
    </div>
  );
};

const PaymentMix = ({ data }) => {
  const methods = data?.methods || [];
  const total = methods.reduce((s, m) => s + (m.amount || 0), 0) || 1;
  const size = 240;
  const r = 90;
  const cx = size / 2;
  const cy = size / 2;
  const [hoverIdx, setHoverIdx] = React.useState(-1);
  let angleStart = 0;
  const colors = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];

  const arcs = methods.map((m, i) => {
    const fraction = (m.amount || 0) / total;
    const angle = fraction * Math.PI * 2;
    const angleEnd = angleStart + angle;
    const x1 = cx + r * Math.cos(angleStart);
    const y1 = cy + r * Math.sin(angleStart);
    const x2 = cx + r * Math.cos(angleEnd);
    const y2 = cy + r * Math.sin(angleEnd);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const el = { path, color: colors[i % colors.length], label: m.method, value: m.amount, pct: Math.round(fraction * 100) };
    angleStart = angleEnd;
    return el;
  });

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Payment Mix</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="240" role="img" aria-label="Payment mix">
          {arcs.map((a, idx) => (
            <path key={idx} d={a.path} fill={a.color} stroke="#fff" strokeWidth={hoverIdx === idx ? 2 : 1}
              onMouseEnter={() => setHoverIdx(idx)} onMouseLeave={() => setHoverIdx(-1)} />
          ))}
          <circle cx={cx} cy={cy} r={r * 0.55} fill="#fff" />
          {hoverIdx >= 0 && (
            <g transform={`translate(${cx - 60}, ${cy - 60})`}>
              <rect width="120" height="48" rx="6" ry="6" fill="#0f172a" opacity="0.9" />
              <text x="8" y="18" fontSize="12" fill="#e2e8f0">{arcs[hoverIdx].label}</text>
              <text x="8" y="34" fontSize="12" fill="#93c5fd">{formatCurrency(arcs[hoverIdx].value)} ({arcs[hoverIdx].pct}%)</text>
            </g>
          )}
        </svg>
        <div style={{ fontSize: 13 }}>
          {methods.map((m, i) => (
            <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 10, height: 10, background: colors[i % colors.length], display: 'inline-block', borderRadius: 2 }} />
              <span style={{ minWidth: 70, textTransform: 'capitalize' }}>{m.method}</span>
              <span>{formatCurrency(m.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OrdersTable = ({ data }) => {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Recent Orders</div>
      <div style={{ maxHeight: 280, overflow: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th align="left">Order #</th>
              <th align="left">Status</th>
              <th align="left">Payment</th>
              <th align="left">Cashier</th>
              <th align="right">Total</th>
              <th align="left">Date</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((o) => (
              <tr key={o._id}>
                <td>{o.orderNumber}</td>
                <td>{o.status}</td>
                <td>{o.paymentMethod}</td>
                <td>{o.cashier?.fullName || '-'}</td>
                <td align="right">{formatCurrency(o.total)}</td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FinanceDashboard = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = () => ({
    start: searchParams.get('start') || presetRange(30).start,
    end: searchParams.get('end') || presetRange(30).end,
    status: searchParams.get('status') || 'completed',
    paymentMethod: searchParams.get('paymentMethod') || undefined,
    category: searchParams.get('category') || undefined,
    cashier: searchParams.get('cashier') || undefined,
  });
  const [filters, setFilters] = useState(initial);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Sync filters -> URL
  useEffect(() => {
    const params = {};
    if (filters.start) params.start = filters.start;
    if (filters.end) params.end = filters.end;
    if (filters.status) params.status = filters.status;
    if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
    if (filters.category) params.category = filters.category;
    if (filters.cashier) params.cashier = filters.cashier;
    setSearchParams(params, { replace: true });
  }, [filters.start, filters.end, filters.status, filters.paymentMethod, filters.category, filters.cashier]);

  const params = useMemo(() => ({
    start: filters.start,
    end: filters.end,
    status: filters.status,
    paymentMethod: filters.paymentMethod,
    category: filters.category,
    cashier: filters.cashier,
  }), [filters.start, filters.end, filters.status, filters.paymentMethod, filters.category, filters.cashier]);

  const { data: summary, loading: loadingSummary, refetch: refetchSummary } = useFetch(() => analyticsAPI.getSummary(params), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier]);
  const { data: timeseries, refetch: refetchTimeseries } = useFetch(() => analyticsAPI.getTimeseries({ ...params, interval: 'auto' }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier]);
  const { data: paymentMix, refetch: refetchMix } = useFetch(() => analyticsAPI.getPaymentMix(params), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(10);
  const [catLimit, setCatLimit] = useState(8);
  const [prodLimit, setProdLimit] = useState(8);
  const { data: orders, refetch: refetchOrders } = useFetch(() => analyticsAPI.getOrders({ ...params, page: ordersPage, limit: ordersLimit }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, ordersPage, ordersLimit]);
  const { data: profitSummary } = useFetch(() => analyticsAPI.getProfitSummary(params), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier]);
  const { data: categoryProfit } = useFetch(() => analyticsAPI.getCategoryProfit({ ...params, limit: catLimit }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, catLimit]);
  const { data: productProfit } = useFetch(() => analyticsAPI.getProductProfit({ ...params, limit: prodLimit, sort: 'marginPct' }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, prodLimit]);

  // Fetch options for filters
  const { data: categoriesResp } = useFetch(() => categoryAPI.getAll(), []);
  const { data: usersResp } = useFetch(
    () => (user?.role === 'main_admin' ? authAPI.getUsers() : Promise.resolve({ data: { users: [] } })),
    [user?.role]
  );
  const categories = Array.isArray(categoriesResp?.categories) ? categoriesResp.categories : [];
  const cashiers = Array.isArray(usersResp?.users) ? usersResp.users.filter((u) => u.role === 'cashier') : [];

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      refetchSummary();
      refetchTimeseries();
      refetchMix();
      refetchOrders();
    }, 60000);
    return () => clearInterval(id);
  }, [autoRefresh, refetchSummary, refetchTimeseries, refetchMix, refetchOrders]);

  return (
    <div style={{ padding: 16, background: '#f5f7fa', minHeight: '100%' }}>
      <TopBar params={params} autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh} />
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 12 }}>
        <FiltersBar filters={filters} setFilters={setFilters} categories={categories} cashiers={cashiers} />
      </div>
      <KpiCards summary={summary} loading={loadingSummary} />
      {/* Profit KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#64748b', fontSize: 12 }}>Gross Profit</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{formatCurrency(profitSummary?.grossProfit)}</div>
        </div>
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#64748b', fontSize: 12 }}>COGS</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{formatCurrency(profitSummary?.cogs)}</div>
        </div>
        <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#64748b', fontSize: 12 }}>Gross Margin %</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{(profitSummary?.grossMarginPct || 0).toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div />
            <Button variant="subtle" onClick={async () => {
              const resp = await api.get('/analytics/timeseries', { params: { ...params, interval: 'auto', export: 'csv' }, responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([resp.data]));
              const a = document.createElement('a');
              a.href = url; a.download = 'timeseries.csv'; a.click();
              window.URL.revokeObjectURL(url);
            }}>Export CSV</Button>
          </div>
          <SalesTimeSeries data={timeseries} />
        </div>
        <PaymentMix data={paymentMix} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Top Categories by Margin</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" onClick={() => setCatLimit((v) => (v === 8 ? 30 : 8))}>{catLimit === 8 ? 'View All' : 'Show Less'}</Button>
              <Button variant="subtle" onClick={async () => {
              const resp = await api.get('/analytics/profit/categories', { params: { ...params, limit: 100, export: 'csv' }, responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([resp.data]));
              const a = document.createElement('a');
              a.href = url; a.download = 'category_profit.csv'; a.click();
              window.URL.revokeObjectURL(url);
              }}>Export CSV</Button>
            </div>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Category</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Revenue</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Gross Profit</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {(categoryProfit?.categories || []).map((c, idx) => {
                const [hover, setHover] = [undefined, undefined];
                return (
                  <tr
                    key={c.categoryId}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 ? '#fff' : '#f8fafc'; }}
                    style={{ background: idx % 2 ? '#fff' : '#f8fafc' }}
                  >
                    <td style={{ padding: '8px 10px' }}>{c.name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(c.revenue)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(c.grossProfit)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{(c.marginPct || 0).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>Top Products by Margin %</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" onClick={() => setProdLimit((v) => (v === 8 ? 30 : 8))}>{prodLimit === 8 ? 'View All' : 'Show Less'}</Button>
              <Button variant="subtle" onClick={async () => {
              const resp = await api.get('/analytics/profit/products', { params: { ...params, limit: 100, sort: 'marginPct', export: 'csv' }, responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([resp.data]));
              const a = document.createElement('a');
              a.href = url; a.download = 'product_profit.csv'; a.click();
              window.URL.revokeObjectURL(url);
              }}>Export CSV</Button>
            </div>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Product</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Revenue</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Gross Profit</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {(productProfit?.products || []).map((p, idx) => (
                <tr
                  key={p.productId}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 ? '#fff' : '#f8fafc'; }}
                  style={{ background: idx % 2 ? '#fff' : '#f8fafc' }}
                >
                  <td style={{ padding: '8px 10px' }}>{p.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(p.revenue)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(p.grossProfit)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{(p.marginPct || 0).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button variant="subtle" onClick={async () => {
          const resp = await api.get('/analytics/orders', { params: { ...params, page: 1, limit: 1000, export: 'csv' }, responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([resp.data]));
          const a = document.createElement('a');
          a.href = url; a.download = 'orders.csv'; a.click();
          window.URL.revokeObjectURL(url);
        }}>Export Orders CSV</Button>
      </div>
      {/* Orders export + pagination controls */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>Recent Orders</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="subtle" onClick={async () => {
              const resp = await api.get('/analytics/orders', { params: { ...params, page: 1, limit: 1000, export: 'csv' }, responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([resp.data]));
              const a = document.createElement('a');
              a.href = url; a.download = 'orders.csv'; a.click();
              window.URL.revokeObjectURL(url);
            }}>Export Orders CSV</Button>
            <select value={ordersLimit} onChange={(e) => { setOrdersLimit(parseInt(e.target.value, 10)); setOrdersPage(1); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <Button variant="ghost" onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <span style={{ fontSize: 12, color: '#475569' }}>
              Page {orders?.page || ordersPage} of {Math.max(1, Math.ceil((orders?.total || 0) / ordersLimit))}
            </span>
            <Button variant="ghost" onClick={() => {
              const total = orders?.total || 0;
              const maxPage = Math.max(1, Math.ceil(total / ordersLimit));
              setOrdersPage((p) => Math.min(maxPage, p + 1));
            }}>
              Next
            </Button>
          </div>
        </div>
        <div style={{ maxHeight: 280, overflow: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Order #</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Payment</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Cashier</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Total</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {(orders?.items || []).map((o, idx) => (
                <tr
                  key={o._id}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 ? '#fff' : '#f8fafc'; }}
                  style={{ background: idx % 2 ? '#fff' : '#f8fafc' }}
                >
                  <td style={{ padding: '8px 10px' }}>{o.orderNumber}</td>
                  <td style={{ padding: '8px 10px' }}>{o.status}</td>
                  <td style={{ padding: '8px 10px' }}>{o.paymentMethod}</td>
                  <td style={{ padding: '8px 10px' }}>{o.cashier?.fullName || '-'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(o.total)}</td>
                  <td style={{ padding: '8px 10px' }}>{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TopBar = ({ params, autoRefresh, setAutoRefresh }) => {
  const [exporting, setExporting] = useState(false);
  const handleExportAll = async () => {
    try {
      setExporting(true);
      const downloads = [
        { url: '/analytics/timeseries', name: 'timeseries.csv', params: { ...params, interval: 'auto', export: 'csv' } },
        { url: '/analytics/orders', name: 'orders.csv', params: { ...params, page: 1, limit: 1000, export: 'csv' } },
        { url: '/analytics/profit/categories', name: 'category_profit.csv', params: { ...params, limit: 100, export: 'csv' } },
        { url: '/analytics/profit/products', name: 'product_profit.csv', params: { ...params, limit: 100, sort: 'marginPct', export: 'csv' } },
      ];
      for (const d of downloads) {
        const resp = await api.get(d.url, { params: d.params, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([resp.data]));
        const a = document.createElement('a');
        a.href = url; a.download = d.name; a.click();
        window.URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 16px' }}>
      <h2 style={{ margin: 0 }}>Finance Dashboard</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 13, color: '#475569' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh (60s)
        </label>
        <Button onClick={handleExportAll} variant="primary" disabled={exporting}>{exporting ? 'Exporting…' : 'Export All CSV'}</Button>
      </div>
    </div>
  );
};

export default FinanceDashboard;


