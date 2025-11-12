// Implements a simple escrow state machine for escrowaNG
const Escrow = require('../models/escrow.model');

async function createEscrow({ buyerId, sellerId, productId, amount, fee }){
  const esc = await Escrow.create({ buyerId, sellerId, productId, agreedPrice: amount, fee, status: 'created' });
  return esc;
}

async function fundEscrow(escrowId, paymentRef){
  const esc = await Escrow.findById(escrowId);
  if (!esc) throw new Error('Escrow not found');
  esc.status = 'funded';
  esc.paymentRef = paymentRef;
  await esc.save();
  return esc;
}

async function releaseEscrow(escrowId){
  const esc = await Escrow.findById(escrowId);
  if (!esc) throw new Error('Escrow not found');
  esc.status = 'released';
  await esc.save();
  // TODO: call payment provider transfer to seller
  return esc;
}

async function refundEscrow(escrowId){
  const esc = await Escrow.findById(escrowId);
  if (!esc) throw new Error('Escrow not found');
  esc.status = 'refunded';
  await esc.save();
  // TODO: call refund API
  return esc;
}

module.exports = { createEscrow, fundEscrow, releaseEscrow, refundEscrow };
