import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: false, // optional until branches mandatory
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: 0,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer', 'check', 'other'],
      default: 'cash',
    },
    reference: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    attachments: [
      {
        url: String,
        name: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ branch: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;


