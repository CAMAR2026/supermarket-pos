const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');

exports.getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }
  const customers = await Customer.find(filter).sort({ name: 1 });
  res.json(customers);
});

exports.createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required.' });
  }
  const exists = await Customer.findOne({ phone });
  if (exists) return res.status(400).json({ message: 'A customer with this phone already exists.' });

  const customer = await Customer.create({ name, phone, email, address, notes });
  res.status(201).json(customer);
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) return res.status(404).json({ message: 'Customer not found.' });
  res.json(customer);
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found.' });
  res.json({ message: 'Customer deleted.' });
});
