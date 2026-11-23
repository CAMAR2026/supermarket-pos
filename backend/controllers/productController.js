const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category, stock } = req.query;
  const filter = {};

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { sku: regex }, { barcode: regex }];
  }
  if (category) filter.category = category;
  if (stock === 'low') {
    filter.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
  }
  if (stock === 'out') filter.quantity = 0;

  const products = await Product.find(filter).populate('category', 'name').sort({ name: 1 });
  res.json(products);
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(product);
});

exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    barcode,
    category,
    purchasePrice,
    sellingPrice,
    quantity,
    unit,
    lowStockThreshold,
  } = req.body;

  if (!name || !sku || !category) {
    return res.status(400).json({ message: 'Name, SKU and category are required.' });
  }
  if (Number(sellingPrice) < 0 || Number(purchasePrice) < 0) {
    return res.status(400).json({ message: 'Prices cannot be negative.' });
  }
  if (Number(quantity) < 0) {
    return res.status(400).json({ message: 'Quantity cannot be negative.' });
  }

  const exists = await Product.findOne({ sku: sku.toUpperCase() });
  if (exists) return res.status(400).json({ message: 'SKU already exists.' });

  const product = await Product.create({
    name,
    sku,
    barcode,
    category,
    purchasePrice,
    sellingPrice,
    quantity: quantity || 0,
    unit,
    lowStockThreshold,
    image: req.file ? `/uploads/${req.file.filename}` : '',
  });

  const populated = await product.populate('category', 'name');
  res.status(201).json(populated);
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const fields = [
    'name',
    'sku',
    'barcode',
    'category',
    'purchasePrice',
    'sellingPrice',
    'unit',
    'lowStockThreshold',
    'isActive',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.body.purchasePrice !== undefined && Number(req.body.purchasePrice) < 0) {
    return res.status(400).json({ message: 'Prices cannot be negative.' });
  }
  if (req.body.sellingPrice !== undefined && Number(req.body.sellingPrice) < 0) {
    return res.status(400).json({ message: 'Prices cannot be negative.' });
  }

  if (req.file) {
    product.image = `/uploads/${req.file.filename}`;
  }

  await product.save();
  const populated = await product.populate('category', 'name');
  res.json(populated);
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ message: 'Product deleted.' });
});
