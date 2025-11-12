const Product = require('../../models/product.model');
const kbBuilders = require('../utils/keyboardBuilders');

async function handleCallback(ctx) {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery();
  if (!data.startsWith('admin_')) return;

  const parts = data.split('_'); // e.g. admin_approve_<id>
  const action = parts[1];
  const id = parts.slice(2).join('_');

  const product = await Product.findById(id);
  if (!product) return ctx.reply('Product not found');

  if (action === 'approve') {
    product.status = 'approved';
    await product.save();
    // notify seller
    await ctx.telegram.sendMessage(product.sellerId, `Your product "${product.title}" has been *approved*.`, { parse_mode: 'Markdown' });
    return ctx.reply('Approved');
  }

  if (action === 'reject') {
    product.status = 'rejected';
    await product.save();
    await ctx.telegram.sendMessage(product.sellerId, `Your product "${product.title}" has been *rejected*.`, { parse_mode: 'Markdown' });
    return ctx.reply('Rejected');
  }
}

module.exports = { handleCallback };
