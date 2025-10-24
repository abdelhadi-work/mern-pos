// ============================================
// FILE: server/src/controllers/orderController.js
// ============================================
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// CREATE NEW ORDER
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      paymentDetails,
      customer,
      notes
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Order must contain at least one item' 
      });
    }

    // Start a MongoDB session for transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Update product stock
      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          throw new Error(`Product ${item.name} not found`);
        }
        
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }
        
        // Decrease stock
        product.stock -= item.quantity;
        await product.save({ session });
      }

      // Create order
      const order = new Order({
        items,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        paymentDetails,
        cashier: req.user._id,
        customer,
        notes,
        status: 'completed',
        session: {
          date: new Date(),
          shift: getShift(),
          register: 'POS-1' // You can make this dynamic
        }
      });

      await order.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // Populate references for response
      const populatedOrder = await Order.findById(order._id)
        .populate('items.product', 'name sku')
        .populate('cashier', 'fullName username')
        .populate('customer', 'name phone');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: populatedOrder
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
      message: error.message || 'Failed to create order'
    });
  }
};

// GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      cashier,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (cashier) query.cashier = cashier;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('cashier', 'fullName username')
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('cashier', 'fullName username email')
      .populate('customer')
      .populate('refund.processedBy', 'fullName username');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// GET TODAY'S SALES SUMMARY
export const getTodaySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [orders, stats] = await Promise.all([
      // Today's orders
      Order.find({
        createdAt: { $gte: today, $lt: tomorrow },
        status: { $in: ['completed', 'partial_refund'] }
      }).sort({ createdAt: -1 }),
      
      // Aggregated stats
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
            status: { $in: ['completed', 'partial_refund'] }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalOrders: { $sum: 1 },
            totalItems: { $sum: { $sum: '$items.quantity' } },
            totalDiscount: { $sum: '$discount.amount' },
            totalTax: { $sum: '$tax.amount' },
            cashSales: {
              $sum: {
                $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0]
              }
            },
            cardSales: {
              $sum: {
                $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$total', 0]
              }
            },
            splitSales: {
              $sum: {
                $cond: [{ $eq: ['$paymentMethod', 'split'] }, '$total', 0]
              }
            }
          }
        }
      ])
    ]);

    const summary = stats[0] || {
      totalSales: 0,
      totalOrders: 0,
      totalItems: 0,
      totalDiscount: 0,
      totalTax: 0,
      cashSales: 0,
      cardSales: 0,
      splitSales: 0
    };

    res.json({
      success: true,
      date: today,
      summary,
      recentOrders: orders.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s sales',
      error: error.message
    });
  }
};

// CANCEL ORDER (Admin only)
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Start transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      // Update order status
      order.status = 'cancelled';
      order.notes = `${order.notes || ''} | Cancelled: ${reason || 'No reason provided'}`;
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        order
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// PROCESS REFUND
export const processRefund = async (req, res) => {
  try {
    const { amount, reason, items } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Order is already refunded'
      });
    }

    const refundAmount = amount || order.total;
    
    if (refundAmount > order.total) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed order total'
      });
    }

    // Start transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // If specific items are being refunded, restore their stock
      if (items && items.length > 0) {
        for (const refundItem of items) {
          await Product.findByIdAndUpdate(
            refundItem.product,
            { $inc: { stock: refundItem.quantity } },
            { session }
          );
        }
      } else if (refundAmount === order.total) {
        // Full refund - restore all stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
      }

      // Update order
      order.status = refundAmount === order.total ? 'refunded' : 'partial_refund';
      order.refund = {
        amount: refundAmount,
        reason,
        date: new Date(),
        processedBy: req.user._id
      };
      
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Refund processed successfully',
        order
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};

// GET SALES REPORT
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Determine grouping format
    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = { $hour: '$createdAt' };
        break;
      case 'day':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'week':
        groupFormat = { $week: '$createdAt' };
        break;
      case 'month':
        groupFormat = { $month: '$createdAt' };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const report = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['completed', 'partial_refund'] }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          totalDiscount: { $sum: '$discount.amount' },
          totalTax: { $sum: '$tax.amount' },
          totalRefunds: { $sum: '$refund.amount' },
          avgOrderValue: { $avg: '$total' },
          paymentMethods: {
            $push: '$paymentMethod'
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['completed', 'partial_refund'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      period: { start, end },
      groupBy,
      report,
      topProducts,
      summary: {
        totalSales: report.reduce((sum, r) => sum + r.totalSales, 0),
        totalOrders: report.reduce((sum, r) => sum + r.totalOrders, 0),
        totalItems: report.reduce((sum, r) => sum + r.totalItems, 0),
        avgOrderValue: report.reduce((sum, r) => sum + r.avgOrderValue, 0) / report.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report',
      error: error.message
    });
  }
};

// Helper function to determine shift
function getShift() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

export default {
  createOrder,
  getAllOrders,
  getOrderById,
  getTodaySales,
  cancelOrder,
  processRefund,
  getSalesReport
};