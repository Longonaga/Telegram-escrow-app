const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET approved products (JSON) for mini web app
router.get('/products', async (req, res) => {
  try {
    const list = await productController.getApprovedProducts();
    res.json({ ok: true, products: list });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
