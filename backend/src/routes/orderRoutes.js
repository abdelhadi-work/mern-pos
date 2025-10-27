// ============================================
// FILE: server/src/routes/orderRoutes.js
// ============================================
import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getTodaySales,
  cancelOrder,
  processRefund,
  getSalesReport
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes accessible by all authenticated users
router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/today', getTodaySales);
router.get('/report', getSalesReport);
router.get('/:id', getOrderById);

// Admin-only routes
router.put('/:id/cancel', authorize('main_admin'), cancelOrder);
router.post('/:id/refund', authorize('main_admin'), processRefund);

export default router;