import express from 'express';  // Import express using ESM syntax
import dotenv from 'dotenv';  // Import dotenv for environment variables
import cors from 'cors';  // Import cors to handle cross-origin requests
import connectDB from './config/db.js';  // Import MongoDB connection
import authRoutes from './routes/authRoutes.js';  // Import auth routes
import { notFound, errorHandler } from './middleware/errorMiddleware.js';  // Import error handling middleware

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());  // Enable CORS for all routes
app.use(express.json());  // Parse incoming JSON requests

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);  // Authentication routes

// Error handling middleware for 404 and other errors
app.use(notFound);  // Handle 404 errors
app.use(errorHandler);  // Handle other errors

// Start the server
const PORT = process.env.PORT || 5001;  // Use port from env or default to 5001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
