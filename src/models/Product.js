const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: String,
  fileId: String
});

const productSchema = new mongoose.Schema({
  sellerTelegramId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  negotiable: { type: Boolean, default: false },
  state: { type: String, required: true },
  images: [imageSchema], // up to 5
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
  adminNote: String
});

module.exports = mongoose.model('Product', productSchema);
