// ============================================
// FILE: server/src/routes/categoryRoutes.js (SIMPLIFIED)
// ============================================
import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', authorize('main_admin'), upload.single('image'), createCategory);
router.put('/:id', authorize('main_admin'), upload.single('image'), updateCategory);
router.delete('/:id', authorize('main_admin'), deleteCategory);

export default router;