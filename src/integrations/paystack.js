const axios = require('axios');
const SECRET = process.env.PAYSTACK_SECRET;

async function initializePayment({ amount, email, reference }){
  // amount in kobo
  const resp = await axios.post('https://api.paystack.co/transaction/initialize', { amount, email, reference }, { headers: { Authorization: `Bearer ${SECRET}` } });
  return resp.data;
}

function verifySignature(req){
  // For real usage: verify Paystack signature using the secret and request body
  // This is a placeholder returning true for the scaffold
  return true;
}

// Express webhook handler
async function webhookHandler(req, res){
  if (!verifySignature(req)) return res.status(400).end();
  const event = req.body;
  // handle transaction.success => mark escrow funded
  if (event && event.event === 'charge.success'){
    const ref = event.data.reference;
    // lookup escrow by reference and mark funded
    // TODO: implement mapping and calls
  }
  res.json({ ok: true });
}

module.exports = { initializePayment, webhookHandler };
