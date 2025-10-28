import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get all active products (no authentication required)
router.get('/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true, stock: { $gt: 0 } };

    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all categories (no authentication required)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create order from customer (no authentication required)
router.post('/orders', async (req, res) => {
  try {
    const { customer, items, totalAmount } = req.body;

    if (!customer.name || !customer.phone || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check stock availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.productName}` 
        });
      }
    }

    const order = await Order.create({
      customer,
      items,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully', 
      order 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;