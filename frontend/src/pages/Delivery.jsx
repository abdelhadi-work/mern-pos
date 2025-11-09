import React, { useEffect, useState, useMemo } from "react";
import { Truck, CheckCircle, Clock, Package, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import io from "socket.io-client";
import "../styles/delivery.css";

const SOCKET_URL = "http://localhost:5001"; // نفس بورت السيرفر

const Delivery = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  // helper
  const isMine = (order) =>
    order?.delivery?.assignedTo &&
    (order.delivery.assignedTo._id === user?._id ||
     order.delivery.assignedTo === user?._id);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get("/delivery/feed");
      // فقط أونلاين (الروت أصلاً يرجّع أونلاين، لكن نزيد أمان)
      const list = (res.data.orders || []).filter(o => o.orderSource === "online");
      setOrders(list);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch delivery feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "delivery") return;
    fetchFeed();

    // Socket listen
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => console.log("🔌 socket connected", socket.id));

    socket.on("delivery:order-created", (order) => {
      if (order.orderSource === "online") {
        setOrders(prev => [order, ...prev]);
      }
    });

    socket.on("delivery:order-assigned", (order) => {
      if (order.orderSource === "online") {
        setOrders(prev => {
          const idx = prev.findIndex(o => o._id === order._id);
          if (idx === -1) return [order, ...prev];
          const copy = [...prev]; copy[idx] = order; return copy;
        });
      }
    });

    socket.on("delivery:order-status", (order) => {
      if (order.orderSource === "online") {
        setOrders(prev => {
          const idx = prev.findIndex(o => o._id === order._id);
          if (idx === -1) return [order, ...prev];
          const copy = [...prev]; copy[idx] = order; return copy;
        });
      }
    });

    return () => socket.disconnect();
  }, [user]);

  const claimOrder = async (orderId) => {
    try {
      setUpdating(true);
      await api.put(`/delivery/${orderId}/claim`);
      // لا داعي لإعادة الجلب — السوكِت سيحدّثنا
    } catch (err) {
      alert(err.response?.data?.message || "Failed to claim");
    } finally {
      setUpdating(false);
    }
  };

  const markDelivered = async (orderId) => {
    try {
      setUpdating(true);
      await api.put(`/delivery/${orderId}/status`, { status: "delivered" });
      // السوكِت سيحدّثنا
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
        <h2><Truck className="inline-icon" /> Delivery Dashboard</h2>
        <button onClick={fetchFeed} className="refresh-btn">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">No online delivery orders yet.</div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => {
            const assignedTo = order?.delivery?.assignedTo;
            const assignedName = assignedTo?.fullName || assignedTo?.username;

            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <Package size={22} />
                  <span className="order-id">#{order._id.slice(-6)}</span>
                </div>

                <div className="order-info">
                  <p><strong>Customer:</strong> {order.guestCustomer?.name || "N/A"}</p>
                  <p><strong>Phone:</strong> {order.guestCustomer?.phone || "N/A"}</p>
                  <p><strong>Address:</strong> {order.guestCustomer?.address || "Not Provided"}</p>
                  <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`status-badge status-${order.delivery?.status || "pending"}`}>
                      {order.delivery?.status || "pending"}
                    </span>
                  </p>
                  {assignedTo && (
                    <p><strong>Taken by:</strong> {assignedName}</p>
                  )}
                </div>

                <div className="order-items">
                  <h4>Items:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.name} × {item.quantity} (${item.total})</li>
                    ))}
                  </ul>
                </div>

                <div className="order-actions">
                  {/* PENDING: أزرار البدء */}
                  {!assignedTo && (order.delivery?.status === "pending") && (
                    <button
                      onClick={() => claimOrder(order._id)}
                      className="btn-secondary"
                      disabled={updating}
                    >
                      Start Delivery
                    </button>
                  )}

                  {/* TAKEN BY ME */}
                  {assignedTo && isMine(order) && order.delivery?.status === "out_for_delivery" && (
                    <button
                      onClick={() => markDelivered(order._id)}
                      className="btn-primary"
                      disabled={updating}
                    >
                      <CheckCircle size={16} className="inline-icon" />
                      Mark as Delivered
                    </button>
                  )}

                  {/* TAKEN BY ANOTHER */}
                  {assignedTo && !isMine(order) && (
                    <span className="taken-label">Taken by {assignedName}</span>
                  )}

                  {/* DELIVERED */}
                  {order.delivery?.status === "delivered" && (
                    <span className="delivered-label">
                      ✅ Delivered on {new Date(order.delivery.deliveredAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Delivery;
