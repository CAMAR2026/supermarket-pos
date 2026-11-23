const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'SuperMarket POS' },
    logo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    currency: { type: String, default: 'KSh' },
    taxRate: { type: Number, default: 0, min: 0 },
    receiptFooter: { type: String, default: 'Thank you for shopping with us!' },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
