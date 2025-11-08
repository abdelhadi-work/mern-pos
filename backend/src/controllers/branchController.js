import Branch from '../models/Branch.js';

// GET all branches
export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find()
      .populate('manager', 'fullName username email')
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: branches.length,
      branches,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET single branch
export const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('manager', 'fullName username email')
      .populate('createdBy', 'fullName username');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE branch
export const createBranch = async (req, res) => {
  try {
    const { name, code, address, phone, email, manager } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    const existingBranch = await Branch.findOne({ $or: [{ name }, { code }] });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch name or code already exists' });
    }

    const branch = await Branch.create({
      name,
      code: code.toUpperCase(),
      address,
      phone,
      email,
      manager,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      branch,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE branch
export const updateBranch = async (req, res) => {
  try {
    const { name, code, address, phone, email, manager, isActive } = req.body;

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check if new name/code already exists
    if (name && name !== branch.name) {
      const existing = await Branch.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: 'Branch name already exists' });
      }
    }

    if (code && code !== branch.code) {
      const existing = await Branch.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ message: 'Branch code already exists' });
      }
    }

    branch.name = name || branch.name;
    branch.code = code ? code.toUpperCase() : branch.code;
    branch.address = address !== undefined ? address : branch.address;
    branch.phone = phone !== undefined ? phone : branch.phone;
    branch.email = email !== undefined ? email : branch.email;
    branch.manager = manager !== undefined ? manager : branch.manager;
    branch.isActive = isActive !== undefined ? isActive : branch.isActive;

    const updatedBranch = await branch.save();

    res.json({
      success: true,
      message: 'Branch updated successfully',
      branch: updatedBranch,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE branch
export const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check if branch has associated orders/products
    const Order = (await import('../models/Order.js')).default;
    const Product = (await import('../models/Product.js')).default;
    
    const ordersCount = await Order.countDocuments({ branch: branch._id });
    const productsCount = await Product.countDocuments({ branch: branch._id });

    if (ordersCount > 0 || productsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete branch. ${ordersCount} order(s) and ${productsCount} product(s) are associated with this branch.`,
      });
    }

    await branch.deleteOne();
    res.json({
      success: true,
      message: 'Branch deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

