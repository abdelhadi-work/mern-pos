import React, { useState } from 'react';
import { ShoppingCart, DollarSign, Package, Users, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, categoryAPI, authAPI } from '../api';
import { useFetch } from '../hooks/useFetch';

const formatCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n || 0);

const presetRange = (days) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  
  return { start: start.toISOString(), end: end.toISOString() };
};

const Dashboard = () => {
  const { user } = useAuth();
  const [todayRange] = useState(presetRange(1));
  const [monthRange] = useState(presetRange(30));

  const { data: todaySummary, loading: loadingToday } = useFetch(
    () => analyticsAPI.getSummary({ 
      start: todayRange.start, 
      end: todayRange.end
    }), 
    [todayRange.start, todayRange.end]
  );

  const { data: monthlySummary, loading: loadingMonthly } = useFetch(
    () => analyticsAPI.getSummary({ 
      start: monthRange.start, 
      end: monthRange.end
    }), 
    [monthRange.start, monthRange.end]
  );

  const { data: todayTimeseries } = useFetch(
    () => analyticsAPI.getTimeseries({ 
      start: todayRange.start, 
      end: todayRange.end,
      interval: 'hour' 
    }), 
    [todayRange.start, todayRange.end]
  );

  const { data: monthTimeseries } = useFetch(
    () => analyticsAPI.getTimeseries({ 
      start: monthRange.start, 
      end: monthRange.end,
      interval: 'day' 
    }), 
    [monthRange.start, monthRange.end]
  );

  const { data: paymentMix } = useFetch(
    () => analyticsAPI.getPaymentMix({ 
      start: monthRange.start, 
      end: monthRange.end
    }), 
    [monthRange.start, monthRange.end]
  );

  // Fetch users - only works for main_admin due to backend restrictions
  const shouldFetchUsers = user?.role === 'main_admin';
  const { data: usersData, loading: loadingUsers } = useFetch(
    () => shouldFetchUsers ? authAPI.getUsers() : Promise.resolve({ data: { users: [] } }),
    [shouldFetchUsers]
  );

  const totalUsers = usersData?.users?.length || 0;
  const activeUsers = usersData?.users?.filter(u => u.isActive).length || 0;

  const stats = [
    { 
      label: "Today's Sales", 
      value: formatCurrency(todaySummary?.revenue), 
      icon: ShoppingCart, 
      color: 'blue',
      subtext: `${todaySummary?.ordersCount || 0} orders`,
      loading: loadingToday
    },
    { 
      label: 'Monthly Revenue', 
      value: formatCurrency(monthlySummary?.revenue), 
      icon: DollarSign, 
      color: 'green',
      subtext: `${monthlySummary?.ordersCount || 0} orders`,
      loading: loadingMonthly
    },
    { 
      label: 'Avg Ticket', 
      value: formatCurrency(monthlySummary?.avgTicket), 
      icon: TrendingUp, 
      color: 'purple',
      subtext: `${(monthlySummary?.itemsPerOrder || 0).toFixed(1)} items/order`,
      loading: loadingMonthly
    },
    { 
      label: 'Active Users', 
      value: shouldFetchUsers ? activeUsers : 'N/A',
      icon: Users, 
      color: 'orange',
      subtext: shouldFetchUsers ? `${totalUsers} total users` : 'Admin only',
      loading: loadingUsers
    },
  ];

  return (
    <div className="dashboard">
      <div className="welcome-card">
        <h1 className="welcome-title">Welcome back, {user?.fullName}!</h1>
        <p className="welcome-subtitle">Here's what's happening with your store today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="stat-label">{stat.label}</div>
              {stat.loading ? (
                <div className="stat-value loading">Loading...</div>
              ) : (
                <>
                  <div className="stat-value">{stat.value}</div>
                  {stat.subtext && <div className="stat-subtext">{stat.subtext}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="charts-row">
        <MiniSalesChart 
          title="Today's Sales" 
          data={todayTimeseries} 
          interval="hour"
        />
        <MiniRevenueChart 
          title="Monthly Revenue" 
          data={monthTimeseries} 
          interval="day"
        />
      </div>

      <div className="dashboard-grid">
        <PaymentMixCard data={paymentMix} />
        <QuickStatsCard 
          todaySummary={todaySummary} 
          monthlySummary={monthlySummary} 
        />
      </div>
    </div>
  );
};

const MiniSalesChart = ({ title, data }) => {
  const buckets = data?.buckets || [];
  const width = 100;
  const height = 60;
  const padding = 2;

  if (buckets.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">{title}</div>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          No data available
        </div>
      </div>
    );
  }

  const max = Math.max(1, ...buckets.map(b => b.sales || 0));
  const x = (i) => padding + (i * (width - padding * 2)) / Math.max(1, buckets.length - 1);
  const y = (v) => height - padding - ((v / max) * (height - padding * 2));
  const path = buckets.map((b, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(b.sales || 0)}`).join(' ');
  const areaPath = `${path} L ${x(buckets.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="60" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#salesGradient)" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="1.5" />
      </svg>
      <div className="chart-footer">
        <span className="chart-total">{formatCurrency(buckets.reduce((sum, b) => sum + (b.sales || 0), 0))}</span>
        <span className="chart-count">{buckets.reduce((sum, b) => sum + (b.orders || 0), 0)} orders</span>
      </div>
    </div>
  );
};

const MiniRevenueChart = ({ title, data }) => {
  const buckets = data?.buckets || [];
  const width = 100;
  const height = 60;
  const padding = 2;

  if (buckets.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-title">{title}</div>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          No data available
        </div>
      </div>
    );
  }

  const max = Math.max(1, ...buckets.map(b => b.sales || 0));
  const barWidth = (width - padding * 2) / buckets.length - 1;

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="60" style={{ display: 'block' }}>
        {buckets.map((b, i) => {
          const barHeight = ((b.sales || 0) / max) * (height - padding * 2);
          const x = padding + i * (barWidth + 1);
          const y = height - padding - barHeight;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="#10b981"
              opacity="0.8"
            />
          );
        })}
      </svg>
      <div className="chart-footer">
        <span className="chart-total">{formatCurrency(buckets.reduce((sum, b) => sum + (b.sales || 0), 0))}</span>
        <span className="chart-count">{buckets.reduce((sum, b) => sum + (b.orders || 0), 0)} orders</span>
      </div>
    </div>
  );
};

const PaymentMixCard = ({ data }) => {
  const methods = data?.methods || [];
  const total = methods.reduce((s, m) => s + (m.amount || 0), 0) || 1;
  const colors = {
    cash: '#10b981',
    card: '#3b82f6',
    split: '#8b5cf6',
    transfer: '#f59e0b',
    credit: '#ef4444'
  };

  return (
    <div className="info-card">
      <div className="info-card-header">
        <h3>Payment Methods</h3>
        <Activity size={20} className="header-icon" />
      </div>
      <div className="payment-mix-list">
        {methods.map((m) => {
          const percentage = ((m.amount || 0) / total * 100).toFixed(1);
          return (
            <div key={m.method} className="payment-mix-item">
              <div className="payment-mix-info">
                <span 
                  className="payment-dot" 
                  style={{ backgroundColor: colors[m.method] || '#94a3b8' }}
                />
                <span className="payment-method">{m.method}</span>
              </div>
              <div className="payment-mix-values">
                <span className="payment-amount">{formatCurrency(m.amount)}</span>
                <span className="payment-percentage">{percentage}%</span>
              </div>
            </div>
          );
        })}
        {methods.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No payment data available
          </div>
        )}
      </div>
    </div>
  );
};

const QuickStatsCard = ({ todaySummary, monthlySummary }) => {
  const quickStats = [
    { label: 'Today\'s Tax', value: formatCurrency(todaySummary?.taxCollected) },
    { label: 'Monthly Tax', value: formatCurrency(monthlySummary?.taxCollected) },
    { label: 'Today\'s Avg Ticket', value: formatCurrency(todaySummary?.avgTicket) },
    { label: 'Items per Order', value: (monthlySummary?.itemsPerOrder || 0).toFixed(2) },
  ];

  return (
    <div className="info-card">
      <div className="info-card-header">
        <h3>Quick Stats</h3>
        <TrendingUp size={20} className="header-icon" />
      </div>
      <div className="quick-stats-grid">
        {quickStats.map((stat, index) => (
          <div key={index} className="quick-stat-item">
            <div className="quick-stat-label">{stat.label}</div>
            <div className="quick-stat-value">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;