import Expense from '../models/Expense.js';

const buildFilters = (query) => {
  const { start, end, branch, category, status } = query;
  const filters = {};

  if (start || end) {
    filters.date = {};
    if (start) filters.date.$gte = new Date(start);
    if (end) filters.date.$lte = new Date(end);
  }

  if (branch) filters.branch = branch;
  if (category) filters.category = category;
  if (status) filters.status = status;

  return filters;
};

export const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, export: exportType } = req.query;
    const numericLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);

    const filters = buildFilters(req.query);
    const baseQuery = Expense.find(filters)
      .populate('branch', 'name code')
      .populate('createdBy', 'fullName username')
      .populate('approvedBy', 'fullName username')
      .sort({ date: -1, createdAt: -1 });

    if (exportType === 'csv') {
      const exportItems = await baseQuery.limit(1000);
      const header = ['date', 'category', 'description', 'amount', 'branch', 'paymentMethod', 'status', 'createdBy'];
      const rows = exportItems.map((item) => [
        item.date ? item.date.toISOString() : '',
        item.category || '',
        item.description || '',
        item.amount ?? 0,
        item.branch?.name || '',
        item.paymentMethod || '',
        item.status || '',
        item.createdBy?.fullName || '',
      ]);
      const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
      return res.status(200).send(csv);
    }

    const query = baseQuery
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit);

    const [items, total] = await Promise.all([
      query.exec(),
      Expense.countDocuments(filters),
    ]);

    res.json({
      success: true,
      page: numericPage,
      limit: numericLimit,
      total,
      items,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('branch', 'name code')
      .populate('createdBy', 'fullName username')
      .populate('approvedBy', 'fullName username');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { amount, category, date, description, branch, paymentMethod, reference, status, approvedBy } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    const expense = await Expense.create({
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      description,
      branch,
      paymentMethod,
      reference,
      status,
      approvedBy,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { amount, category, date, description, branch, paymentMethod, reference, status, approvedBy } = req.body;

    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);
    if (description !== undefined) expense.description = description;
    if (branch !== undefined) expense.branch = branch;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (reference !== undefined) expense.reference = reference;
    if (status !== undefined) expense.status = status;
    if (approvedBy !== undefined) expense.approvedBy = approvedBy;

    const updated = await expense.save();

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


