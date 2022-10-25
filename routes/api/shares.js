const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");
const multer = require('multer');
const fs = require("fs");
const mongoose = require("mongoose");
const axios = require('axios');

const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const { Program, AnchorProvider, web3, BN } = require('@project-serum/anchor');
const { Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const SPL = require("@solana/spl-token");
const anchor = require('@project-serum/anchor');

// models
const User = require("../../models/User");
const Pool = require("../../models/Pool");
const Shares = require("../../models/Shares");

const { adminWalletPrivateKey, adminWallet, bearerToken, feeWallet } = require("./../../config/bot")

const { buyNFT, buyNowNFT, buyCancelNFT, buyChangePriceNFT, sellNFT,
        sellNowNFT, sellCancelNFT, sellChangePriceNFT, deposit, withdraw,
        getCollectionList, getCollectionStats, refund
      } = require("./bot")
// @route POST api/shares/wallet-connect
// @desc return Wallets Info
// @access Public

router.post("/wallet-connect", async(req, res)=>{
  try {
    const wallet = req.body.wallet;
    const user = await User.findOne({wallet: wallet});
    if(!user){
      let role = 1;
      if(adminWallet == wallet || "2fFWPwM6mebG67MDrcawTCfef5qgKp7Uug26eHkfWGPX" == wallet || wallet == "DEH5jy9eJ1K1AxzqD4NNgpQeTLHGZ9DrHQr7j4DFqQEZ" 
      || wallet == "7im44qw4T9UA6P3czi1Cr1pPabf1xqwqgJnLN5bR2FnZ"){
        role = 2;
      }
      const newUser = new User({
        wallet: wallet,
        role: role
      });
      await newUser.save();
      res.json({status:"success", role: role});
    }else{
      res.json({status:"success", role:user.role});
    }
  }catch(err){
    console.log(err)
    res.json({status:"error"});
  }
})

// @route POST api/shares/buy-share
// @desc return Buyed Info
// @access Public

router.post("/buy-share", async(req, res)=>{
  try {
    const wallet = req.body.wallet;
    const signature = req.body.signature;
    const pool =  req.body.pool;

    const signatureData = await axios.get(`https://api.solscan.io/transaction?tx=${signature}&cluster=devnet`);//&cluster=devnet
    let amount = '', destination = '', source = '';
    try{
        // console.log(signatureData.data['mainActions'][0].data.token.address)
        amount = signatureData.data['mainActions'][0].data.amount;
        destination = signatureData.data['mainActions'][0].data.destination;
        source = signatureData.data['mainActions'][0].data.source;
        if( amount == 0){
          return res.json({"status":"Wrong Transaction"});
        }
        if(destination_owner == source_owner) {
            return res.json({"status":"Wrong Transaction"});    
        }
    }catch(err){
        console.log(err)
        return res.json({"Status":"Wrong Transaction"});
    }

    const share = await Shares.findOne({signature: signature});
    if(!share){
      const newShare = new Shares({
        wallet: wallet,
        pool: pool,
        wallet: wallet,
        signature: signature,
      });
      await newShare.save();
      res.json({status:"success"});
    }else{
      res.json({status:"duplication"});
    }
  }catch(err){
    console.log("Exception: buy-share")
    res.json({status:"error"});
  }
})

// @route POST api/shares/test-buy
// @desc return Invested Info
// @access Public
router.post("/test-invest", async(req, res)=>{
  try {
    const poolName = req.body.poolName;

    const collectionStats = await getCollectionStats(poolName);
    let totalListedCount = collectionStats.listedCount;
    let minPrice = 0;
    let indexCollection = 0;
    for( let j = 0; j < totalListedCount/20; j++){
      const resCollectionData = await getCollectionList(poolName, j*20, 20);
      for (let i = 0; i < resCollectionData.length; i++){      
        if(minPrice == 0) {
          minPrice = resCollectionData[i].price;
        }
        if (minPrice>resCollectionData[i].price){
          minPrice = resCollectionData[i].price
          indexCollection = i;
        }
      }
    }
    console.log(resCollectionData[indexCollection].auctionHouseAddress)
    console.log(resCollectionData[indexCollection].tokenMint)
    console.log(resCollectionData[indexCollection].price)
    
    await buyNFT(
        resCollectionData[indexCollection].auctionHouseAddress,
        resCollectionData[indexCollection].tokenMint,
        resCollectionData[indexCollection].price
    );
    res.json({status:"success"});
      
  }catch(err){
    console.log(err)
    console.log("Exception: invest")
    res.json({status:"error"});
  }
})

// @route POST api/shares/invest
// @desc return Invested Info
// @access Public

router.post("/invest", async(req, res)=>{
  try {
    const wallet = req.body.wallet;
    const signature = req.body.signature;
    const poolID =  req.body.pool;
    const ticket =  req.body.ticket;
    const floorPrice = req.body.floorPrice;
    const type = req.body.type;
    
    let amount = 0, destination = '', source = '';
    if(type == 0){    // type = 0
      try{
          const signatureData = await axios.get(`https://api.solscan.io/transaction?tx=${signature}&cluster=devnet`);//
          // console.log(signatureData.data['mainActions'][0].data.token.address)
          amount = signatureData.data['mainActions'][0].data.amount;
          destination = signatureData.data['mainActions'][0].data.destination;
          source = signatureData.data['mainActions'][0].data.source;
          if( amount == 0){
            return res.json({"status":"Wrong Transaction"});
          }
          if(destination == source) {
              return res.json({"status":"Wrong Transaction"});    
          }
      }catch(err){
          console.log(err)
          return res.json({"status":"Wrong Transaction"});
      }
    }
    const pool = await Pool.findOne({_id: poolID});
    if(pool){
      if(pool.investAmount) {
        pool.investAmount = pool.investAmount + amount;
      }else{
        pool.investAmount = amount;
      }
      pool.shareTicketAmount = pool.shareTicketAmount + ticket
      await pool.save();
    }else{
      return res.json({status:"Empty or Wrong Pool"});
    }

    const share = await Shares.findOne({signature: signature, wallet: wallet});
    if(!share){
      const newShare = new Shares({
        wallet: wallet,
        pool: poolID,
        wallet: wallet,
        ticket: ticket,
        signature: signature,
      });
      await newShare.save();
      res.json({status:"success"});
    }else{
      res.json({status:"duplication"});
    }
      console.log(pool.investAmount)
      console.log(floorPrice)
      console.log(floorPrice * LAMPORTS_PER_SOL * 1.1)

      if(pool.investAmount >= floorPrice * LAMPORTS_PER_SOL * 1.1){

        let extraAmount = pool.investAmount - floorPrice * LAMPORTS_PER_SOL * 1.1

        const shares = await Shares.find({pool: poolID});
        let amount = 0;
        for ( let i = 0; i < shares.length; i++){
          amount = amount + parseFloat(shares[i].ticket);
        }

        console.log("extraAmount", extraAmount)
        console.log("amount", amount)

        let poolAmount = extraAmount - 10000000;
        console.log("poolAmount", poolAmount)

        let amountForFee = poolAmount * 0.05;
        let amountForUser = poolAmount * 0.95;
        let ticketPerPrice = amountForUser/amount;

        console.log("amountForFee", amountForFee)

        await refund(parseInt(amountForFee), feeWallet);

        for ( let i = 0; i < shares.length; i++){
          let refundAmount = ticketPerPrice*parseFloat(shares[i].ticket);
          let to = shares[i].wallet;
          console.log("refundAmount", refundAmount)
          console.log("to", to)
          await refund(parseInt(refundAmount), to);
        }
        
        pool.fulFillStatus = true;
        pool.active = true;
        await pool.save();
      }

      // if((pool.investAmount/1000000000) > pool.floorPriceValue){
      //   const collectionStats = await getCollectionStats(pool.poolName);
      //   let totalListedCount = collectionStats.listedCount;
      //   let minPrice = 0;
      //   let indexCollection = 0;
      //   for( let j = 0; j < totalListedCount/20; j++){
      //     const resCollectionData = await getCollectionList(pool.poolName, j*20, 20);
      //     for (let i = 0; i < resCollectionData.length; i++){      
      //       if(minPrice == 0) {
      //         minPrice = resCollectionData[i].price;
      //       }
      //       if (minPrice>resCollectionData[i].price){
      //         minPrice = resCollectionData[i].price
      //         indexCollection = i;
      //       }
      //     }
      //   }

      //   buyNFT(
      //       resCollectionData[indexCollection].auctionHouseAddress,
      //       resCollectionData[indexCollection].tokenMint,
      //       resCollectionData[indexCollection].price
      //   );
      // }
      

     
  }catch(err){
    console.log(err)
    console.log("Exception: invest")
    res.json({status:"error"});
  }
})


// @route POST api/shares/refund
// @desc return Refund Info
// @access Public

router.post("/refund", async(req, res)=>{
  try {
    const wallet = req.body.wallet;
    const poolID = req.body.poolID;
    const pool = await Pool.findOne({_id: poolID});
    const shares = await Shares.find({pool: poolID});
    let amount = 0;
    for ( let i = 0; i < shares.length; i++){
      amount = amount + parseFloat(shares[i].ticket);
    }
    console.log("investAmount", pool.investAmount)
    console.log("amount", amount)
    let poolAmount = pool.investAmount - 10000000;
    console.log("poolAmount", poolAmount)
    let amountForFee = poolAmount * 0.05;
    let amountForUser = poolAmount * 0.95;  
    let ticketPerPrice = amountForUser/amount;
    console.log("amountForFee", amountForFee)
    await refund(parseInt(amountForFee), feeWallet);
    for ( let i = 0; i < shares.length; i++){
      let refundAmount = ticketPerPrice*parseFloat(shares[i].ticket);
      let to = shares[i].wallet;
      console.log("refundAmount", refundAmount)
      console.log("to", to)
      await refund(parseInt(refundAmount), to);
    }

    if(pool){
      pool.active = false;
      await pool.save();
      return res.json({status:"success"});
    }
    res.json({status:"wrong Pool"});
  }catch(err){
    console.log("Exception: Refund-pool");
    console.log(err)
    res.json({status:"error"});
  }
})

router.get("/test-refund", async(req, res)=>{
    try{
      let refundAmount = 100000000
      let to = "7im44qw4T9UA6P3czi1Cr1pPabf1xqwqgJnLN5bR2FnZ"
      const resData = await refund(refundAmount, to);
      console.log(resData)
      res.json({status:"success"});
    }catch(err){
      console.log(err)
      res.json({status:"error"});

    }
    
});
// @route POST api/shares/create-pool
// @desc return ALL Pool Info
// @access Public

router.post("/create-pool", async(req, res)=>{
  try {
    const wallet = req.body.wallet;
    const poolName = req.body.collectionLink;
    const pool = await Pool.findOne({poolName: poolName});
    // if(!pool){
      const newPool = new Pool({
        wallet: wallet,
        poolName: poolName,
        collectionData: req.body.collection,
        floorPriceValue: req.body.floorPriceValue,
        pricePerShare: req.body.pricePerShare,
        profitValue: req.body.profitValue
      });
      await newPool.save();
      return res.json({status:"success"});
    // }
    // res.json({status:"duplication"});
  }catch(err){
    console.log("Exception: create-pool");
    console.log(err)
    res.json({status:"error"});
  }
})

// @route POST api/shares/update-pool
// @desc return Updated Pool Info
// @access Public

router.post("/update-pool", async(req, res)=>{
  try {
    const wallet = req.body.wallet;
    const poolID = req.body.id;
    const poolName = req.body.poolName;
    if(wallet == adminWallet) {
      return res.json({status: "Not Admin"});
    }
    const pool = await Pool.findOne({_id: poolID});
    if(pool){
      pool.poolName = poolName;
      pool.floorPriceValue = req.body.floorPriceValue;
      pool.pricePerShare = req.body.pricePerShare;
      pool.profitValue = req.body.profitValue;
      pool.updatedAt = Date.now();
      await pool.save();
      res.json({status:"success"});
    }else{
      res.json({status:"empty pool"});
    }
  }catch(err){
    console.log(err)
    console.log("Exception: update-pool")
    res.json({status:"error"});
  }
})

// @route POST api/shares/delete-pool
// @desc return Deleted Pool Info
// @access Public

router.post("/delete-pool", async(req, res)=>{
  try {
    const poolID = req.body.id;
    await Pool.remove({ _id: poolID });
    res.json({status: "success"});
  }catch(err){
    console.log("Exception: delete-pool")
    res.json({status: "error"});
  }
})

// @route POST api/shares/close-pool
// @desc return Closed Pool Info
// @access Public

router.post("/close-pool", async(req, res)=>{
  try {
    const poolID = req.body.id;
    const pool = await Pool.findOne({_id: poolID});
    if(pool){
      pool.active = false;
      await pool.save();
      res.json({status:"success"});
    }else{
      res.json({status:"empty pool"});
    }
  }catch(err){
    console.log("Exception: close-pool")
    res.json({status: "error"});
  }
})

// @route POST api/shares/get-all-pool
// @desc return ALL Pool Info
// @access Public

router.post("/get-all-pool", async(req, res)=>{
  try {
    res.json(await Pool.find({active:true}));
  }catch(err){
    console.log("Exception: get-all-pool")
    res.json({status:"error"});
  }
})

// @route POST api/shares/get-share-info
// @desc return Shared Info
// @access Public

router.post("/get-share-info", async(req, res)=>{
  try {
    const wallet = req.body.wallet;
    res.json(await Shares.find({wallet: wallet}));
  }catch(err){
    console.log("Exception: get-share-info")
    res.json([]);
  }
})

// @route POST api/shares/get-collection-floorPrice
// @desc return Floor Price Info
// @access Public

router.post("/get-collection-floorPrice", async(req, res)=>{
  try {
    const val = req.body.collection;
    const collection = await axios.get(`https://api-mainnet.magiceden.dev/v2/collections/${val}/stats`, { crossdomain: false });
    return  res.json(collection.data)
  }catch(err){
    console.log(err)
    res.json({status:"error"});
  }
})

// @route POST api/shares/test-pool
// @desc return Floor Price Info
// @access Public

router.get("/test-pool", async(req, res)=>{
  try {
    return  res.json(await Pool.find({}))
  }catch(err){
    console.log(err)
    res.json({status:"error"});
  }
})

// @route POST api/shares/get-collection-info
// @desc return Floor Price Info
// @access Public

router.post("/get-collection-info", async(req, res)=>{
  try {
    const val = req.body.collection;
    const collection = await axios.get(`https://api-mainnet.magiceden.dev/collections/${val}`, { crossdomain: false });

    return  res.json(collection.data)
  }catch(err){
    console.log(err)
    res.json({status:"error"});
  }
})



module.exports = router;
