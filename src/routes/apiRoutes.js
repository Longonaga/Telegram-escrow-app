const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');

// public endpoint for miniapp to fetch approved products
router.get('/products', async (req, res) => {
  const products = await Product.find({ status: 'approved' }).lean().limit(200);
  res.json({ ok: true, products });
});

module.exports = router;
