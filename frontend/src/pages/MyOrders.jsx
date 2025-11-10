import React, { useEffect, useState } from "react";
import { Package, CheckCircle, RefreshCw, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../styles/delivery.css";

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.role === "delivery") fetchMyOrders();
  }, [user]);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/delivery/my-orders");
      setOrders(res.data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async (orderId) => {
    try {
      setUpdating(true);
      await api.put(`/delivery/${orderId}/status`, { status: "delivered" });
      fetchMyOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (user?.role !== "delivery") {
    return (
      <div className="access-denied">
        <Clock size={60} />
        <h2>Access Denied</h2>
        <p>This page is for delivery staff only.</p>
      </div>
    );
  }

  return (
    <div className="delivery-page">
      <div className="page-header">
        <h2>My Delivery Orders</h2>
        <button onClick={fetchMyOrders} className="refresh-btn">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">You have no assigned orders.</div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <Package size={22} />
                <span className="order-id">#{order._id.slice(-6)}</span>
              </div>

              <div className="order-info">
                <p><strong>Customer:</strong> {order.guestCustomer?.name}</p>
                <p><strong>Phone:</strong> {order.guestCustomer?.phone}</p>
                <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                <p><strong>Status:</strong> {order.delivery?.status}</p>
              </div>

              <div className="order-actions">
                {order.delivery?.status === "out_for_delivery" && (
                  <button
                    onClick={() => markDelivered(order._id)}
                    className="btn-primary"
                    disabled={updating}
                  >
                    <CheckCircle size={16} className="inline-icon" />
                    Mark as Delivered
                  </button>
                )}

                {order.delivery?.status === "delivered" && (
                  <span className="delivered-label">
                    ✅ Delivered on {new Date(order.delivery.deliveredAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
