// src/controllers/userController.js
const User = require("../models/User");

exports.registerUser = async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    const firstName = ctx.from.first_name;
    const username = ctx.from.username || "N/A";

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({
        telegramId,
        firstName,
        username,
        createdAt: new Date(),
      });
      console.log("🆕 New user registered:", firstName);
    }

    return user;
  } catch (err) {
    console.error("Error registering user:", err);
  }
};

exports.addInterest = async (telegramId, interest) => {
  try {
    const user = await User.findOne({ telegramId });
    if (!user) return;

    if (!user.interests.includes(interest)) {
      user.interests.push(interest);
      await user.save();
    }
  } catch (err) {
    console.error("Error adding user interest:", err);
  }
};
