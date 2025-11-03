// // FILE: client/src/pages/Orders.jsx
// import React, { useState, useEffect } from "react";
// import Table from "../components/Table";
// import { formatDate } from "../utils/formatDate";
// import { orderAPI } from "../api";

// const Orders = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const res = await orderAPI.getAll();
//       if (res.data.success) {
//         setOrders(res.data.orders);
//       } else {
//         console.error("Failed to fetch orders:", res.data.message);
//       }
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const columns = [
//     { header: "Invoice", accessor: "invoice" },
//     {
//       header: "Date",
//       accessor: "createdAt",
//       render: (value) => formatDate(value),
//     },
//     { header: "Customer", accessor: "customer.name" },
//     {
//       header: "Total",
//       accessor: "totalAmount",
//       render: (value) => `$${value.toFixed(2)}`,
//     },
//     {
//       header: "Status",
//       accessor: "status",
//       render: (value) => (
//         <span className={`status-badge status-${value.toLowerCase()}`}>
//           {value}
//         </span>
//       ),
//     },
//   ];

//   if (loading) return <p className="p-4">Loading orders...</p>;

//   return (
//     <div className="orders-page">
//       <div className="page-header">
//         <h2>Order History</h2>
//       </div>
//       <div className="page-content">
//         <Table
//           columns={columns}
//           data={orders}
//           onRowClick={(row) => console.log("View order:", row)}
//         />
//       </div>
//     </div>
//   );
// };

// export default Orders;









// ============================================
// FILE: client/src/pages/Orders.jsx (FIXED)
// ============================================
import React, { useState, useEffect } from 'react';
import { Eye, Filter, Download, RefreshCw } from 'lucide-react';
import { orderAPI } from '../api';
import Table from '../components/Table';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await orderAPI.getAll(filters);
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    fetchOrders();
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      paymentMethod: '',
      startDate: '',
      endDate: ''
    });
  };

  // Helper function to get customer name
  const getCustomerName = (order) => {
    if (order.guestCustomer) {
      return order.guestCustomer.name;
    }
    if (order.customer && typeof order.customer === 'object') {
      return order.customer.name;
    }
    return 'Walk-in Customer';
  };

  // Helper function to get customer phone
  const getCustomerPhone = (order) => {
    if (order.guestCustomer) {
      return order.guestCustomer.phone;
    }
    if (order.customer && typeof order.customer === 'object') {
      return order.customer.phone || 'N/A';
    }
    return 'N/A';
  };

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNumber',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
          {val || 'N/A'}
        </span>
      )
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      render: (val) => new Date(val).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      header: 'Customer',
      accessor: 'guestCustomer',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '600' }}>{getCustomerName(row)}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {getCustomerPhone(row)}
          </div>
        </div>
      )
    },
    {
      header: 'Items',
      accessor: 'items',
      render: (val) => (
        <span style={{ fontWeight: '600' }}>
          {val?.length || 0} item{val?.length !== 1 ? 's' : ''}
        </span>
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (val) => (
        <span style={{ fontWeight: '700', color: '#2563eb' }}>
          ${val?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      header: 'Payment',
      accessor: 'paymentMethod',
      render: (val) => (
        <span className={`badge badge-${val === 'pending' ? 'warning' : 'info'}`}>
          {val ? val.replace('_', ' ').toUpperCase() : 'N/A'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => {
        const statusColors = {
          completed: 'success',
          pending: 'warning',
          cancelled: 'danger',
          refunded: 'secondary',
          partial_refund: 'info'
        };
        return (
          <span className={`badge badge-${statusColors[val] || 'secondary'}`}>
            {val ? val.replace('_', ' ').toUpperCase() : 'N/A'}
          </span>
        );
      }
    },
    {
      header: 'Source',
      accessor: 'orderSource',
      render: (val) => (
        <span className={`badge badge-${val === 'online' ? 'primary' : 'secondary'}`}>
          {val === 'online' ? '🌐 Online' : '🏪 POS'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (val, row) => (
        <button
          className="btn-icon"
          onClick={() => viewOrderDetails(row)}
          title="View Details"
        >
          <Eye size={16} />
        </button>
      )
    }
  ];

  const viewOrderDetails = (order) => {
    // TODO: Implement order details modal or navigation
    console.log('View order:', order);
    alert(`Order Details:\n\nOrder #: ${order.orderNumber}\nCustomer: ${getCustomerName(order)}\nTotal: $${order.total.toFixed(2)}\nStatus: ${order.status}`);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <button className="btn-primary" onClick={fetchOrders}>
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-header">
          <Filter size={20} />
          <span>Filters</span>
        </div>
        <div className="filters-grid">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-input"
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>
        <div className="filters-actions">
          <button className="btn-secondary" onClick={resetFilters}>
            Reset
          </button>
          <button className="btn-primary" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{orders.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">
            ${orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Orders</div>
          <div className="stat-value">
            {orders.filter(o => o.status === 'pending').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Online Orders</div>
          <div className="stat-value">
            {orders.filter(o => o.orderSource === 'online').length}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found</p>
        </div>
      ) : (
        <Table columns={columns} data={orders} />
      )}
    </div>
  );
};



export default Orders;