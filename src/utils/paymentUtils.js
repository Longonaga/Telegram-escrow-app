// src/utils/paymentUtils.js
function calculateFee(amount) {
  if (amount <= 5000) return 200;
  if (amount <= 20000) return 400;
  if (amount <= 50000) return 700;
  if (amount <= 100000) return 1000;
  return Math.ceil(amount * 0.012); // 1.2% for large amounts
}

module.exports = { calculateFee };
