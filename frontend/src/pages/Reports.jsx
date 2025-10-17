// FILE: client/src/pages/Reports.jsx
// ============================================
import React from 'react';
import Chart from '../components/Chart';
import '../styles/dashboard.css';

const Reports = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>Financial Reports</h2>
        <div className="report-filters">
          <select className="filter-select">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
          <button className="btn-primary">Export PDF</button>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h3>Revenue Overview</h3>
          <div className="report-value">$125,430</div>
          <div className="report-change positive">+12.5% from last month</div>
        </div>
        
        <div className="report-card">
          <h3>Total Orders</h3>
          <div className="report-value">1,247</div>
          <div className="report-change positive">+8.3% from last month</div>
        </div>
        
        <div className="report-card">
          <h3>Average Order Value</h3>
          <div className="report-value">$100.58</div>
          <div className="report-change negative">-2.1% from last month</div>
        </div>
        
        <div className="report-card">
          <h3>Profit Margin</h3>
          <div className="report-value">34.2%</div>
          <div className="report-change positive">+1.5% from last month</div>
        </div>
      </div>

      <div className="charts-section">
        <Chart title="Monthly Sales Trend" />
        <Chart title="Category Performance" />
        <Chart title="Payment Methods" />
      </div>
    </div>
  );
};

export default Reports;