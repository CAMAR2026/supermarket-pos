const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

exports.getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const withCounts = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({ category: cat._id });
      return { ...cat.toObject(), productCount };
    })
  );
  res.json(withCounts);
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required.' });

  const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (exists) return res.status(400).json({ message: 'Category already exists.' });

  const category = await Category.create({ name, description });
  res.status(201).json(category);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json(category);
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    return res.status(400).json({
      message: `Cannot delete category. ${inUse} product(s) still use it.`,
    });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json({ message: 'Category deleted.' });
});
