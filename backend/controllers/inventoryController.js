const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Settings = require('../models/Settings');
const asyncHandler = require('../utils/asyncHandler');

exports.getInventory = asyncHandler(async (req, res) => {
  const { stock } = req.query;
  const filter = {};
  if (stock === 'out') filter.quantity = 0;
  if (stock === 'low') {
    filter.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    filter.quantity = { $gt: 0 };
  }

  const products = await Product.find(filter).populate('category', 'name').sort({ name: 1 });
  const settings = await Settings.findOne();
  const threshold = settings?.lowStockThreshold ?? 10;

  res.json({
    threshold,
    products,
    lowStock: await Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
      quantity: { $gt: 0 },
    }).populate('category', 'name'),
    outOfStock: await Product.find({ quantity: 0 }).populate('category', 'name'),
  });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const { product, type } = req.query;
  const filter = {};
  if (product) filter.product = product;
  if (type) filter.type = type;

  const history = await Inventory.find(filter)
    .populate('product', 'name sku')
    .populate('user', 'name role')
    .populate('sale', 'receiptNumber')
    .sort({ createdAt: -1 })
    .limit(500);

  res.json(history);
});

exports.adjustStock = asyncHandler(async (req, res) => {
  const { quantity, type, reason } = req.body;
  const qty = Number(quantity);

  if (!['receive', 'adjustment'].includes(type)) {
    return res.status(400).json({ message: 'Type must be receive or adjustment.' });
  }
  if (!Number.isFinite(qty) || qty === 0) {
    return res.status(400).json({ message: 'Enter a valid quantity.' });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const previousQuantity = product.quantity;
  let newQuantity = previousQuantity;

  if (type === 'receive') {
    if (qty < 0) return res.status(400).json({ message: 'Received quantity must be positive.' });
    newQuantity = previousQuantity + qty;
  } else {
    newQuantity = previousQuantity + qty;
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Adjustment would result in negative stock.' });
    }
  }

  product.quantity = newQuantity;
  await product.save();

  const log = await Inventory.create({
    product: product._id,
    type,
    quantityChange: type === 'receive' ? qty : qty,
    previousQuantity,
    newQuantity,
    reason: reason || (type === 'receive' ? 'Stock received' : 'Manual adjustment'),
    user: req.user._id,
  });

  res.json({ product, log });
});
