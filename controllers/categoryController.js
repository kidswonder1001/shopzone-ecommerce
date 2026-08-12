const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc  Get all categories (public sees active only, admin flag shows all)
// @route GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { status: 'active' };
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    next(err);
  }
};

// @desc  Create category (admin)
// @route POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, image, status } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const category = await Category.create({ name, image, status });
    res.status(201).json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @desc  Update category (admin)
// @route PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const { name, image, status } = req.body;
    if (name) category.name = name;
    if (image !== undefined) category.image = image;
    if (status) category.status = status;
    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete category (admin)
// @route DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const productsUsingCategory = await Product.countDocuments({ category: category._id });
    if (productsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${productsUsingCategory} product(s) still use this category. Deactivate it instead.`,
      });
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
