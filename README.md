# Telegram-escrow-app
Version 1 of my telegram escrow app(escrowa)
a marketplace where users can list products and carry out safe snd secured transactions successful 
# escrowaNG — Bot core & create-product flow

This scaffold implements the initial bot core and product creation + admin approval flow.

## Setup
1. Copy files into a project directory.
2. Run `npm install`.
3. Create a `.env` from `.env.example` and fill values.
4. Start MongoDB and run `npm start`.
5. Start the bot by visiting any Telegram client and sending /start to your bot.

## Next steps (recommended)
- Replace in-memory session with Redis or DB-backed sessions.
- Improve inline keyboard builders to support paginated state selection (3-column layout).
- Add image URL retrieval: use `ctx.telegram.getFileLink(file_id)` to store an accessible URL.
- Implement mini web app and payment integrations.
