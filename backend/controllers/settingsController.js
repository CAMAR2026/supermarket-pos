const Settings = require('../models/Settings');
const asyncHandler = require('../utils/asyncHandler');

const getOrCreate = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

exports.getSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrCreate();
  res.json(settings);
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  const fields = [
    'storeName',
    'address',
    'phone',
    'currency',
    'taxRate',
    'receiptFooter',
    'lowStockThreshold',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  });
  if (req.file) {
    settings.logo = `/uploads/${req.file.filename}`;
  }
  await settings.save();
  res.json(settings);
});
