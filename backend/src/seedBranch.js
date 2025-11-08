import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from './models/Branch.js';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const seedDefaultBranch = async () => {
  try {
    await connectDB();

    // Check if any branch exists
    const existingBranch = await Branch.findOne();
    if (existingBranch) {
      console.log('✅ Branch already exists, skipping seed.');
      process.exit(0);
    }

    // Find first main_admin user to set as creator
    const admin = await User.findOne({ role: 'main_admin' });
    if (!admin) {
      console.error('❌ No main_admin user found. Please create a user first.');
      process.exit(1);
    }

    // Create default branch
    const defaultBranch = await Branch.create({
      name: 'Main Branch',
      code: 'MAIN',
      address: {
        street: '123 Main Street',
        city: 'City',
        state: 'State',
        zipCode: '12345',
        country: 'Country',
      },
      phone: '+1234567890',
      email: 'main@branch.com',
      manager: admin._id,
      isActive: true,
      createdBy: admin._id,
    });

    console.log('✅ Default branch created:', defaultBranch.name);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding branch:', error.message);
    process.exit(1);
  }
};

seedDefaultBranch();

