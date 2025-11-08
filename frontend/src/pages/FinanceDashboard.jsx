import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api, { analyticsAPI, categoryAPI, authAPI, branchAPI, expenseAPI } from '../api';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useDebounce } from '../hooks/useDebounce';
import '../styles/reports.css';

const formatCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);

const presetRange = (days) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { start: start.toISOString(), end: end.toISOString() };
};

const onQuickRange = (type, setFilters) => {
  const now = new Date();
  let start, end;
  
  if (type === 'today') {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'yesterday') {
    start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'mtd') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'ytd') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'last90') {
    start = new Date(now);
    start.setDate(start.getDate() - 89);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }
  
  setFilters((f) => ({ ...f, start: start.toISOString(), end: end.toISOString() }));
};

const Button = ({ children, onClick, variant = 'primary', disabled, className = '' }) => {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClass} ${className}`}
      style={{ 
        borderRadius: '999px',
        paddingInline: '18px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        ...(variant === 'primary' && { background: '#0f172a' }),
        ...(disabled && { opacity: 0.7, cursor: 'not-allowed' })
      }}
    >
      {children}
    </button>
  );
};

const FiltersBar = ({ filters, setFilters, categories, cashiers, branches }) => {
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('financeFilterPresets') || '[]');
    } catch {
      return [];
    }
  });
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presetName, setPresetName] = useState('');

  const onPreset = (d) => setFilters((f) => ({ ...f, ...presetRange(d) }));
  
  const onQuickRange = (type) => {
    const now = new Date();
    let start, end;
    
    if (type === 'today') {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'yesterday') {
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'mtd') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'last90') {
      start = new Date(now);
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    }
    
    setFilters((f) => ({ ...f, start: start.toISOString(), end: end.toISOString() }));
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset = { name: presetName.trim(), filters: { ...filters } };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('financeFilterPresets', JSON.stringify(updated));
    setPresetName('');
    setShowPresetMenu(false);
  };

  const loadPreset = (preset) => {
    setFilters(preset.filters);
    setShowPresetMenu(false);
  };

  const deletePreset = (idx) => {
    const updated = savedPresets.filter((_, i) => i !== idx);
    setSavedPresets(updated);
    localStorage.setItem('financeFilterPresets', JSON.stringify(updated));
  };

  return (
    <>
      <div>
        <label className="filter-label">Date From</label>
        <input 
          type="date" 
          value={filters.start?.slice(0,10) || ''}
          onChange={(e) => {
            const d = new Date(e.target.value);
            d.setHours(0,0,0,0);
            setFilters((f) => ({ ...f, start: d.toISOString() }));
          }} 
        />
      </div>
      <div>
        <label className="filter-label">Date To</label>
        <input 
          type="date" 
          value={filters.end?.slice(0,10) || ''}
          onChange={(e) => {
            const d = new Date(e.target.value);
            d.setHours(23,59,59,999);
            setFilters((f) => ({ ...f, end: d.toISOString() }));
          }} 
        />
      </div>
      <div>
        <label className="filter-label">Status</label>
        <select className="filter-select" value={filters.status || ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <div>
        <label className="filter-label">Payment Method</label>
        <select className="filter-select" value={filters.paymentMethod || ''} onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value || undefined }))}>
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="split">Split</option>
          <option value="transfer">Transfer</option>
          <option value="credit">Credit</option>
        </select>
      </div>
      <div>
        <label className="filter-label">Category</label>
        <select className="filter-select" value={filters.category || ''} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}>
          <option value="">All Categories</option>
          {(categories || []).map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>
      {(cashiers?.length > 0) && (
        <div>
          <label className="filter-label">Cashier</label>
          <select className="filter-select" value={filters.cashier || ''} onChange={(e) => setFilters((f) => ({ ...f, cashier: e.target.value || undefined }))}>
            <option value="">All Cashiers</option>
            {cashiers.map((u) => (
              <option key={u._id} value={u._id}>{u.fullName}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="filter-label">Branch</label>
        <select className="filter-select" value={filters.branch || ''} onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value || undefined }))}>
          <option value="">All Branches</option>
          {(branches || []).map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      </div>
      
      {/* Filter Presets */}
      <div style={{ position: 'relative' }}>
        <label className="filter-label">Presets</label>
        <button 
          className="btn-secondary" 
          onClick={() => setShowPresetMenu(!showPresetMenu)}
          style={{ 
            width: '100%',
            borderRadius: '12px',
            padding: '12px 14px',
            fontWeight: 600,
            letterSpacing: '0.03em'
          }}
        >
          📌 Saved {savedPresets.length > 0 && `(${savedPresets.length})`}
        </button>
        {showPresetMenu && (
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            marginTop: 8, 
            background: '#fff', 
            border: '1px solid #cbd5e1', 
            borderRadius: 8, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
            padding: 12, 
            minWidth: 280,
            zIndex: 1000
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Save Current Filters</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input 
                type="text" 
                placeholder="Preset name..." 
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                style={{ flex: 1, padding: '6px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4 }}
              />
              <button 
                className="btn-primary" 
                onClick={savePreset} 
                disabled={!presetName.trim()}
                style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600 }}
              >
                Save
              </button>
            </div>
            {savedPresets.length > 0 && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                  Saved Presets
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {savedPresets.map((preset, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: '#f8fafc',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      <span 
                        onClick={() => loadPreset(preset)}
                        style={{ cursor: 'pointer', flex: 1, color: '#2563eb', fontWeight: 500 }}
                      >
                        {preset.name}
                      </span>
                      <button
                        onClick={() => deletePreset(idx)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: '#ef4444', 
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontSize: 14
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {savedPresets.length === 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                No saved presets yet
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const KpiCards = React.memo(({ summary }) => {
  const items = useMemo(() => [
    { label: 'Revenue', value: formatCurrency(summary?.revenue) },
    { label: 'Orders', value: summary?.ordersCount || 0 },
    { label: 'Avg Ticket', value: formatCurrency(summary?.avgTicket) },
    { label: 'Items/Order', value: (summary?.itemsPerOrder || 0).toFixed(2) },
    { label: 'Tax', value: formatCurrency(summary?.taxCollected) },
  ], [summary]);
  
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
});

const SalesTimeSeries = React.memo(({ data }) => {
  const buckets = data?.buckets || [];
  const width = 560;
  const height = 260;
  const padding = 36;
  const [hover, setHover] = React.useState(null); // { i, x, y, b }

  const { salesMax, ordersMax, salesPath, ordersPath, x, ySales, yOrders } = useMemo(() => {
    const salesMax = Math.max(1, ...buckets.map(b => b.sales || 0));
    const ordersMax = Math.max(1, ...buckets.map(b => b.orders || 0));
    const x = (i) => padding + (i * (width - padding * 2)) / Math.max(1, buckets.length - 1);
    const ySales = (v) => height - padding - (v / salesMax) * (height - padding * 2);
    const yOrders = (v) => height - padding - (v / ordersMax) * (height - padding * 2);
    const salesPath = buckets.map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${ySales(b.sales || 0)}`).join(' ');
    const ordersPath = buckets.map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yOrders(b.orders || 0)}`).join(' ');
    return { salesMax, ordersMax, salesPath, ordersPath, x, ySales, yOrders };
  }, [buckets, width, height, padding]);

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
});

const PaymentMix = React.memo(({ data }) => {
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
});

const OrdersTable = React.memo(({ data }) => {
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
});

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
    branch: searchParams.get('branch') || undefined,
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
    if (filters.branch) params.branch = filters.branch;
    setSearchParams(params, { replace: true });
  }, [filters.start, filters.end, filters.status, filters.paymentMethod, filters.category, filters.cashier, filters.branch]);

  // Debounce filters to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 300);
  
  const params = useMemo(() => ({
    start: debouncedFilters.start,
    end: debouncedFilters.end,
    status: debouncedFilters.status,
    paymentMethod: debouncedFilters.paymentMethod,
    category: debouncedFilters.category,
    cashier: debouncedFilters.cashier,
    branch: debouncedFilters.branch,
  }), [debouncedFilters.start, debouncedFilters.end, debouncedFilters.status, debouncedFilters.paymentMethod, debouncedFilters.category, debouncedFilters.cashier, debouncedFilters.branch]);

  const { data: summary, loading: loadingSummary, refetch: refetchSummary } = useFetch(() => analyticsAPI.getSummary(params), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch]);
  const { data: timeseries, refetch: refetchTimeseries } = useFetch(() => analyticsAPI.getTimeseries({ ...params, interval: 'auto' }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch]);
  const { data: paymentMix, refetch: refetchMix } = useFetch(() => analyticsAPI.getPaymentMix(params), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(10);
  const [catLimit, setCatLimit] = useState(8);
  const [prodLimit, setProdLimit] = useState(8);
  const [expensePage, setExpensePage] = useState(1);
  const [expenseLimit, setExpenseLimit] = useState(6);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const { data: orders, refetch: refetchOrders } = useFetch(() => analyticsAPI.getOrders({ ...params, page: ordersPage, limit: ordersLimit }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch, ordersPage, ordersLimit]);
  const { data: profitSummary } = useFetch(() => analyticsAPI.getProfitSummary(params), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch]);
  const { data: categoryProfit } = useFetch(() => analyticsAPI.getCategoryProfit({ ...params, limit: catLimit }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch, catLimit]);
  const { data: productProfit } = useFetch(() => analyticsAPI.getProductProfit({ ...params, limit: prodLimit, sort: 'marginPct' }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch, prodLimit]);
  const { data: inventoryMetrics } = useFetch(() => analyticsAPI.getInventoryMetrics({ start: params.start, end: params.end, branch: params.branch }), [params.start, params.end, params.branch]);
  const { data: expensesData, refetch: refetchExpenses } = useFetch(() => expenseAPI.getAll({ ...params, page: expensePage, limit: expenseLimit }), [params.start, params.end, params.status, params.paymentMethod, params.category, params.cashier, params.branch, expensePage, expenseLimit]);
  
  // Phase 4: Advanced Analytics
  const { data: cashflowData } = useFetch(() => analyticsAPI.getCashflow(params), [params.start, params.end, params.branch]);
  const { data: comparativeData } = useFetch(() => params.start && params.end ? analyticsAPI.getComparative(params) : Promise.resolve(null), [params.start, params.end, params.branch]);
  const { data: alertsData } = useFetch(() => analyticsAPI.getAlerts({ branch: params.branch }), [params.branch]);

  // Fetch options for filters
  const { data: categoriesResp } = useFetch(() => categoryAPI.getAll(), []);
  const { data: usersResp } = useFetch(
    () => (user?.role === 'main_admin' ? authAPI.getUsers() : Promise.resolve({ data: { users: [] } })),
    [user?.role]
  );
  const categories = Array.isArray(categoriesResp?.categories) ? categoriesResp.categories : [];
  const cashiers = Array.isArray(usersResp?.users) ? usersResp.users.filter((u) => u.role === 'cashier') : [];
  
  // Fetch branches
  const { data: branchesResp } = useFetch(() => branchAPI.getAll(), []);
  const branches = Array.isArray(branchesResp?.branches) ? branchesResp.branches : [];

  const profitCards = useMemo(() => [
    { label: 'Gross Profit', value: formatCurrency(profitSummary?.grossProfit) },
    { label: 'COGS', value: formatCurrency(profitSummary?.cogs) },
    { label: 'Gross Margin %', value: `${(profitSummary?.grossMarginPct || 0).toFixed(1)}%` },
    { label: 'Expenses', value: formatCurrency(profitSummary?.expenses) },
    { label: 'Net Profit', value: formatCurrency(profitSummary?.netProfit) },
    { label: 'Net Margin %', value: `${(profitSummary?.netMarginPct || 0).toFixed(1)}%` },
    { label: 'Stock Value', value: formatCurrency(inventoryMetrics?.currentStockValue) },
    { label: 'Inventory Turnover', value: `${inventoryMetrics?.inventoryTurnover || 0}×` },
    { label: 'Days of Inventory', value: `${inventoryMetrics?.daysOfInventory || 0}d` },
  ], [profitSummary, inventoryMetrics]);

  const expensesItems = useMemo(() => expensesData?.items || [], [expensesData]);
  const expensesTotal = useMemo(() => expensesData?.total || 0, [expensesData]);
  const expensesPages = useMemo(() => Math.max(1, Math.ceil(expensesTotal / expenseLimit)), [expensesTotal, expenseLimit]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      refetchSummary();
      refetchTimeseries();
      refetchMix();
      refetchOrders();
      refetchExpenses();
    }, 60000);
    return () => clearInterval(id);
  }, [autoRefresh, refetchSummary, refetchTimeseries, refetchMix, refetchOrders, refetchExpenses]);

  return (
    <div className="reports-page">
      {/* Hero Section */}
      <div className="reports-hero">
        <div className="reports-hero__copy">
          <div className="reports-hero__eyebrow">Financial Intelligence</div>
          <h1 className="reports-hero__title">Finance Dashboard</h1>
          <p className="reports-hero__subtitle">
            Real-time business performance metrics with advanced analytics, cashflow tracking, and automated alerts.
          </p>
          {filters.start && filters.end && (
            <div className="reports-hero__range">
              {new Date(filters.start).toLocaleDateString()} — {new Date(filters.end).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="reports-hero__panel">
          <div className="quick-range-group">
            <button className="quick-range" onClick={() => setFilters((f) => ({ ...f, ...presetRange(7) }))}>Last 7d</button>
            <button className="quick-range" onClick={() => setFilters((f) => ({ ...f, ...presetRange(30) }))}>Last 30d</button>
            <button className="quick-range" onClick={() => onQuickRange('today', setFilters)}>Today</button>
            <button className="quick-range" onClick={() => onQuickRange('mtd', setFilters)}>MTD</button>
            <button className="quick-range" onClick={() => onQuickRange('ytd', setFilters)}>YTD</button>
          </div>
          <div className="reports-hero__meta">
            <div className="reports-hero__stat">
              <span className="reports-hero__stat-label">Revenue</span>
              <div className="reports-hero__stat-value">{formatCurrency(summary?.revenue)}</div>
            </div>
            <div className="reports-hero__stat">
              <span className="reports-hero__stat-label">Orders</span>
              <div className="reports-hero__stat-value">{summary?.ordersCount || 0}</div>
            </div>
            <div className="reports-hero__stat">
              <span className="reports-hero__stat-label">Avg Order</span>
              <div className="reports-hero__stat-value">{formatCurrency(summary?.avgOrderValue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="report-filters">
        <div className="reports-filter-grid">
          <FiltersBar filters={filters} setFilters={setFilters} categories={categories} cashiers={cashiers} branches={branches} />
        </div>
      </div>

      {/* Auto-refresh & Export Actions */}
      <div className="reports-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span>Auto-refresh (60s)</span>
          </label>
        </div>
        <div className="reports-toolbar__actions">
          <TopBar params={params} autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="reports-grid reports-kpi-grid">
        {[
          { label: 'Revenue', value: formatCurrency(summary?.revenue) },
          { label: 'Orders', value: summary?.ordersCount || 0 },
          { label: 'Avg Order', value: formatCurrency(summary?.avgOrderValue) },
          { label: 'Items Sold', value: summary?.itemsSold || 0 },
        ].map((k) => (
          <div key={k.label} className="report-card">
            <h3>{k.label}</h3>
            <div className="report-value">{k.value}</div>
          </div>
        ))}
      </div>
      {/* Profit & Inventory KPIs */}
      <div className="reports-grid reports-kpi-grid" style={{ marginTop: 24 }}>
        {profitCards.map((card) => (
          <div key={card.label} className="report-card">
            <h3>{card.label}</h3>
            <div className="report-value">{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div />
            <button 
              className="btn-secondary" 
              onClick={async () => {
                const resp = await api.get('/analytics/timeseries', { params: { ...params, interval: 'auto', export: 'csv' }, responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([resp.data]));
                const a = document.createElement('a');
                a.href = url; a.download = 'timeseries.csv'; a.click();
                window.URL.revokeObjectURL(url);
              }}
              style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
            >
              Export CSV
            </button>
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
              <button 
                className="btn-secondary" 
                onClick={() => setCatLimit((v) => (v === 8 ? 30 : 8))}
                style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                {catLimit === 8 ? 'View All' : 'Show Less'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={async () => {
                  const resp = await api.get('/analytics/profit/categories', { params: { ...params, limit: 100, export: 'csv' }, responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([resp.data]));
                  const a = document.createElement('a');
                  a.href = url; a.download = 'category_profit.csv'; a.click();
                  window.URL.revokeObjectURL(url);
                }}
                style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                Export CSV
              </button>
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
              <button 
                className="btn-secondary" 
                onClick={() => setProdLimit((v) => (v === 8 ? 30 : 8))}
                style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                {prodLimit === 8 ? 'View All' : 'Show Less'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={async () => {
                  const resp = await api.get('/analytics/profit/products', { params: { ...params, limit: 100, sort: 'marginPct', export: 'csv' }, responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([resp.data]));
                  const a = document.createElement('a');
                  a.href = url; a.download = 'product_profit.csv'; a.click();
                  window.URL.revokeObjectURL(url);
                }}
                style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                Export CSV
              </button>
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
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>Recent Expenses</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              className="btn-secondary" 
              onClick={async () => {
                const resp = await api.get('/expenses', { params: { ...params, page: 1, limit: 1000, export: 'csv' }, responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([resp.data]));
                const a = document.createElement('a');
                a.href = url; a.download = 'expenses.csv'; a.click();
                window.URL.revokeObjectURL(url);
              }}
              style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
            >
              Export Expenses CSV
            </button>
            <select value={expenseLimit} onChange={(e) => { setExpenseLimit(parseInt(e.target.value, 10)); setExpensePage(1); }}>
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <button 
              className="btn-secondary" 
              onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
              style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
            >
              Prev
            </button>
            <span style={{ fontSize: 12, color: '#475569' }}>
              Page {expensesData?.page || expensePage} of {expensesPages}
            </span>
            <button 
              className="btn-secondary" 
              onClick={() => setExpensePage((p) => Math.min(expensesPages, p + 1))}
              style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
            >
              Next
            </button>
          </div>
        </div>
        <div style={{ maxHeight: 260, overflow: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Date</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Category</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Branch</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Payment</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#334155', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {expensesItems.map((expense, idx) => (
                <tr
                  key={expense._id}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 ? '#fff' : '#f8fafc'; }}
                  style={{ background: idx % 2 ? '#fff' : '#f8fafc' }}
                >
                  <td style={{ padding: '8px 10px' }}>{expense.date ? new Date(expense.date).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '8px 10px' }}>{expense.category}</td>
                  <td style={{ padding: '8px 10px' }}>{expense.description || '-'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(expense.amount)}</td>
                  <td style={{ padding: '8px 10px' }}>{expense.branch?.name || '—'}</td>
                  <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{expense.paymentMethod || '—'}</td>
                  <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{expense.status || '—'}</td>
                </tr>
              ))}
              {expensesItems.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px 10px', textAlign: 'center', color: '#64748b' }}>No expenses found for this range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Orders export + pagination controls */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>Recent Orders</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button 
              className="btn-secondary" 
              onClick={async () => {
                const resp = await api.get('/analytics/orders', { params: { ...params, page: 1, limit: 1000, export: 'csv' }, responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([resp.data]));
                const a = document.createElement('a');
                a.href = url; a.download = 'orders.csv'; a.click();
                window.URL.revokeObjectURL(url);
              }}
              style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
            >
              Export Orders CSV
            </button>
            <select value={ordersLimit} onChange={(e) => { setOrdersLimit(parseInt(e.target.value, 10)); setOrdersPage(1); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button 
              className="btn-secondary" 
              onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
              style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
            >
              Prev
            </button>
            <span style={{ fontSize: 12, color: '#475569' }}>
              Page {orders?.page || ordersPage} of {Math.max(1, Math.ceil((orders?.total || 0) / ordersLimit))}
            </span>
            <button 
              className="btn-secondary" 
              onClick={() => {
                const total = orders?.total || 0;
                const maxPage = Math.max(1, Math.ceil(total / ordersLimit));
                setOrdersPage((p) => Math.min(maxPage, p + 1));
              }}
              style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
            >
              Next
            </button>
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

      {/* Phase 4: Alerts Panel */}
      {alertsData?.alerts && alertsData.alerts.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔔 Alerts & Notifications</span>
              <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                {alertsData.count}
              </span>
            </div>
            {alertsData.alerts.length > 5 && (
              <button 
                className="btn-secondary" 
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                {showAllAlerts ? 'Show Less' : `View All (${alertsData.count})`}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(showAllAlerts ? alertsData.alerts : alertsData.alerts.slice(0, 5)).map((alert, idx) => {
              const colors = {
                critical: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
                high: { bg: '#fed7aa', border: '#ea580c', text: '#9a3412' },
                medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
                low: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
              };
              const c = colors[alert.severity] || colors.medium;
              return (
                <div key={idx} style={{ 
                  padding: 10, 
                  borderRadius: 6, 
                  background: c.bg, 
                  borderLeft: `4px solid ${c.border}`,
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: c.text, fontWeight: 500 }}>{alert.message}</span>
                    <span style={{ 
                      fontSize: 10, 
                      textTransform: 'uppercase', 
                      fontWeight: 600, 
                      color: c.text,
                      background: '#fff',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {showAllAlerts && alertsData.alerts.length > 10 && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setShowAllAlerts(false)}
                style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
              >
                Collapse Alerts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase 4: Comparative Analytics */}
      {comparativeData && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>📊 Period Comparison</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Revenue', current: comparativeData.current.revenue, prev: comparativeData.previous.revenue, change: comparativeData.changes.revenue },
              { label: 'Orders', current: comparativeData.current.orders, prev: comparativeData.previous.orders, change: comparativeData.changes.orders },
              { label: 'Avg Order Value', current: comparativeData.current.avgOrderValue, prev: comparativeData.previous.avgOrderValue, change: comparativeData.changes.avgOrderValue }
            ].map((metric) => {
              const isPositive = metric.change >= 0;
              const arrow = isPositive ? '↑' : '↓';
              const changeColor = isPositive ? '#10b981' : '#ef4444';
              return (
                <div key={metric.label} style={{ padding: 12, background: '#f8fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{metric.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
                    {metric.label.includes('Order') || metric.label.includes('Revenue') ? formatCurrency(metric.current) : metric.current}
                  </div>
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: changeColor, fontWeight: 600 }}>
                      {arrow} {Math.abs(metric.change).toFixed(1)}%
                    </span>
                    <span style={{ color: '#94a3b8' }}>vs previous period</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase 4: Cashflow Analysis */}
      {cashflowData?.timeline && cashflowData.timeline.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>💰 Cashflow Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total Inflow', value: formatCurrency(cashflowData.summary.totalInflow), color: '#10b981' },
              { label: 'Total Outflow', value: formatCurrency(cashflowData.summary.totalOutflow), color: '#ef4444' },
              { label: 'Net Cashflow', value: formatCurrency(cashflowData.summary.netCashflow), color: cashflowData.summary.netCashflow >= 0 ? '#10b981' : '#ef4444' },
              { label: 'Burn Rate (Daily)', value: formatCurrency(cashflowData.summary.burnRate), color: '#f59e0b' }
            ].map((kpi) => (
              <div key={kpi.label} style={{ padding: 10, background: '#f8fafc', borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          <CashflowChart data={cashflowData.timeline} />
        </div>
      )}
    </div>
  );
};

const CashflowChart = React.memo(({ data }) => {
  if (!data || data.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No cashflow data</div>;
  
  const maxInflow = Math.max(...data.map(d => d.inflow));
  const maxOutflow = Math.max(...data.map(d => d.outflow));
  const maxVal = Math.max(maxInflow, maxOutflow);
  const h = 200;
  const w = 800;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartH = h - padding.top - padding.bottom;
  const chartW = w - padding.left - padding.right;
  
  const xScale = (i) => padding.left + (i / (data.length - 1 || 1)) * chartW;
  const yScale = (val) => padding.top + chartH - (val / (maxVal || 1)) * chartH;
  
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padding.top + chartH * (1 - t);
        return (
          <g key={t}>
            <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#64748b">
              {formatCurrency(maxVal * t)}
            </text>
          </g>
        );
      })}
      
      {/* Inflow bars */}
      {data.map((d, i) => {
        const x = xScale(i);
        const barW = chartW / data.length * 0.35;
        return (
          <rect
            key={`in-${i}`}
            x={x - barW}
            y={yScale(d.inflow)}
            width={barW}
            height={chartH - (yScale(d.inflow) - padding.top)}
            fill="#10b981"
            opacity={0.8}
          />
        );
      })}
      
      {/* Outflow bars */}
      {data.map((d, i) => {
        const x = xScale(i);
        const barW = chartW / data.length * 0.35;
        return (
          <rect
            key={`out-${i}`}
            x={x}
            y={yScale(d.outflow)}
            width={barW}
            height={chartH - (yScale(d.outflow) - padding.top)}
            fill="#ef4444"
            opacity={0.8}
          />
        );
      })}
      
      {/* X-axis labels */}
      {data.filter((_, i) => i % Math.ceil(data.length / 10) === 0).map((d, i) => {
        const idx = i * Math.ceil(data.length / 10);
        return (
          <text
            key={`label-${idx}`}
            x={xScale(idx)}
            y={h - 10}
            textAnchor="middle"
            fontSize={9}
            fill="#64748b"
          >
            {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </text>
        );
      })}
      
      {/* Legend */}
      <g transform={`translate(${w - 150}, 10)`}>
        <rect x={0} y={0} width={12} height={12} fill="#10b981" opacity={0.8} />
        <text x={16} y={10} fontSize={11} fill="#334155">Inflow</text>
        <rect x={60} y={0} width={12} height={12} fill="#ef4444" opacity={0.8} />
        <text x={76} y={10} fontSize={11} fill="#334155">Outflow</text>
      </g>
    </svg>
  );
});

const TopBar = React.memo(({ params, autoRefresh, setAutoRefresh }) => {
  const [exporting, setExporting] = useState(false);
  const handleExportAll = async () => {
    try {
      setExporting(true);
      const downloads = [
        { url: '/analytics/timeseries', name: 'timeseries.csv', params: { ...params, interval: 'auto', export: 'csv' } },
        { url: '/analytics/orders', name: 'orders.csv', params: { ...params, page: 1, limit: 1000, export: 'csv' } },
        { url: '/analytics/profit/categories', name: 'category_profit.csv', params: { ...params, limit: 100, export: 'csv' } },
        { url: '/analytics/profit/products', name: 'product_profit.csv', params: { ...params, limit: 100, sort: 'marginPct', export: 'csv' } },
        { url: '/expenses', name: 'expenses.csv', params: { ...params, page: 1, limit: 1000, export: 'csv' } },
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
    <button 
      className="btn-primary" 
      onClick={handleExportAll} 
      disabled={exporting}
      style={{ borderRadius: '999px', paddingInline: '18px', fontWeight: 600, letterSpacing: '0.03em' }}
    >
      {exporting ? 'Exporting…' : 'Export All CSV'}
    </button>
  );
});

export default FinanceDashboard;


