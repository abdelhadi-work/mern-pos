// ============================================
// FILE: server/src/routes/productRoutes.js (SIMPLIFIED)
// ============================================
import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllProducts);
router.get('/lowstock', getLowStockProducts);
router.get('/:id', getProductById);
router.post('/', authorize('main_admin'), upload.array('images', 5), createProduct);
router.put('/:id', authorize('main_admin'), upload.array('images', 5), updateProduct);
router.delete('/:id', authorize('main_admin'), deleteProduct);

export default router;