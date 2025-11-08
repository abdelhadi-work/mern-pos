import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('finance_admin', 'main_admin', 'accounting_admin'), getExpenses);
router.get('/:id', authorize('finance_admin', 'main_admin', 'accounting_admin'), getExpenseById);
router.post('/', authorize('finance_admin', 'main_admin'), createExpense);
router.put('/:id', authorize('finance_admin', 'main_admin'), updateExpense);
router.delete('/:id', authorize('finance_admin', 'main_admin'), deleteExpense);

export default router;


