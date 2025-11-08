// ============================================
// Assign Orders to Delivery User
// ============================================
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import User from './models/User.js';
import Product from './models/Product.js';

dotenv.config();

const assignDeliveryOrders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Find delivery user
    const deliveryUser = await User.findOne({ role: 'delivery' });
    
    if (!deliveryUser) {
      console.log('❌ No delivery user found. Creating one...');
      
      // Create delivery user if doesn't exist
      const newDeliveryUser = await User.create({
        username: 'delivery',
        password: 'delivery123',
        fullName: 'Delivery Driver',
        role: 'delivery'
      });
      
      console.log('✅ Created delivery user:', newDeliveryUser.username);
      
      // Assign orders to new user
      await assignOrders(newDeliveryUser._id);
    } else {
      console.log('✅ Found delivery user:', deliveryUser.username);
      await assignOrders(deliveryUser._id);
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const assignOrders = async (deliveryUserId) => {
  // Find completed orders without delivery assignment
  const orders = await Order.find({
    status: 'completed',
    'delivery.assignedTo': null,
    guestCustomer: { $exists: true, $ne: null }
  })
  .limit(5)
  .sort({ createdAt: -1 });

  console.log(`\n📦 Found ${orders.length} orders to assign`);

  if (orders.length === 0) {
    console.log('\n⚠️  No suitable orders found. Creating test orders...');
    await createTestOrders(deliveryUserId);
    return;
  }

  // Assign orders to delivery user
  for (const order of orders) {
    order.delivery = {
      assignedTo: deliveryUserId,
      status: 'pending',
      deliveredAt: null
    };
    
    await order.save();
    console.log(`✅ Assigned order ${order.orderNumber} to delivery user`);
  }

  console.log(`\n✅ Successfully assigned ${orders.length} orders to delivery user`);
};

const createTestOrders = async (deliveryUserId) => {
  // Get a product for the order
  const products = await Product.find().limit(3);

  if (products.length === 0) {
    console.log('❌ No products found. Please add products first.');
    return;
  }

  // Create 3 test delivery orders
  const testOrders = [
    {
      guestCustomer: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St, Apt 4B, New York, NY 10001'
      },
      items: [{
        product: products[0]._id,
        name: products[0].name,
        price: products[0].price,
        quantity: 2,
        total: products[0].price * 2
      }],
      subtotal: products[0].price * 2,
      tax: { rate: 0, amount: 0 },
      discount: { type: 'fixed', value: 0, amount: 0 },
      total: products[0].price * 2,
      paymentMethod: 'pending',
      status: 'completed',
      delivery: {
        assignedTo: deliveryUserId,
        status: 'pending'
      }
    },
    {
      guestCustomer: {
        name: 'Jane Smith',
        phone: '+1987654321',
        email: 'jane@example.com',
        address: '456 Oak Ave, Suite 12, Los Angeles, CA 90001'
      },
      items: [{
        product: products[1]._id,
        name: products[1].name,
        price: products[1].price,
        quantity: 1,
        total: products[1].price
      }],
      subtotal: products[1].price,
      tax: { rate: 0, amount: 0 },
      discount: { type: 'fixed', value: 0, amount: 0 },
      total: products[1].price,
      paymentMethod: 'pending',
      status: 'completed',
      delivery: {
        assignedTo: deliveryUserId,
        status: 'pending'
      }
    },
    {
      guestCustomer: {
        name: 'Bob Johnson',
        phone: '+1555123456',
        email: 'bob@example.com',
        address: '789 Pine Rd, Building C, Chicago, IL 60601'
      },
      items: [{
        product: products[2]._id,
        name: products[2].name,
        price: products[2].price,
        quantity: 3,
        total: products[2].price * 3
      }],
      subtotal: products[2].price * 3,
      tax: { rate: 0, amount: 0 },
      discount: { type: 'fixed', value: 0, amount: 0 },
      total: products[2].price * 3,
      paymentMethod: 'pending',
      status: 'completed',
      delivery: {
        assignedTo: deliveryUserId,
        status: 'pending'
      }
    }
  ];

  for (const orderData of testOrders) {
    const order = await Order.create(orderData);
    console.log(`✅ Created test order ${order.orderNumber} for ${orderData.guestCustomer.name}`);
  }

  console.log(`\n✅ Created ${testOrders.length} test delivery orders`);
};

assignDeliveryOrders();

