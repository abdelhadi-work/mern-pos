// ============================================
// FILE: server/src/controllers/categoryController.js (SIMPLIFIED)
// ============================================
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { deleteFile } from '../config/multer.js';

// GET ALL CATEGORIES
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });

    // Add product count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });
        return {
          ...cat.toObject(),
          productCount,
        };
      })
    );

    res.json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET SINGLE CATEGORY
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'fullName username');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({ message: 'Category already exists' });
    }

    const categoryData = {
      name,
      description,
      createdBy: req.user._id,
    };

    if (req.file) {
      categoryData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new name already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        if (req.file) deleteFile(req.file.path);
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    // Update image if new one uploaded
    if (req.file) {
      if (category.image) {
        deleteFile(`uploads/categories/${category.image.split('/').pop()}`);
      }
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    const updatedCategory = await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: category._id });
    if (productsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. ${productsCount} product(s) are using this category.`,
      });
    }

    // Delete image file
    if (category.image) {
      deleteFile(`uploads/categories/${category.image.split('/').pop()}`);
    }

    await category.deleteOne();
    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};