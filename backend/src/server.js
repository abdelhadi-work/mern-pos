// ============================================
// FILE: server/src/index.js (COMPLETE)
// ============================================
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';  // ADD THIS LINE
import deliveryRoutes from './routes/deliveryRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import http from "http";                           
import { Server as SocketIOServer } from "socket.io";
import publicRoutes from './routes/publicRoutes.js';

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);  // ADD THIS LINE
app.use('/api/delivery', deliveryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public', publicRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Electronics POS API is running' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);



const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

// socket events
io.on("connection", (socket) => {
  console.log("🔌 Delivery Socket Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Delivery Socket Disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server with Socket.io running on port ${PORT}`);
  console.log(`🌍 API URL: http://localhost:${PORT}`);
  console.log(`📂 Uploads: ${path.join(__dirname, "../uploads")}`);
  console.log("=================================");
});