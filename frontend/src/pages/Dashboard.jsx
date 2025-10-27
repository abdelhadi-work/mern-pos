import React from 'react';
import { ShoppingCart, DollarSign, Package, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Chart from '../components/Chart';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: "Today's Sales", value: '$2,450', icon: ShoppingCart, color: 'blue' },
    { label: 'Monthly Revenue', value: '$45,280', icon: DollarSign, color: 'green' },
    { label: 'Products', value: '1,284', icon: Package, color: 'purple' },
    { label: 'Active Users', value: '12', icon: Users, color: 'orange' },
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
              <div className="stat-value">{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="charts-row">
        <Chart title="Sales Overview" />
        <Chart title="Revenue Trend" />
      </div>
    </div>
  );
};

export default Dashboard;