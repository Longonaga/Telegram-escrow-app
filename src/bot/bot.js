require('dotenv').config();
const { Telegraf, session, Markup } = require('telegraf');
const ProductController = require('../controllers/productController');
const stateAPI = require('../utils/stateAPI');
const validate = require('../utils/validation');
const User = require('../models/User');
const Product = require('../models/Product');
const { calculateFee } = require('../utils/payment');

let bot;

const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean).map(Number);

const LAUNCH_MENU = (ctx) => Markup.inlineKeyboard([
  [ Markup.button.callback('🛒 Browse Products', 'browse_products') ],
  [ Markup.button.callback('📤 Sell a Product', 'sell_start'), Markup.button.callback('🔔 Notifications', 'notify_menu') ],
  [ Markup.button.callback('📨 Contact Admin', 'contact_admin') ]
]);

const buildProductPreviewText = (p) => {
  const imgs = p.images?.map((i, idx) => `Image ${idx+1}: ${i.url ? 'URL' : (i.fileId ? 'fileId' : 'none')}`).join('\n') || '';
  return `📦 *${p.title}*\n\n${p.description}\n\n💰 Price: ₦${p.price} ${p.negotiable ? '(Negotiable)' : ''}\n📍 State: ${p.state}\n\n${imgs}`;
};

const createOrUpdateUser = async (tgUser) => {
  await User.findOneAndUpdate(
    { telegramId: tgUser.id },
    { telegramId: tgUser.id, username: tgUser.username, firstName: tgUser.first_name, lastName: tgUser.last_name },
    { upsert: true }
  );
};

function ensureSessionStructure(ctx) {
  if (!ctx.session) ctx.session = {};
  if (!ctx.session.flow) ctx.session.flow = {};
}

const initBot = () => {
  bot = new Telegraf(process.env.BOT_TOKEN);
  bot.use(session());

  // welcome on start or when user sends any message to bot (we handle via message fallback)
  bot.on('message', async (ctx, next) => {
    ensureSessionStructure(ctx);
    const from = ctx.from;
    await createOrUpdateUser(from);
    // Show launch menu (text + inline keyboard) when user messages the bot
    await ctx.replyWithMarkdown(`Hello, *${from.username || from.first_name || 'there'}*! Welcome to *escrowaNG* — your escrow marketplace. Choose an option below:`, LAUNCH_MENU(ctx));
    // don't call next() to prevent other handlers from reacting to the same message
  });

  // callback queries drive all navigation
  bot.on('callback_query', async (ctx) => {
    ensureSessionStructure(ctx);
    const data = ctx.callbackQuery.data;

    try {
      // Launch menu actions
      if (data === 'browse_products') {
        // provide mini web app link (served from same server)
        const base = process.env.BASE_URL || `https://t.me/${ctx.botInfo.username}`;
        // link to mini web app route:
        const miniUrl = `${process.env.BASE_URL || 'https://yourdomain.com'}/mini/index.html`;
        await ctx.answerCbQuery();
        await ctx.reply(`Open the marketplace in the mini-web app: ${miniUrl}\n\n(Click the dialog's link to open)`);
        return;
      }

      if (data === 'sell_start') {
        ctx.session.flow = { name: 'sell_product', step: 'title', payload: { images: [] } };
        await ctx.answerCbQuery();
        await ctx.reply('Great — let\'s create your product card.\nFirst, send the *title* of the product (3-120 characters).', { parse_mode: 'Markdown' });
        return;
      }

      if (data === 'notify_menu') {
        await ctx.answerCbQuery('Notification subscriptions coming soon');
        await ctx.reply('Notification features will be available here. Use the floating button in the launch menu to subscribe.');
        return;
      }

      if (data === 'contact_admin') {
        await ctx.answerCbQuery();
        await ctx.reply('Please type your message and it will be forwarded to the admins. After you send it, your session will return to the launch menu.');
        ctx.session.flow = { name: 'contact_admin', step: 'await_message' };
        return;
      }

      // Administration actions (approve / reject)
      if (data.startsWith('admin_approve_') || data.startsWith('admin_reject_')) {
        const parts = data.split('_');
        const action = parts[1]; // approve or reject
        const productId = parts.slice(2).join('_');
        const adminId = ctx.from.id;
        if (!ADMIN_IDS.includes(adminId)) {
          await ctx.answerCbQuery('You are not an admin.');
          return;
        }

        if (action === 'approve') {
          const p = await ProductController.approveProduct(productId, `Approved by ${adminId}`);
          // notify seller
          await bot.telegram.sendMessage(p.sellerTelegramId, `✅ Your product "${p.title}" has been approved by admin.`);
          await ctx.answerCbQuery('Product approved');
          await ctx.editMessageReplyMarkup(); // remove inline buttons
          return;
        } else {
          const p = await ProductController.rejectProduct(productId, `Rejected by ${adminId}`);
          await bot.telegram.sendMessage(p.sellerTelegramId, `❌ Your product "${p.title}" was rejected by admin.`);
          await ctx.answerCbQuery('Product rejected');
          await ctx.editMessageReplyMarkup();
          return;
        }
      }

      await ctx.answerCbQuery();
    } catch (err) {
      console.error('callback_query error', err);
      await ctx.answerCbQuery('An error occurred. Try again later.');
    }
  });

  // Handle messages according to flow (no hears/commands)
  bot.on('message', async (ctx) => {
    ensureSessionStructure(ctx);
    const flow = ctx.session.flow;

    // If no active flow, show launch menu (handled earlier but safe fallback)
    if (!flow || !flow.name) {
      await ctx.reply('Choose an option from the menu.', LAUNCH_MENU(ctx));
      return;
    }

    // SELL FLOW
    if (flow.name === 'sell_product') {
      if (flow.step === 'title') {
        const title = ctx.message.text?.trim();
        if (!title || !validate.validateTitle(title)) {
          await ctx.reply('Title invalid. Send a title between 3 and 120 characters.');
          return;
        }
        ctx.session.flow.payload.title = title;
        ctx.session.flow.step = 'description';
        await ctx.reply('Send a short description (max 1000 chars). Send "-" to skip.');
        return;
      }

      if (flow.step === 'description') {
        let d = ctx.message.text || '';
        if (d.trim() === '-') d = '';
        if (!validate.validateDescription(d)) {
          await ctx.reply('Description too long. Keep it under 1000 characters.');
          return;
        }
        ctx.session.flow.payload.description = d;
        ctx.session.flow.step = 'price';
        await ctx.reply('Send the price as a number (e.g., 25000).');
        return;
      }

      if (flow.step === 'price') {
        const text = ctx.message.text?.replace(/,/g, '').trim();
        const price = Number(text);
        if (!validate.validatePrice(price)) {
          await ctx.reply('Invalid price. Send a numeric value greater than 0.');
          return;
        }
        ctx.session.flow.payload.price = price;
        ctx.session.flow.step = 'negotiable';
        await ctx.reply('Is the price negotiable?', Markup.inlineKeyboard([
          [ Markup.button.callback('Yes', 'neg_yes'), Markup.button.callback('No', 'neg_no') ]
        ]));
        return;
      }
    }

    // CONTACT ADMIN flow: forward message and return to launch menu
    if (flow.name === 'contact_admin' && flow.step === 'await_message') {
      const forwardText = `Message from user ${ctx.from.username || ctx.from.id} (${ctx.from.id}):\n\n${ctx.message.text || '<media/attachment>'}`;
      // forward to admin(s)
      for (const adminId of (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean)) {
        try {
          await bot.telegram.sendMessage(Number(adminId), forwardText);
        } catch (e) {}
      }
      await ctx.reply('Message forwarded to admins. Returning to launch menu.', LAUNCH_MENU(ctx));
      ctx.session.flow = {};
      return;
    }
  });

  // Handle special callback for negotiable selection
  bot.action('neg_yes', async (ctx) => {
    ensureSessionStructure(ctx);
    if (!ctx.session.flow || ctx.session.flow.name !== 'sell_product') {
      await ctx.answerCbQuery();
      return;
    }
    ctx.session.flow.payload.negotiable = true;
    ctx.session.flow.step = 'state';
    await ctx.answerCbQuery();
    // fetch states and present as buttons (paginated into columns of 3)
    const states = await stateAPI.getStates();
    // Present first 9 states as buttons (pagination implementation left to expand)
    const buttons = [];
    for (let i = 0; i < Math.min(9, states.length); i++) {
      buttons.push(Markup.button.callback(states[i], `state_${states[i]}`));
    }
    await ctx.reply('Choose your state (page 1):', Markup.inlineKeyboard(
      buttons.map(b => [b])
    ));
  });

  bot.action('neg_no', async (ctx) => {
    ensureSessionStructure(ctx);
    if (!ctx.session.flow || ctx.session.flow.name !== 'sell_product') {
      await ctx.answerCbQuery();
      return;
    }
    ctx.session.flow.payload.negotiable = false;
    ctx.session.flow.step = 'state';
    await ctx.answerCbQuery();
    const states = await stateAPI.getStates();
    const buttons = [];
    for (let i = 0; i < Math.min(9, states.length); i++) {
      buttons.push(Markup.button.callback(states[i], `state_${states[i]}`));
    }
    await ctx.reply('Choose your state (page 1):', Markup.inlineKeyboard(
      buttons.map(b => [b])
    ));
  });

  // state selection handler (pattern)
  bot.action(/state_(.+)/, async (ctx) => {
    ensureSessionStructure(ctx);
    const state = ctx.match[1];
    if (!ctx.session.flow || ctx.session.flow.name !== 'sell_product') {
      await ctx.answerCbQuery();
      return;
    }
    ctx.session.flow.payload.state = state;
    ctx.session.flow.step = 'images';
    await ctx.answerCbQuery(`State set to ${state}. Now send up to 5 images (one at a time). Send 'done' when finished or skip by sending '-'`);
    return;
  });

  // handle photo uploads in flow (image fileId capture)
  bot.on('photo', async (ctx) => {
    ensureSessionStructure(ctx);
    const flow = ctx.session.flow;
    if (!flow || flow.name !== 'sell_product' || flow.step !== 'images') return;

    const photos = ctx.message.photo || [];
    if (!photos.length) {
      await ctx.reply('No photo found.');
      return;
    }
    // pick highest resolution
    const fileId = photos[photos.length - 1].file_id;
    ctx.session.flow.payload.images = ctx.session.flow.payload.images || [];
    if (ctx.session.flow.payload.images.length >= 5) {
      await ctx.reply('You have already uploaded 5 images. Send "done" to proceed.');
      return;
    }
    ctx.session.flow.payload.images.push({ fileId });
    await ctx.reply(`Image received (${ctx.session.flow.payload.images.length}/5). Send more or send 'done'.`);
  });

  // text handler while in images step to accept 'done' or skip
  bot.on('message', async (ctx) => {
    ensureSessionStructure(ctx);
    const flow = ctx.session.flow;
    if (!flow || flow.name !== 'sell_product') return;

    // only proceed here for images step
    if (flow.step === 'images') {
      const txt = ctx.message.text?.trim().toLowerCase();
      if (txt === 'done' || txt === '-') {
        // Present preview
        const payload = ctx.session.flow.payload;
        const previewText = buildProductPreviewText(payload);
        // Show preview with edit or submit buttons
        await ctx.replyWithMarkdown(previewText, Markup.inlineKeyboard([
          [ Markup.button.callback('✏️ Edit', 'edit_preview'), Markup.button.callback('✅ Submit for approval', 'submit_product') ]
        ]));
        ctx.session.flow.step = 'preview';
        return;
      }
    }

    // edit flow (not fully expanded here) - simple implementation: allow restart
    if (flow.step === 'preview' && ctx.message.text?.trim().toLowerCase() === 'restart') {
      ctx.session.flow = {};
      await ctx.reply('Flow restarted. Returning to launch menu.', LAUNCH_MENU(ctx));
      return;
    }
  });

  // submit product handler
  bot.action('submit_product', async (ctx) => {
    ensureSessionStructure(ctx);
    if (!ctx.session.flow || ctx.session.flow.name !== 'sell_product') {
      await ctx.answerCbQuery();
      return;
    }
    const payload = ctx.session.flow.payload;
    payload.sellerTelegramId = ctx.from.id;
    payload.status = 'pending';
    // Ensure images array present and length at least 1? (we allow 0)
    // Save product to DB
    const prod = await ProductController.savePendingProduct(payload);
    await ctx.answerCbQuery('Product submitted for admin approval.');
    // notify admins with inline approve/reject buttons
    const adminButtons = Markup.inlineKeyboard([
      [ Markup.button.callback('✅ Approve', `admin_approve_${prod._id}`), Markup.button.callback('❌ Reject', `admin_reject_${prod._id}`) ]
    ]);
    const msg = `New product submitted:\n\n*${prod.title}*\nPrice: ₦${prod.price}\nSeller: ${ctx.from.username || ctx.from.id}\nProduct ID: ${prod._id}`;
    for (const adminId of ADMIN_IDS) {
      try {
        await bot.telegram.sendMessage(adminId, msg, { parse_mode: 'Markdown', ...adminButtons });
      } catch (e) {
        console.warn('Failed to notify admin', adminId, e.message);
      }
    }

    // notify seller & reset session
    await ctx.reply('✅ Your product is now pending admin approval. You will be notified when an admin acts on it.');
    ctx.session.flow = {};
    await ctx.reply('Returning to launch menu', LAUNCH_MENU(ctx));
  });

  // Edit preview handler (simple: restart flow)
  bot.action('edit_preview', async (ctx) => {
    ensureSessionStructure(ctx);
    ctx.session.flow = { name: 'sell_product', step: 'title', payload: { images: [] } };
    await ctx.answerCbQuery('Edit restarted. Please send new title.');
  });

  // Start the bot
  bot.launch().then(() => console.log('Bot started')).catch(err => console.error('Bot launch error', err));

  // graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

module.exports = { initBot };
