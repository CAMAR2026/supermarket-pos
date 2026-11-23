const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Settings = require('../models/Settings');
const generateReceiptNumber = require('../utils/generateReceiptNumber');
const asyncHandler = require('../utils/asyncHandler');

const restoreQuantities = async (deductions, session) => {
  for (const item of deductions) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { quantity: item.qty } },
      session ? { session } : {}
    );
  }
};

const deductStock = async (items, session) => {
  const snapshots = [];
  const deductions = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    if (!item.product || !Number.isInteger(qty) || qty < 1) {
      throw Object.assign(new Error('Each item needs a product and a positive quantity.'), {
        status: 400,
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: item.product, isActive: true, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true, session: session || undefined }
    );

    if (!product) {
      const existing = await Product.findById(item.product).session(session || null);
      const name = existing?.name || 'product';
      const available = existing?.quantity ?? 0;
      throw Object.assign(
        new Error(`Insufficient stock for ${name}. Available: ${available}.`),
        { status: 400 }
      );
    }

    deductions.push({
      productId: product._id,
      qty,
      previousQuantity: product.quantity + qty,
      newQuantity: product.quantity,
    });

    snapshots.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      quantity: qty,
      unitPrice: product.sellingPrice,
      total: Number((product.sellingPrice * qty).toFixed(2)),
    });
  }

  return { snapshots, deductions };
};

exports.getSales = asyncHandler(async (req, res) => {
  const { receipt, from, to, cashier, status } = req.query;
  const filter = {};

  if (receipt) filter.receiptNumber = new RegExp(receipt, 'i');
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (req.user.role === 'cashier') {
    filter.cashier = req.user._id;
  } else if (cashier) {
    filter.cashier = cashier;
  }

  const sales = await Sale.find(filter)
    .populate('cashier', 'name email role')
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 })
    .limit(500);

  res.json(sales);
});

exports.getSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('cashier', 'name email role')
    .populate('customer', 'name phone email');

  if (!sale) return res.status(404).json({ message: 'Sale not found.' });
  if (req.user.role === 'cashier' && String(sale.cashier._id) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only view your own transactions.' });
  }
  res.json(sale);
});

const processSale = async (req, session) => {
  const { items, discount = 0, paymentMethod, amountPaid, customer, mpesaReference, notes } =
    req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('Cart cannot be empty.'), { status: 400 });
  }
  if (!['cash', 'mpesa'].includes(paymentMethod)) {
    throw Object.assign(new Error('Payment method must be cash or mpesa.'), { status: 400 });
  }
  if (paymentMethod === 'mpesa' && !String(mpesaReference || '').trim()) {
    throw Object.assign(new Error('M-Pesa reference is required.'), { status: 400 });
  }

  const settings = await Settings.findOne().session(session || null);
  const taxRate = settings?.taxRate || 0;
  const receiptNumber = await generateReceiptNumber();
  const { snapshots, deductions } = await deductStock(items, session);

  try {
    const subtotal = snapshots.reduce((sum, item) => sum + item.total, 0);
    const discountValue = Math.max(0, Number(discount) || 0);
    if (discountValue > subtotal) {
      throw Object.assign(new Error('Discount cannot exceed subtotal.'), { status: 400 });
    }
    const taxable = subtotal - discountValue;
    const tax = Number(((taxable * taxRate) / 100).toFixed(2));
    const total = Number((taxable + tax).toFixed(2));
    const paid = Number(amountPaid);

    if (!Number.isFinite(paid) || paid < total) {
      throw Object.assign(new Error(`Amount paid must cover the total of ${total}.`), {
        status: 400,
      });
    }

    const saleDocs = await Sale.create(
      [
        {
          receiptNumber,
          cashier: req.user._id,
          customer: customer || null,
          items: snapshots,
          subtotal,
          discount: discountValue,
          taxRate,
          tax,
          total,
          paymentMethod,
          mpesaReference: mpesaReference || '',
          amountPaid: paid,
          change: Number((paid - total).toFixed(2)),
          notes: notes || '',
        },
      ],
      session ? { session } : {}
    );

    const sale = saleDocs[0];

    await Inventory.insertMany(
      deductions.map((d) => ({
        product: d.productId,
        type: 'sale',
        quantityChange: -d.qty,
        previousQuantity: d.previousQuantity,
        newQuantity: d.newQuantity,
        reason: 'POS sale',
        user: req.user._id,
        sale: sale._id,
      })),
      session ? { session } : {}
    );

    return sale;
  } catch (error) {
    await restoreQuantities(deductions, session);
    throw error;
  }
};

exports.createSale = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let sale;

  try {
    session.startTransaction();
    sale = await processSale(req, session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    const standalone = /Transaction numbers are only allowed|replica set/i.test(error.message || '');
    if (standalone) {
      try {
        sale = await processSale(req, null);
      } catch (fallbackError) {
        session.endSession();
        return res
          .status(fallbackError.status || 500)
          .json({ message: fallbackError.message || 'Sale failed.' });
      }
    } else {
      session.endSession();
      return res.status(error.status || 500).json({ message: error.message || 'Sale failed.' });
    }
  }

  session.endSession();

  const populated = await Sale.findById(sale._id)
    .populate('cashier', 'name email')
    .populate('customer', 'name phone');

  res.status(201).json(populated);
});

exports.refundSale = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can refund transactions.' });
  }

  const sale = await Sale.findById(req.params.id);
  if (!sale) return res.status(404).json({ message: 'Sale not found.' });
  if (sale.status !== 'completed') {
    return res.status(400).json({ message: 'Only completed sales can be refunded.' });
  }

  for (const item of sale.items) {
    if (!item.product) continue;
    const product = await Product.findById(item.product);
    if (!product) continue;
    const previousQuantity = product.quantity;
    product.quantity += item.quantity;
    await product.save();
    await Inventory.create({
      product: product._id,
      type: 'refund',
      quantityChange: item.quantity,
      previousQuantity,
      newQuantity: product.quantity,
      reason: `Refund ${sale.receiptNumber}`,
      user: req.user._id,
      sale: sale._id,
    });
  }

  sale.status = 'refunded';
  sale.notes = [sale.notes, req.body.reason].filter(Boolean).join(' | ');
  await sale.save();

  res.json(sale);
});
