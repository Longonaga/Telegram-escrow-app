const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: String,
  firstName: String,
  lastName: String,
  createdAt: { type: Date, default: Date.now },
  // add wallet/account fields as needed
});

module.exports = mongoose.model('User', userSchema);
