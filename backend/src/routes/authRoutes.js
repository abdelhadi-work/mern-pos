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

// Main Admin only routes
router.post("/register", protect, authorize("main_admin"), registerUser);
router.get("/users", protect, authorize("main_admin"), getAllUsers);
router.put("/users/:id", protect, authorize("main_admin"), updateUser);
router.delete("/users/:id", protect, authorize("main_admin"), deleteUser);

export default router;
