import express from "express";
import {
  login,
  registerUser,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/authController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public login route
router.post("/login", login);

// Main Admin only routes for creating/modifying users
router.post("/register", protect, authorize("main_admin"), registerUser);
router.put("/users/:id", protect, authorize("main_admin"), updateUser);
router.delete("/users/:id", protect, authorize("main_admin"), deleteUser);

// All admin roles can VIEW users (for dashboard stats)
router.get(
  "/users", 
  protect, 
  authorize("main_admin", "finance_admin", "accounting_admin"), 
  getAllUsers
);

export default router;