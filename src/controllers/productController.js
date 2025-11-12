const Product = require('../models/Product');

exports.createPreview = async (payload) => {
  // payload: { sellerTelegramId, title, description, price, negotiable, state, images }
  // validate already done by bot flow
  const preview = {
    ...payload,
    createdAt: new Date()
  };
  return preview;
};

exports.savePendingProduct = async (payload) => {
  const product = new Product(payload);
  await product.save();
  return product;
};

exports.approveProduct = async (productId, adminNote) => {
  const p = await Product.findByIdAndUpdate(productId, { status: 'approved', adminNote, approvedAt: new Date() }, { new: true });
  return p;
};

exports.rejectProduct = async (productId, adminNote) => {
  const p = await Product.findByIdAndUpdate(productId, { status: 'rejected', adminNote }, { new: true });
  return p;
};

exports.getApprovedProducts = async () => {
  return Product.find({ status: 'approved' }).sort({ approvedAt: -1 }).lean();
};
