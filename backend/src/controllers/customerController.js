import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// Create guest customer
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const customer = await Customer.create({ name, email, phone });
    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Place order as guest
export const createCustomerOrder = async (req, res) => {
  try {
    const { customerId, items, paymentMethod, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Update product stock
      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) throw new Error(`${item.name} not found`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
        product.stock -= item.quantity;
        await product.save({ session });
      }

      // Create order
      const order = await Order.create([{
        items,
        total,
        subtotal: total,
        tax: { amount: 0 },
        discount: { amount: 0 },
        paymentMethod,
        cashier: null,
        customer: customerId,
        status: 'completed'
      }], { session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({ success: true, order: order[0] });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
