const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const rangeFor = (period) => {
  const now = new Date();
  if (period === 'weekly') {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 6);
    return { from, to: now };
  }
  if (period === 'monthly') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to: now };
  }
  return { from: startOfDay(now), to: now };
};

exports.dashboard = asyncHandler(async (_req, res) => {
  const today = rangeFor('daily');
  const month = rangeFor('monthly');

  const [
    totalProducts,
    totalUsers,
    totalTransactions,
    completedSales,
    todaySales,
    monthSales,
    lowStock,
    recent,
  ] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Sale.countDocuments({ status: 'completed' }),
    Sale.find({ status: 'completed' }).select('total createdAt items'),
    Sale.find({ status: 'completed', createdAt: { $gte: today.from, $lte: today.to } }),
    Sale.find({ status: 'completed', createdAt: { $gte: month.from, $lte: month.to } }),
    Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    })
      .populate('category', 'name')
      .sort({ quantity: 1 })
      .limit(10),
    Sale.find({ status: 'completed' })
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .limit(8),
  ]);

  const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);

  const dailyChart = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const daySales = completedSales.filter((s) => s.createdAt >= day && s.createdAt < next);
    dailyChart.push({
      label: day.toLocaleDateString('en-KE', { weekday: 'short' }),
      total: daySales.reduce((sum, s) => sum + s.total, 0),
      count: daySales.length,
    });
  }

  const monthlyChart = [];
  for (let i = 5; i >= 0; i -= 1) {
    const from = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    const bucket = completedSales.filter((s) => s.createdAt >= from && s.createdAt < to);
    monthlyChart.push({
      label: from.toLocaleDateString('en-KE', { month: 'short' }),
      total: bucket.reduce((sum, s) => sum + s.total, 0),
      count: bucket.length,
    });
  }

  res.json({
    totalProducts,
    totalUsers,
    totalTransactions,
    totalRevenue,
    todayRevenue,
    monthRevenue,
    todayTransactions: todaySales.length,
    lowStock,
    recent,
    dailyChart,
    monthlyChart,
  });
});

exports.salesReport = asyncHandler(async (req, res) => {
  const { period = 'daily', from, to } = req.query;
  let range = rangeFor(period);
  if (from) range.from = new Date(from);
  if (to) {
    range.to = new Date(to);
    range.to.setHours(23, 59, 59, 999);
  }

  const sales = await Sale.find({
    status: 'completed',
    createdAt: { $gte: range.from, $lte: range.to },
  })
    .populate('cashier', 'name')
    .sort({ createdAt: -1 });

  const productMap = {};
  const cashierMap = {};

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productMap[item.name]) {
        productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productMap[item.name].quantity += item.quantity;
      productMap[item.name].revenue += item.total;
    });
    const cashierName = sale.cashier?.name || 'Unknown';
    if (!cashierMap[cashierName]) {
      cashierMap[cashierName] = { name: cashierName, transactions: 0, revenue: 0 };
    }
    cashierMap[cashierName].transactions += 1;
    cashierMap[cashierName].revenue += sale.total;
  });

  const bestSellers = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
  const cashierPerformance = Object.values(cashierMap).sort((a, b) => b.revenue - a.revenue);

  res.json({
    period,
    from: range.from,
    to: range.to,
    transactionCount: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
    totalDiscount: sales.reduce((sum, s) => sum + s.discount, 0),
    totalTax: sales.reduce((sum, s) => sum + s.tax, 0),
    sales,
    bestSellers,
    cashierPerformance,
  });
});

exports.stockReport = asyncHandler(async (_req, res) => {
  const products = await Product.find().populate('category', 'name').sort({ name: 1 });
  const value = products.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0);
  res.json({
    productCount: products.length,
    stockValue: value,
    products,
  });
});
