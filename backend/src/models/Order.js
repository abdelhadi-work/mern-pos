// ============================================
// FILE: server/src/models/Order.js
// ============================================
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'fixed'
      },
      value: {
        type: Number,
        default: 0,
        min: 0
      },
      amount: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    tax: {
      rate: {
        type: Number,
        default: 0 // 11% VAT for Lebanon
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      }
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'card', 'split', 'transfer', 'credit']
    },
    paymentDetails: {
      amountReceived: {
        type: Number,
        min: 0
      },
      change: {
        type: Number,
        min: 0,
        default: 0
      },
      // For split payments
      cash: {
        type: Number,
        min: 0,
        default: 0
      },
      card: {
        type: Number,
        min: 0,
        default: 0
      },
      // For card payments
      cardLastDigits: String,
      transactionId: String,
      // For credit sales
      creditCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      dueDate: Date,
      isPaid: {
        type: Boolean,
        default: true
      }
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'cancelled', 'refunded', 'partial_refund'],
      default: 'completed'
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    notes: {
      type: String,
      trim: true
    },
    // For refunds
    refund: {
      amount: {
        type: Number,
        min: 0,
        default: 0
      },
      reason: String,
      date: Date,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // Session tracking for daily reports
    session: {
      date: {
        type: Date,
        default: Date.now
      },
      shift: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night'],
        default: 'morning'
      },
      register: {
        type: String,
        default: 'POS-1'
      }
    }
  },
  {
    timestamps: true
  }
);

// Generate unique order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Generate order number: YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last order of the day
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const lastOrder = await this.constructor.findOne({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[1]) || 0;
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for profit calculation
orderSchema.virtual('profit').get(function() {
  // This would need cost data from products
  // Placeholder for profit calculation
  return this.total * 0.3; // Assuming 30% profit margin
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ cashier: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'session.date': -1 });
orderSchema.index({ paymentMethod: 1 });

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;