const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  buyerTelegramId: { type: Number, required: true },
  sellerTelegramId: { type: Number, required: true },
  agreedPrice: { type: Number, required: true },
  fee: { type: Number, required: true },
  status: { type: String, enum: ['pending_payment','in_escrow','released','cancelled'], default: 'pending_payment' },
  paymentReference: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

module.exports = mongoose.model('Transaction', transactionSchema);
