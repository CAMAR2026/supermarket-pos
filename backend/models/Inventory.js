const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: {
      type: String,
      enum: ['receive', 'sale', 'adjustment', 'refund'],
      required: true,
    },
    quantityChange: { type: Number, required: true },
    previousQuantity: { type: Number, required: true, min: 0 },
    newQuantity: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
  },
  { timestamps: true }
);

inventorySchema.index({ createdAt: -1 });
inventorySchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('Inventory', inventorySchema);
