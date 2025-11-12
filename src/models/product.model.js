const { Schema, model } = require('mongoose');

const ImageSchema = new Schema({
  url: String,
  file_id: String
}, { _id: false });

const ProductSchema = new Schema({
  sellerId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  negotiable: { type: Boolean, default: false },
  location: { type: String, required: true },
  images: { type: [ImageSchema], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminComment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Product', ProductSchema);
