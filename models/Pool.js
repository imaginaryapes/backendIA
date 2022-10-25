const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const PoolSchema = new Schema({
  wallet: {        // admin wallet
    type: String,
    required: true,
  },
  poolName: {        // pool name
    type: String
  },
  collectionData : {
    type: Object
  },
  floorPriceValue: {  // floorPriceValue
    type: String
  },
  pricePerShare: {    // pricePerShare
    type: String
  },
  profitValue: {      // profitValue
    type: String
  },
  investAmount : {
    type: Number,
    default: 0
  },
  shareTicketAmount : {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,   // pool status true/false
    default: true
  },
  fulFillStatus: {
    type: Boolean,   // fulFill status true/false
    default: false
  },
  updatedAt: {       // pool updated time
    type: Date,
    default: Date.now
  },
  createdAt: {    // pool created time
    type: Date,
    default: Date.now
  }
});

module.exports = Pool = mongoose.model("pools", PoolSchema);
