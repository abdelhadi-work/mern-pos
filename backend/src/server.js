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
import categoryRoutes from './routes/categoryRoutes.js';  // ADD THIS
import productRoutes from './routes/productRoutes.js';    // ADD THIS
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

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

// Serve static files (uploaded images) - ADD THIS
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);  // ADD THIS LINE
app.use('/api/products', productRoutes);      // ADD THIS LINE

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Electronics POS API is running' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${path.join(__dirname, '../uploads')}`);
});