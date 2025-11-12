const mongoose = require('mongoose');

async function connect() {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URI not set');
  await mongoose.connect(uri, { dbName: 'escrowang' });
  console.log('Connected to MongoDB');
}

module.exports = { connect, mongoose };
