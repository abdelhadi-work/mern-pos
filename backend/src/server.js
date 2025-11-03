// // ============================================
// // FILE: server/src/index.js (COMPLETE)
// // ============================================
// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import connectDB from './config/db.js';
// import authRoutes from './routes/authRoutes.js';
// import categoryRoutes from './routes/categoryRoutes.js';
// import productRoutes from './routes/productRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';  // ADD THIS LINE
// import { notFound, errorHandler } from './middleware/errorMiddleware.js';
// import publicRoutes from './routes/publicRoutes.js';
// import customerRoutes from './routes/customerRoutes.js';

// // Load environment variables
// dotenv.config();

// // Get directory name for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Initialize Express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Serve static files (uploaded images)
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// // Connect to MongoDB
// connectDB();

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/customers', customerRoutes);

// app.use('/api/orders', orderRoutes);  // ADD THIS LINE
// app.use('/api/public', publicRoutes);

// // Health check route
// app.get('/', (req, res) => {
//   res.json({ message: 'Electronics POS API is running' });
// });

// // Error handling middleware
// app.use(notFound);
// app.use(errorHandler);

// // Start the server
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Uploads directory: ${path.join(__dirname, '../uploads')}`);
// });





// ============================================
// FILE: server/src/index.js (WITH DEBUGGING)
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
import orderRoutes from './routes/orderRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// CORS Configuration - Allow all origins for development
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
connectDB();

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Electronics POS API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      products: '/api/products',
      orders: '/api/orders',
      public: '/api/public',
      customers: '/api/customers'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);  // ADD THIS LINE
app.use('/api/analytics', analyticsRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Electronics POS API is running' });
});
app.use('/api/orders', orderRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/delivery', deliveryRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ API URL: http://localhost:${PORT}`);
  console.log(`✓ Uploads: ${path.join(__dirname, '../uploads')}`);
  console.log('=================================');
});