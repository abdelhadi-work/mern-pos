import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();  // Load environment variables

const seedUsers = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Clear existing users
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Create sample users
    const users = [
      {
        username: 'admin',
        email: 'admin@pos.com',
        password: 'admin123',  // You can hash passwords here manually if needed
        fullName: 'Main Administrator',
        phone: '+1234567890',
        role: 'main_admin',
        isActive: true,
      },
      {
        username: 'finance',
        email: 'finance@pos.com',
        password: 'finance123',
        fullName: 'Finance Administrator',
        phone: '+1234567891',
        role: 'finance_admin',
        isActive: true,
      },
      {
        username: 'accounting',
        email: 'accounting@pos.com',
        password: 'accounting123',
        fullName: 'Accounting Administrator',
        phone: '+1234567892',
        role: 'accounting_admin',
        isActive: true,
      },
      {
        username: 'cashier',
        email: 'cashier@pos.com',
        password: 'cashier123',
        fullName: 'Cashier User',
        phone: '+1234567893',
        role: 'cashier',
        isActive: true,
      },
    ];

    // Insert users into the database
    for (let user of users) {
      const newUser = new User(user);
      await newUser.save();  // This will trigger the password hashing (due to pre-save hook)
    }

    console.log('Sample users seeded successfully');
    process.exit();  // Exit the script after seeding
  } catch (error) {
    console.error(`Error seeding data: ${error}`);
    process.exit(1);
  }
};

seedUsers();  // Call the seeding function
