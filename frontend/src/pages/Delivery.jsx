// ============================================
// FILE: client/src/pages/Delivery.jsx
// ============================================
import React, { useEffect, useState } from "react";
import { Truck, CheckCircle, Clock, Package, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const Delivery = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role === "delivery") fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/delivery/my-orders");
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch delivery orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      setUpdating(true);
      await api.put(`/delivery/${orderId}/status`, { status });
      fetchOrders();
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
        <p>Only delivery users can access this page.</p>
      </div>
    );
  }

  return (
    <div className="delivery-page">
      <div className="page-header">
        <h2>
          <Truck className="inline-icon" /> Delivery Dashboard
        </h2>
        <button onClick={fetchOrders} className="refresh-btn">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading assigned orders...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">No delivery orders assigned yet.</div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <Package size={22} />
                <span className="order-id">#{order._id.slice(-6)}</span>
              </div>

              <div className="order-info">
                <p>
                  <strong>Customer:</strong> {order.guestCustomer?.name || "N/A"}
                </p>
                <p>
                  <strong>Phone:</strong> {order.guestCustomer?.phone || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong>{" "}
                  {order.guestCustomer?.address || "Not Provided"}
                </p>
                <p>
                  <strong>Total:</strong> ${order.total.toFixed(2)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge status-${order.delivery?.status || "pending"}`}
                  >
                    {order.delivery?.status || "pending"}
                  </span>
                </p>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.name} × {item.quantity} (${item.total})
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-actions">
                {order.delivery?.status === "pending" && (
                  <button
                    onClick={() => updateStatus(order._id, "out_for_delivery")}
                    className="btn-secondary"
                    disabled={updating}
                  >
                    Start Delivery
                  </button>
                )}

                {order.delivery?.status === "out_for_delivery" && (
                  <button
                    onClick={() => updateStatus(order._id, "delivered")}
                    className="btn-primary"
                    disabled={updating}
                  >
                    <CheckCircle size={16} className="inline-icon" />
                    Mark as Delivered
                  </button>
                )}

                {order.delivery?.status === "delivered" && (
                  <span className="delivered-label">
                    ✅ Delivered on{" "}
                    {new Date(order.delivery.deliveredAt).toLocaleString()}
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

export default Delivery;
