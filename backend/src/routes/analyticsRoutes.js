import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getSummary, getTimeseries, getPaymentMix, getOrdersList, getProfitSummary, getCategoryProfit, getProductProfit } from '../controllers/analyticsController.js';

const router = express.Router();

// Finance analytics (finance_admin, main_admin, accounting_admin can view)
router.use(protect, authorize('finance_admin', 'main_admin', 'accounting_admin'));

router.get('/summary', getSummary);
router.get('/timeseries', getTimeseries);
router.get('/payment-mix', getPaymentMix);
router.get('/orders', getOrdersList);
router.get('/profit/summary', getProfitSummary);
router.get('/profit/categories', getCategoryProfit);
router.get('/profit/products', getProductProfit);

export default router;


