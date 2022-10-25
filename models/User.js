const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  wallet: {      // user's wallet
    type: String,
    required: true,
  },
  role: {
    type: String // 1: normal user, 2: admin user
  },
  createdAt: {  // created time
    type: Date,
    default: Date.now
  }
});

module.exports = User = mongoose.model("users", UserSchema);
