// FILE: client/src/pages/Orders.jsx
import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import { formatDate } from "../utils/formatDate";
import { orderAPI } from "../api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAll();
      if (res.data.success) {
        setOrders(res.data.orders);
      } else {
        console.error("Failed to fetch orders:", res.data.message);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Invoice", accessor: "invoice" },
    {
      header: "Date",
      accessor: "createdAt",
      render: (value) => formatDate(value),
    },
    { header: "Customer", accessor: "customer.name" },
    {
      header: "Total",
      accessor: "totalAmount",
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      header: "Status",
      accessor: "status",
      render: (value) => (
        <span className={`status-badge status-${value.toLowerCase()}`}>
          {value}
        </span>
      ),
    },
  ];

  if (loading) return <p className="p-4">Loading orders...</p>;

  return (
    <div className="orders-page">
      <div className="page-header">
        <h2>Order History</h2>
      </div>
      <div className="page-content">
        <Table
          columns={columns}
          data={orders}
          onRowClick={(row) => console.log("View order:", row)}
        />
      </div>
    </div>
  );
};

export default Orders;
