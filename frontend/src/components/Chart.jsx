import React from 'react';
import { BarChart3 } from 'lucide-react';

const Chart = ({ title, data, type = 'bar' }) => {
  // Placeholder for chart component
  // In production, use recharts or chart.js
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-placeholder">
        <BarChart3 size={64} />
        <p>Chart visualization will be rendered here</p>
        <p className="chart-note">Use Recharts or Chart.js library</p>
      </div>
    </div>
  );
};

export default Chart;