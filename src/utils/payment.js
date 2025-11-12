// Payment helper: provides fee calc + stubs for integration
const axios = require('axios');

exports.calculateFee = (amount) => {
  if (amount <= 10000) return 200;
  if (amount <= 100000) return 500;
  return 1000;
};

// Example stub to create Paystack transaction
exports.createPaystackTransaction = async ({ amount, email, reference, callbackUrl }) => {
  // implement real Paystack call here
  // return { status: true, authorization_url: 'https://paystack...', reference }
  return { status: false, message: 'Paystack integration not yet implemented' };
};

// USSD, Opay, Palmpay should be implemented using provider SDKs/APIs similarly
exports.createUSSDPayment = async (opts) => ({ status: false, message: 'USSD not yet implemented' });
exports.createOpayPayment = async (opts) => ({ status: false, message: 'Opay not yet implemented' });
exports.createPalmpayPayment = async (opts) => ({ status: false, message: 'Palmpay not yet implemented' });
