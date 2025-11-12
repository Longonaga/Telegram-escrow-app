require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initBot } = require('./src/bot/bot');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

async function start() {
  // Connect to DB
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName:'EscrowaNG'
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  // Start Express server
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
  });

  // Initialize bot (after server is up)
  initBot();
}

start();
