// Handles a session-based create product flow using inline keyboards and message inputs
const Product = require('../../models/product.model');
const kbBuilders = require('../utils/keyboardBuilders');
const validators = require('../utils/validators');
const statesLoader = require('../utils/statesLoader');

const keyboards = {
  launchMenu: () => kbBuilders.inline(['Sell', 'Browse'], ['sell_start', 'menu_browse'])
};

async function startFlow(ctx) {
  ctx.session.activeFlow = 'createProduct';
  ctx.session.createProduct = { images: [] };
  await ctx.reply('Let\'s create your product. What is the *title*?', { parse_mode: 'Markdown' });
}

async function handleMessage(ctx) {
  const step = ctx.session.createProduct.step || 'title';
  const text = ctx.message && ctx.message.text ? ctx.message.text.trim() : null;

  if (step === 'title') {
    if (!text) return ctx.reply('Please send a text title for your product.');
    if (!validators.title(text)) return ctx.reply('Title invalid — please keep it 3-120 characters.');
    ctx.session.createProduct.title = text;
    ctx.session.createProduct.step = 'description';
    return ctx.reply('Send a short description (max 600 chars)');
  }

  if (step === 'description') {
    if (!text) return ctx.reply('Please send a description.');
    if (!validators.description(text)) return ctx.reply('Description invalid.');
    ctx.session.createProduct.description = text;
    ctx.session.createProduct.step = 'price';
    return ctx.reply('Send the price in Naira as a number (e.g. 25000)');
  }

  if (step === 'price') {
    if (!text || !validators.price(text)) return ctx.reply('Invalid price. Send a number like 15000.');
    ctx.session.createProduct.price = Number(text);
    ctx.session.createProduct.step = 'negotiable';
    const kb = kbBuilders.inline(['Negotiable', 'Non-negotiable'], ['sell_neg_yes', 'sell_neg_no']);
    return ctx.reply('Is the price negotiable?', kb);
  }

  if (step === 'images') {
    // accept photos — up to 5
    const photos = ctx.message.photo;
    if (!photos) return ctx.reply('Please send a photo (or use /skip to skip).');
    const photo = photos[photos.length - 1]; // highest resolution
    ctx.session.createProduct.images.push({ file_id: photo.file_id });
    if (ctx.session.createProduct.images.length >= 5) {
      ctx.session.createProduct.step = 'location';
      return askLocation(ctx);
    }
    return ctx.reply(`Added image (${ctx.session.createProduct.images.length}/5). Send more or press "Done".`, kbBuilders.inline(['Done'], ['sell_images_done']));
  }

  // fallback
  return ctx.reply('Unexpected input. Use the menu.');
}

async function askLocation(ctx) {
  const states = await statesLoader.getStates();
  // show first 9 states as paginated; simple implementation: show all in columns of three per row
  const buttons = [];
  for (let s of states) buttons.push([ { text: s, callback_data: `sell_state_${s}` } ]);
  // fallback using kbBuilders to render raw inline keyboard
  const kb = { reply_markup: { inline_keyboard: buttons } };
  ctx.session.createProduct.step = 'location';
  return ctx.reply('Choose product location (state):', kb);
}

async function handleCallback(ctx) {
  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery();

  if (data === 'sell_start') return startFlow(ctx);
  if (data === 'sell_neg_yes' || data === 'sell_neg_no') {
    ctx.session.createProduct.negotiable = (data === 'sell_neg_yes');
    ctx.session.createProduct.step = 'images';
    return ctx.reply('Send up to 5 images of the product. Send all as separate messages.');
  }

  if (data === 'sell_images_done') {
    ctx.session.createProduct.step = 'location';
    return askLocation(ctx);
  }

  if (data && data.startsWith('sell_state_')) {
    const state = data.replace('sell_state_', '');
    ctx.session.createProduct.location = state;
    // prepare preview
    const p = ctx.session.createProduct;
    let caption = `*Preview*\nTitle: ${p.title}\nPrice: ₦${p.price}\nNegotiable: ${p.negotiable ? 'Yes' : 'No'}\nLocation: ${p.location}\n\n${p.description}`;

    ctx.session.createProduct.step = 'preview';
    // Show first image if exists
    if (p.images && p.images.length) {
      // use file_id if url not available — Telegram will show file_id images when sending
      const fileId = p.images[0].file_id;
      const kb = kbBuilders.inline(['Edit', 'Submit for Approval', 'Cancel'], ['sell_edit', 'sell_submit', 'sell_cancel']);
      await ctx.replyWithPhoto(fileId, { caption, parse_mode: 'Markdown', ...kb });
      return;
    }

    const kb = kbBuilders.inline(['Edit', 'Submit for Approval', 'Cancel'], ['sell_edit', 'sell_submit', 'sell_cancel']);
    return ctx.replyWithMarkdown(caption, kb);
  }

  if (data === 'sell_edit') {
    // allow editing title only in this sample: jump back to title
    ctx.session.createProduct.step = 'title';
    return ctx.reply('Send the new *title*', { parse_mode: 'Markdown' });
  }

  if (data === 'sell_cancel') {
    ctx.session = {};
    return ctx.reply('Product creation cancelled.', keyboards.launchMenu());
  }

  if (data === 'sell_submit') {
    // persist product as pending and notify admin
    const sess = ctx.session.createProduct;
    const prod = await Product.create({
      sellerId: ctx.from.id,
      title: sess.title,
      description: sess.description,
      price: sess.price,
      negotiable: sess.negotiable,
      location: sess.location,
      images: sess.images || []
    });

    // notify admin
    const adminId = Number(process.env.ADMIN_ID);
    if (adminId) {
      const adminKb = kbBuilders.inline(['Approve', 'Reject'], [`admin_approve_${prod._id}`, `admin_reject_${prod._id}`]);
      await ctx.telegram.sendMessage(adminId, `New product pending approval:\n${prod.title}\nPrice: ₦${prod.price}\nSeller: ${ctx.from.id}`, adminKb);
    }

    ctx.session = {};
    return ctx.reply('Product submitted for approval. You will be notified when admin reviews it.', keyboards.launchMenu());
  }

  return ctx.answerCbQuery('Unknown action');
}

module.exports = { handleMessage, handleCallback, keyboards };
