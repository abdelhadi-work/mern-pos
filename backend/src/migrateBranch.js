import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from './models/Branch.js';
import Order from './models/Order.js';
import Product from './models/Product.js';
import connectDB from './config/db.js';

dotenv.config();

const migrateBranchData = async () => {
  try {
    await connectDB();

    // Find default branch
    const defaultBranch = await Branch.findOne({ code: 'MAIN' });
    if (!defaultBranch) {
      console.error('❌ Default branch not found. Please run seedBranch.js first.');
      process.exit(1);
    }

    console.log(`✅ Found default branch: ${defaultBranch.name} (${defaultBranch._id})`);

    // Update orders without branch
    const ordersResult = await Order.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: defaultBranch._id } }
    );
    console.log(`✅ Updated ${ordersResult.modifiedCount} orders with default branch`);

    // Update products without branch
    const productsResult = await Product.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: defaultBranch._id } }
    );
    console.log(`✅ Updated ${productsResult.modifiedCount} products with default branch`);

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
};

migrateBranchData();

