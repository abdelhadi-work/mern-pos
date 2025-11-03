// import express from 'express';
// import Product from '../models/Product.js';
// import Category from '../models/Category.js';
// import Order from '../models/Order.js';

// const router = express.Router();

// // Get all active products (no authentication required)
// router.get('/products', async (req, res) => {
//   try {
//     const { category, search } = req.query;
//     let query = { isActive: true, stock: { $gt: 0 } };

//     if (category) query.category = category;
    
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { brand: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const products = await Product.find(query)
//       .populate('category', 'name')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, count: products.length, products });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Get all categories (no authentication required)
// router.get('/categories', async (req, res) => {
//   try {
//     const categories = await Category.find({ isActive: true }).sort({ name: 1 });
//     res.json({ success: true, categories });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Create order from customer (no authentication required)
// router.post('/orders', async (req, res) => {
//   try {
//     const { customer, items, totalAmount } = req.body;

//     if (!customer.name || !customer.phone || !items || items.length === 0) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Check stock availability
//     for (const item of items) {
//       const product = await Product.findById(item.product);
//       if (!product || product.stock < item.quantity) {
//         return res.status(400).json({ 
//           message: `Insufficient stock for ${item.productName}` 
//         });
//       }
//     }

//     const order = await Order.create({
//       customer,
//       items,
//       totalAmount,
//       status: 'pending',
//       paymentStatus: 'pending'
//     });

//     // Reduce stock
//     for (const item of items) {
//       await Product.findByIdAndUpdate(item.product, {
//         $inc: { stock: -item.quantity }
//       });
//     }

//     res.status(201).json({ 
//       success: true, 
//       message: 'Order placed successfully', 
//       order 
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// export default router;











// ============================================
// FILE: server/src/routes/publicRoutes.js (FIXED)
// ============================================
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
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get all categories (no authentication required)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create order from shop (no authentication required)
router.post('/orders', async (req, res) => {
  try {
    const { customer, items, totalAmount } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Customer name and phone are required' 
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Order must contain at least one item' 
      });
    }

    // Start transaction
    const session = await Order.startSession();
    session.startTransaction();

    
    try {

      const User = (await import('../models/User.js')).default;
      const deliveryUser = await User.findOne({ role: 'delivery' });
      // Validate and update stock
      const validatedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          throw new Error(`Product "${item.productName || 'Unknown'}" not found`);
        }
        
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }

        // Update stock
        product.stock -= item.quantity;
        await product.save({ session });

        // Calculate item total
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        // Add validated item
        validatedItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          total: itemTotal
        });
      }

      // Calculate totals (no tax or discount for online orders by default)
      const taxRate = 0; // You can add tax calculation here if needed
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;

      // Create order with correct structure
      const orderData = {
        items: validatedItems,
        subtotal,
        discount: {
          type: 'fixed',
          value: 0,
          amount: 0
        },
        tax: {
          rate: taxRate,
          amount: taxAmount
        },
        total,
        paymentMethod: 'pending',
        status: 'pending',
        cashier: null, // No cashier for online orders
        guestCustomer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || ''
        },
        orderSource: 'online',
        session: {
          date: new Date(),
          shift: 'online',
          register: 'ONLINE-SHOP'
        },
         
        delivery: {
          assignedTo: deliveryUser ? deliveryUser._id : null,
          status: 'pending',
        },
        notes: 'Order placed via online shop'
      };

      const order = await Order.create([orderData], { session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      res.status(201).json({ 
        success: true, 
        message: 'Order placed successfully!',
        order: order[0]
      });

    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to place order. Please try again.'
    });
  }
});

export default router;