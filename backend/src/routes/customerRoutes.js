import express from 'express';
import { createCustomer, createCustomerOrder } from '../controllers/customerController.js';

const router = express.Router();

// Public routes (no auth)
router.post('/', createCustomer);        // Create guest customer
router.post('/order', createCustomerOrder); // Guest place order

export default router;
