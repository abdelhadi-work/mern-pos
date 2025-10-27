import React, { useState } from 'react';
import Table from '../components/Table';
import { formatDate } from '../utils/formatDate';

const Orders = () => {
  const [orders] = useState([
    { id: 1, invoice: '#INV-001', date: '2025-10-17', customer: 'John Doe', total: 1500, status: 'Completed' },
    { id: 2, invoice: '#INV-002', date: '2025-10-17', customer: 'Jane Smith', total: 2800, status: 'Pending' },
    { id: 3, invoice: '#INV-003', date: '2025-10-16', customer: 'Bob Johnson', total: 450, status: 'Completed' },
  ]);

  const columns = [
    { header: 'Invoice', accessor: 'invoice' },
    { 
      header: 'Date', 
      accessor: 'date',
      render: (value) => formatDate(value)
    },
    { header: 'Customer', accessor: 'customer' },
    { 
      header: 'Total', 
      accessor: 'total',
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`status-badge status-${value.toLowerCase()}`}>
          {value}
        </span>
      )
    },
  ];

  return (
    <div className="orders-page">
      <div className="page-header">
        <h2>Order History</h2>
      </div>

      <div className="page-content">
        <Table columns={columns} data={orders} onRowClick={(row) => console.log('View order:', row)} />
      </div>
    </div>
  );
};

export default Orders;
