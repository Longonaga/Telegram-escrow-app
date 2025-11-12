// src/controllers/transactionController.js
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const { calculateCharge } = require("../utils/transactionUtils");

exports.initiateEscrow = async (buyerId, sellerId, productId, agreedPrice) => {
  try {
    const charge = calculateCharge(agreedPrice);

    const newTx = await Transaction.create({
      buyerId,
      sellerId,
      productId,
      agreedPrice,
      charge,
      status: "pending_payment",
      createdAt: new Date(),
    });

    return newTx;
  } catch (err) {
    console.error("Error initiating escrow:", err);
  }
};

exports.markAsPaid = async (txId) => {
  const tx = await Transaction.findById(txId);
  if (!tx) return;

  tx.status = "awaiting_confirmation";
  await tx.save();
  return tx;
};

exports.releaseFunds = async (txId) => {
  const tx = await Transaction.findById(txId);
  if (!tx) return;

  tx.status = "completed";
  await tx.save();
  // Here, payout logic will be integrated (Paystack Transfer API)
  return tx;
};
