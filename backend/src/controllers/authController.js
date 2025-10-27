import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// =========================
// LOGIN USER
// =========================
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Please provide username and password" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.isActive) return res.status(401).json({ message: "Account is deactivated" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// REGISTER NEW USER (Main Admin only)
// =========================
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, role } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      role: role || "cashier",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// GET ALL USERS (Main Admin only)
// =========================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// UPDATE USER (Main Admin only)
// =========================
export const updateUser = async (req, res) => {
  try {
    const { role, fullName, email, phone, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent main admin from deactivating or demoting themselves
    if (req.user._id.toString() === user._id.toString() && role !== "main_admin") {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    user.role = role || user.role;
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    const updatedUser = await user.save();
    res.json({ success: true, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// DELETE USER (Main Admin only)
// =========================
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
