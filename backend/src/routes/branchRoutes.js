import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET all branches - accessible to all authenticated users
router.get('/', getAllBranches);

// GET single branch - accessible to all authenticated users
router.get('/:id', getBranchById);

// CREATE, UPDATE, DELETE - only main_admin
router.post('/', authorize('main_admin'), createBranch);
router.put('/:id', authorize('main_admin'), updateBranch);
router.delete('/:id', authorize('main_admin'), deleteBranch);

export default router;

