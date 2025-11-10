// ============================================
// FILE: server/src/routes/deliveryRoutes.js
// SUPPORTS: Multi Delivery + Feed + Socket Events
// ============================================
import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import Order from "../models/Order.js";

const router = express.Router();

 router.get("/feed", protect, authorize("delivery"), async (req, res) => {
  try {
    const orders = await Order.find({ orderSource: "online" })
      .populate("delivery.assignedTo", "fullName username")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("GET /delivery/feed error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

 router.get("/my-orders", protect, authorize("delivery"), async (req, res) => {
  try {
    const orders = await Order.find({
      orderSource: "online",
      "delivery.assignedTo": req.user._id,
    })
      .populate("delivery.assignedTo", "fullName username")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("GET /delivery/my-orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

 router.put("/:id/claim", protect, authorize("delivery"), async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, "delivery.assignedTo": null, orderSource: "online" },
      {
        $set: {
          "delivery.assignedTo": req.user._id,
          "delivery.status": "out_for_delivery",
        },
      },
      { new: true }
    ).populate("delivery.assignedTo", "fullName username");

    if (!order) {
      return res.status(409).json({
        success: false,
        message: "This order was already taken by another driver.",
      });
    }

    // 🔥 SOCKET EMIT
    req.app.get("io").emit("delivery:order-assigned", order);

    return res.json({ success: true, message: "Order assigned to you.", order });
  } catch (error) {
    console.error("PUT /delivery/:id/claim error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

 router.put("/:id/status", protect, authorize("delivery"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "out_for_delivery", "delivered"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.orderSource !== "online") {
      return res.status(403).json({ success: false, message: "Not an online delivery order" });
    }

    // Only the assigned driver can mark delivered
    if (status === "delivered") {
      if (!order.delivery.assignedTo || order.delivery.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this order",
        });
      }

      order.status = "completed";
      order.delivery.status = "delivered";
      order.delivery.deliveredAt = new Date();

      // Auto mark as paid if pending
      if (order.paymentMethod === "pending") {
        order.paymentMethod = "cash";
      }
      order.paymentDetails.isPaid = true;
    } else {
      order.delivery.status = status;
    }

    await order.save();

    const updatedOrder = await Order.findById(req.params.id)
      .populate("delivery.assignedTo", "fullName username");

    // 🔥 SOCKET EMIT
    req.app.get("io").emit("delivery:order-status", updatedOrder);

    return res.json({ success: true, message: `Order marked as ${status}`, order: updatedOrder });
  } catch (error) {
    console.error("PUT /delivery/:id/status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
