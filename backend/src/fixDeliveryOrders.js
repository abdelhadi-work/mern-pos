import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  // Find the "delivery" user
  const deliveryUser = await User.findOne({ username: 'delivery' });
  
  if (!deliveryUser) {
    console.log('❌ Delivery user not found');
    process.exit(1);
  }
  
  console.log(`✅ Found delivery user: ${deliveryUser.username} (${deliveryUser.fullName})`);
  console.log(`   ID: ${deliveryUser._id}\n`);
  
  // Update all orders that have delivery.assignedTo set to any user
  const result = await Order.updateMany(
    { 'delivery.assignedTo': { $exists: true, $ne: null } },
    { $set: { 'delivery.assignedTo': deliveryUser._id } }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} orders`);
  console.log(`   Matched: ${result.matchedCount} orders\n`);
  
  // Show the updated orders
  const orders = await Order.find({ 'delivery.assignedTo': deliveryUser._id })
    .select('orderNumber guestCustomer.name delivery.status total')
    .limit(10);
  
  console.log(`📦 Orders assigned to ${deliveryUser.username}:`);
  orders.forEach(order => {
    console.log(`   ${order.orderNumber} - ${order.guestCustomer?.name || 'N/A'} - $${order.total} - ${order.delivery.status}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

