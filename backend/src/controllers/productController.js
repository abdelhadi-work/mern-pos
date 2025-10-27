// ============================================
// FILE: server/src/controllers/productController.js (SIMPLIFIED)
// ============================================
import Product from '../models/Product.js';
import { deleteFile } from '../config/multer.js';

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET SINGLE PRODUCT
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'fullName username');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data || '{}');

    const { name, sku, barcode, category, description, brand, price, costPrice, stock, minStock, unit } = productData;

    if (!name || !sku || !category || !price || stock === undefined) {
      if (req.files) req.files.forEach((file) => deleteFile(file.path));
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingProduct = await Product.findOne({
      $or: [{ sku }, ...(barcode ? [{ barcode }] : [])],
    });

    if (existingProduct) {
      if (req.files) req.files.forEach((file) => deleteFile(file.path));
      return res.status(400).json({ message: 'Product with this SKU or Barcode already exists' });
    }

    const images = req.files ? req.files.map((file) => `/uploads/products/${file.filename}`) : [];

    const product = await Product.create({
      name,
      sku,
      barcode,
      category,
      description,
      brand,
      price,
      costPrice,
      stock,
      minStock,
      unit,
      images,
      createdBy: req.user._id,
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('createdBy', 'fullName username');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populatedProduct,
    });
  } catch (error) {
    if (req.files) req.files.forEach((file) => deleteFile(file.path));
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const productData = JSON.parse(req.body.data || '{}');
    const product = await Product.findById(req.params.id);

    if (!product) {
      if (req.files) req.files.forEach((file) => deleteFile(file.path));
      return res.status(404).json({ message: 'Product not found' });
    }

    const { sku, barcode } = productData;
    
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({ sku });
      if (existingSku) {
        if (req.files) req.files.forEach((file) => deleteFile(file.path));
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        if (req.files) req.files.forEach((file) => deleteFile(file.path));
        return res.status(400).json({ message: 'Barcode already exists' });
      }
    }

    Object.keys(productData).forEach((key) => {
      if (productData[key] !== undefined) {
        product[key] = productData[key];
      }
    });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/products/${file.filename}`);
      product.images = [...(product.images || []), ...newImages];
    }

    const updatedProduct = await product.save();
    const populatedProduct = await Product.findById(updatedProduct._id)
      .populate('category', 'name')
      .populate('createdBy', 'fullName username');

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: populatedProduct,
    });
  } catch (error) {
    if (req.files) req.files.forEach((file) => deleteFile(file.path));
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        deleteFile(`uploads/products/${img.split('/').pop()}`);
      });
    }

    await product.deleteOne();
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET LOW STOCK PRODUCTS
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true,
    })
      .populate('category', 'name')
      .sort({ stock: 1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};