const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const SharesSchema = new Schema({
  wallet: {     // user's wallet
    type: String,
    required: true,
  },
  pool: {       // pool id
    type: String
  },
  signature: {  // signature
    type: String
  },
  ticket: {  // ticket
    type: String,
    default: 0
  },
  createdAt: {  // created time
    type: Date,
    default: Date.now
  }
});

module.exports = Shares = mongoose.model("shares", SharesSchema);
