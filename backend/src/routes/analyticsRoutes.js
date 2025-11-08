import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { 
  getSummary, 
  getTimeseries, 
  getPaymentMix, 
  getOrdersList, 
  getProfitSummary, 
  getCategoryProfit, 
  getProductProfit, 
  getInventoryMetrics,
  getCashflowAnalysis,
  getComparativeAnalytics,
  getAlerts
} from '../controllers/analyticsController.js';

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
router.get('/inventory', getInventoryMetrics);
router.get('/cashflow', getCashflowAnalysis);
router.get('/comparative', getComparativeAnalytics);
router.get('/alerts', getAlerts);

export default router;


