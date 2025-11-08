import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  const deliveryUsers = await User.find({ role: 'delivery' }).select('username fullName role');
  console.log('📦 Delivery Users:');
  deliveryUsers.forEach(u => {
    console.log(`   Username: "${u.username}"`);
    console.log(`   Full Name: "${u.fullName}"`);
    console.log(`   Role: ${u.role}`);
    console.log('   ---');
  });
  
  console.log('\n👥 All Users:');
  const allUsers = await User.find().select('username fullName role');
  allUsers.forEach(u => {
    console.log(`   ${u.role.padEnd(20)} | ${u.username.padEnd(20)} | ${u.fullName}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

