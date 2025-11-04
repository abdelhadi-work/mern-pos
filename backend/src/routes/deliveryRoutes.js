import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Order from '../models/Order.js';

const router = express.Router();

// Delivery user can only access his assigned orders
router.get('/my-orders', protect, authorize('delivery'), async (req, res) => {
  try {
    const orders = await Order.find({ 'delivery.assignedTo': req.user._id })
      .populate('guestCustomer')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order delivery status
router.put('/:id/status', protect, authorize('delivery'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = ['pending', 'out_for_delivery', 'delivered', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    order.delivery.status = status;

    if (status === 'delivered') {
      order.status = 'completed';
       order.paymentDetails.isPaid = true; 
       if (order.paymentMethod === 'pending') {
    order.paymentMethod = 'cash';
  }
      order.delivery.deliveredAt = new Date();
    } else if (status === 'refunded') {
      order.status = 'refunded';
    }

    await order.save();
    res.json({ success: true, message: `Order marked as ${status}`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
