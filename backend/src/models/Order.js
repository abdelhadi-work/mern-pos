// ============================================
// FILE: server/src/models/Order.js (FIXED)
// FILE: server/src/models/Order.js (FIXED FOR GUEST ORDERS)
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

// Guest customer schema (embedded, not referenced)
const guestCustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: String,
  address: String
}, { _id: false });

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
        default: 0
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
      enum: ['cash', 'card', 'split', 'transfer', 'credit', 'pending'],
      default: 'pending'
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
      cardLastDigits: String,
      transactionId: String,
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
      default: 'pending'
    },
    // Make cashier optional for guest orders
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null
    },
  //for delivery 
  delivery: {
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Delivery user reference
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'out_for_delivery', 'delivered', 'refunded'],
    default: 'pending',
  },
  deliveredAt: Date,
},

    // Support both referenced and embedded customer data
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false
    },
    // For guest orders without customer account
    guestCustomer: guestCustomerSchema,
    notes: {
      type: String,
      trim: true
    },
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
    session: {
      date: {
        type: Date,
        default: Date.now
      },
      shift: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night', 'online'],
        default: 'morning'
      },
      register: {
        type: String,
        default: 'ONLINE'
      }
    },
    // Flag to identify online orders
    orderSource: {
      type: String,
      enum: ['pos', 'online'],
      default: 'pos'
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// FIXED: Generate unique order number before saving
// ============================================
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the last order with today's date prefix
    // This searches for orderNumber starting with today's date
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const lastOrder = await this.constructor.findOne({
      orderNumber: new RegExp(`^${dateStr}-`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[1]) || 0;
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for customer display
orderSchema.virtual('customerDisplay').get(function() {
  if (this.guestCustomer) {
    return this.guestCustomer;
  }
  if (this.customer) {
    return this.customer;
  }
  return { name: 'Walk-in Customer', phone: 'N/A' };
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ cashier: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'session.date': -1 });
orderSchema.index({ paymentMethod: 1 });
orderSchema.index({ orderSource: 1 });

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;