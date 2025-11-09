// ============================================
// FILE: server/src/server.js
// EXPRESS + SOCKET.IO ENABLED
// ============================================
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";                           // ✅ مهم للسوكِت
import { Server as SocketIOServer } from "socket.io"; // ✅
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Load env
dotenv.config();

// Dir
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App
const app = express();

// CORS
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Static
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// DB
connectDB();

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Electronics POS API is running",
    version: "with socket.io",
    endpoints: {
      auth: "/api/auth",
      categories: "/api/categories",
      products: "/api/products",
      orders: "/api/orders",
      public: "/api/public",
      customers: "/api/customers",
      delivery: "/api/delivery",
      analytics: "/api/analytics",
    },
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/delivery", deliveryRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

// ============================================
// ✅ SOCKET.IO SETUP
// ============================================
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io available to routes
app.set("io", io);

// Socket Events
io.on("connection", (socket) => {
  console.log("🔌 Delivery Socket Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Delivery Socket Disconnected:", socket.id);
  });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server with Socket.io running on port ${PORT}`);
  console.log(`🌍 API URL: http://localhost:${PORT}`);
  console.log(`📂 Uploads: ${path.join(__dirname, "../uploads")}`);
  console.log("=================================");
});
