const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Settings = require('../models/Settings');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');

const seed = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('<username>')) {
    throw new Error('Set MONGO_URI in backend/.env before seeding.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Product.deleteMany(),
    Customer.deleteMany(),
    Settings.deleteMany(),
    Sale.deleteMany(),
    Inventory.deleteMany(),
  ]);

  const [admin, cashier, stock] = await User.create([
    {
      name: 'Store Owner',
      email: 'admin@supermarket.com',
      password: 'admin123',
      role: 'admin',
      phone: '0700000001',
    },
    {
      name: 'Jane Cashier',
      email: 'cashier@supermarket.com',
      password: 'cashier123',
      role: 'cashier',
      phone: '0700000002',
    },
    {
      name: 'Peter Stock',
      email: 'stock@supermarket.com',
      password: 'stock123',
      role: 'stock_manager',
      phone: '0700000003',
    },
  ]);

  const categories = await Category.create([
    { name: 'Beverages', description: 'Drinks and juices' },
    { name: 'Food', description: 'Packaged and dry foods' },
    { name: 'Electronics', description: 'Small electronics' },
    { name: 'Cosmetics', description: 'Personal care' },
    { name: 'Household items', description: 'Cleaning and home' },
    { name: 'Fruits and vegetables', description: 'Fresh produce' },
  ]);

  const byName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  const products = await Product.create([
    {
      name: 'Coca-Cola 500ml',
      sku: 'DRK001',
      barcode: '123456789',
      category: byName.Beverages,
      purchasePrice: 50,
      sellingPrice: 70,
      quantity: 100,
    },
    {
      name: 'Bread',
      sku: 'FD001',
      barcode: '111111111',
      category: byName.Food,
      purchasePrice: 50,
      sellingPrice: 70,
      quantity: 40,
    },
    {
      name: 'Milk 500ml',
      sku: 'FD002',
      barcode: '222222222',
      category: byName.Food,
      purchasePrice: 50,
      sellingPrice: 65,
      quantity: 35,
    },
    {
      name: 'Sugar 2kg',
      sku: 'FD003',
      barcode: '333333333',
      category: byName.Food,
      purchasePrice: 140,
      sellingPrice: 180,
      quantity: 50,
    },
    {
      name: 'Cooking Oil 1L',
      sku: 'FD004',
      barcode: '444444444',
      category: byName.Food,
      purchasePrice: 220,
      sellingPrice: 280,
      quantity: 8,
    },
    {
      name: 'Maize Flour 2kg',
      sku: 'FD005',
      barcode: '555555555',
      category: byName.Food,
      purchasePrice: 150,
      sellingPrice: 190,
      quantity: 60,
    },
    {
      name: 'Bottled Water 1L',
      sku: 'DRK002',
      barcode: '666666666',
      category: byName.Beverages,
      purchasePrice: 30,
      sellingPrice: 50,
      quantity: 80,
    },
    {
      name: 'Bar Soap',
      sku: 'HH001',
      barcode: '777777777',
      category: byName['Household items'],
      purchasePrice: 40,
      sellingPrice: 60,
      quantity: 25,
    },
    {
      name: 'Toothpaste',
      sku: 'COS001',
      barcode: '888888888',
      category: byName.Cosmetics,
      purchasePrice: 90,
      sellingPrice: 130,
      quantity: 18,
    },
    {
      name: 'Bananas (bunch)',
      sku: 'FR001',
      barcode: '999999999',
      category: byName['Fruits and vegetables'],
      purchasePrice: 80,
      sellingPrice: 120,
      quantity: 12,
    },
    {
      name: 'USB Flash Drive 32GB',
      sku: 'EL001',
      barcode: '101010101',
      category: byName.Electronics,
      purchasePrice: 450,
      sellingPrice: 650,
      quantity: 6,
    },
    {
      name: 'Rice 5kg',
      sku: 'FD006',
      barcode: '121212121',
      category: byName.Food,
      purchasePrice: 650,
      sellingPrice: 780,
      quantity: 0,
    },
  ]);

  await Customer.create([
    { name: 'Walk-in Regular', phone: '0711111111', email: 'regular@example.com' },
    { name: 'Mary Wanjiku', phone: '0722222222', address: 'Nairobi' },
  ]);

  await Settings.create({
    storeName: 'FreshMart Supermarket',
    address: 'Moi Avenue, Nairobi',
    phone: '020 123 4567',
    currency: 'KSh',
    taxRate: 0,
    receiptFooter: 'Goods once sold are not returnable. Karibu tena!',
    lowStockThreshold: 10,
  });

  console.log('Seed complete.');
  console.log('Admin:   admin@supermarket.com / admin123');
  console.log('Cashier: cashier@supermarket.com / cashier123');
  console.log('Stock:   stock@supermarket.com / stock123');
  console.log(`Products: ${products.length} | Users: ${admin.email}, ${cashier.email}, ${stock.email}`);

  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
