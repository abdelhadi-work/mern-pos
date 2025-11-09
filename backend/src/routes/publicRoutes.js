// ============================================
// FILE: server/src/routes/publicRoutes.js
// SUPPORTS: Online Orders + Socket Emit
// ============================================
import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';

const router = express.Router();

// ✅ Get Products (Public)
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
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ✅ Get Categories (Public)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ✅ Create Online Order (Public)
router.post('/orders', async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { customer, items } = req.body;

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone are required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least 1 item' });
    }

    let subtotal = 0;
    const validatedItems = [];

    // ✅ Validate stock + calculate total
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error(`Product not found`);

      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
      }

      // Reduce stock
      product.stock -= item.quantity;
      await product.save({ session });

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: lineTotal,
      });
    }

    const orderData = {
      items: validatedItems,
      subtotal,
      discount: { type: 'fixed', value: 0, amount: 0 },
      tax: { rate: 0, amount: 0 },
      total: subtotal,
      status: 'pending',
      paymentMethod: 'pending',
      paymentDetails: { isPaid: false },
      cashier: null, // ليس من الـ POS
      guestCustomer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
      },
      orderSource: 'online',
      delivery: { assignedTo: null, status: 'pending' },
      notes: 'Order placed via online shop',
    };

    const [order] = await Order.create([orderData], { session });

    await session.commitTransaction();
    session.endSession();

    // 🔥 SOCKET EMIT — informs delivery page about new order
    req.app.get('io').emit('delivery:order-created', order);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Order creation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
