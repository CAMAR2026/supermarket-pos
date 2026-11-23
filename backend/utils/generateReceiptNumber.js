const Sale = require('../models/Sale');

const generateReceiptNumber = async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const prefix = `RCP-${y}${m}${d}-`;

  const last = await Sale.findOne({ receiptNumber: new RegExp(`^${prefix}`) })
    .sort({ receiptNumber: -1 })
    .select('receiptNumber');

  let seq = 1;
  if (last?.receiptNumber) {
    const parts = last.receiptNumber.split('-');
    seq = Number(parts[2] || 0) + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};

module.exports = generateReceiptNumber;
