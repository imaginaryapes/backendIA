const axios = require('axios');

const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const { Program, AnchorProvider, web3, BN } = require('@project-serum/anchor');
const { Token, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const SPL = require("@solana/spl-token");
const anchor = require('@project-serum/anchor');

const { adminWalletPrivateKey, bearerToken } = require("./../../config/bot")
const connection = new Connection("https://api.devnet.solana.com")
// const connection = new Connection("https://polished-hidden-sea.solana-devnet.quiknode.pro/57c3ac3b91852c98004ce7ef870efa7d7c6aa6cb/")

const getProvider = (wallet) => {
  const provider = new anchor.AnchorProvider(
      connection, wallet, { preflightCommitment: "processed" },
  );
  return provider;
}

const refund = async(amount, to) =>{
  console.log("Starting refund ...")
  try{
      const walletKeyData = adminWalletPrivateKey;
      const walletKeypair = Keypair.fromSecretKey(new Uint8Array(walletKeyData));
      console.log("hi")
      const wallet = new anchor.Wallet(walletKeypair);
      let provider = getProvider(wallet);
      // if(balance < 100000000) { 
      //     res.json({"Status": "Insufficient Balance"});
      // }
      // const amount = LAMPORTS_PER_SOL * sol;
      var transaction = new Transaction().add(
          SystemProgram.transfer({
              fromPubkey: provider.publicKey,
              toPubkey: new PublicKey(to),
              lamports: amount,
          })
      );

      if(transaction) {
          console.log("Txn created successfully");
      }
      transaction.feePayer = provider.publicKey;
      let blockhashObj = await connection.getRecentBlockhash();
      transaction.recentBlockhash = await blockhashObj.blockhash;
      
      transaction.sign(walletKeypair);
      let transactionSignature = transaction.serialize();
      const data = await provider.connection.sendRawTransaction(transactionSignature)
      console.log(data)
      const res = {
        status: "success",
        transaction : data
      }
      return res;
      
  }catch(err){
      console.log(err)
      const res = {
        status: "error",
      }
      return res;
  }
};

const getCollectionStats = async(collectionName) =>{
  try{
    const collection = await axios.get(`https://api-mainnet.magiceden.dev/v2/collections/${collectionName}/stats`);
    return collection.data;
  }catch(err){
    console.log(err)
    console.log("GetCollecctionStats: Err")
  }
}
const getCollectionList = async(collectionName, offset, limit) =>{
  try{
    const result = await axios.get(
      `api-mainnet.magiceden.dev/v2/collections/${collectionName}/listings?offset=${offset}&limit=${limit}`, {
          headers: { Authorization: "Bearer " + bearerToken }
    });
    return result.data;
  }catch(err){
    console.log("getCollectionList: ")
    console.log(err);
  }
}

const buyNFT = async(auctionHouseAddress, tokenMint, price) =>{
  // Get instruction to buy (bid) on a NFT
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/buy', {
      params: {
        buyer: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        price: price,
        buyerReferral: '',
        expiry:''
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("buy: ", signature)

    })
}

const buyNowNFT = async(sellerPubKey, auctionHouseAddress, tokenMint, tokenATA, price) =>{
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/buy_now', {
      params: {
        buyer: wallet, 
        seller: sellerPubKey,
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        tokenATA: tokenATA,
        price: price ,
        buyerReferral: '',
        sellerReferral: '',
        buyerExpiry:0,
        sellerExpiry:-1
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("buy_now: ", signature)

    })
}

const buyCancelNFT = async(auctionHouseAddress, tokenMint, price) =>{
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/buy_cancel', {
      params: {
        buyer: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        price: price ,
        buyerReferral: '',
        expiry:''
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("buy_cancel: ", signature)

    })
}

const buyChangePriceNFT = async(auctionHouseAddress, tokenMint, price) =>{
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/buy_change_price', {
      params: {
        buyer: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        price: price ,
        newPrice: newPrice ,
        buyerReferral: '',
        expiry:''
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("buy_change_price: ", signature)

    })
}

const sellNFT = async(auctionHouseAddress, tokenMint, tokenAccount, price) =>{ // list
  // Get instruction to sell (list)
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/sell', {
      params: {
        seller: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        tokenAccount: tokenAccount, 
        price: price ,
        sellerReferral: '',
        expiry:''
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("sell: ", signature)

    })
}

const sellNowNFT = async(buyerPubKey, auctionHouseAddress, tokenMint, tokenATA, price, newPrice, sellerExpiry) =>{ 
  // Get instruction to sell now (accept offer)
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/sell_now', {
      params: {
        buyer: buyerPubKey, 
        seller: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        tokenATA: tokenATA, 
        price: price ,
        newPrice: newPrice ,
        buyerReferral: '',
        sellerReferral: '',
        buyerExpiry:'',
        sellerExpiry:sellerExpiry
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("sell_now: ", signature)

    })
}

const sellCancelNFT = async(auctionHouseAddress, tokenMint, tokenAccount, price, expiry) =>{ 
  // Get instruction to cancel a sell (list)
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/sell_cancel', {
      params: {
        seller: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        tokenAccount: tokenAccount,
        price: price ,
        sellerReferral: '',
        expiry: expiry,
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("sell_cancel: ", signature)
    })
}

const sellChangePriceNFT = async(auctionHouseAddress, tokenMint, tokenAccount, price, newPrice, expiry) =>{ 
  // Get instruction to change a sell (list) price
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    `https://api-mainnet.magiceden.dev/v2/instructions/sell_change_price`, {
      params: {
        seller: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        tokenMint: tokenMint, 
        tokenAccount: tokenAccount,
        price: price ,
        newPrice: newPrice ,
        sellerReferral: '',
        expiry: expiry,
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("sell_change_price: ", signature)
    })
}

const deposit = async(auctionHouseAddress, amount) =>{ 
  // Get instruction to depoist to escrow
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/deposit', {
      params: {
        buyer: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        amount: amount
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("deposit: ", signature)

    })
}

const withdraw = async(auctionHouseAddress, amount) =>{ 
  // Get instruction to depoist to escrow
  // This is not a real secret key and is for illustrative purposes only. 
  let secretKey = Uint8Array.from(adminWalletPrivateKey);
  let keypair = Keypair.fromSecretKey(secretKey);
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  //base58 wallet string to send in as params 
  const wallet = keypair.publicKey.toBase58();
  // Get buy Now instruction from API
  axios.get(
    'https://api-mainnet.magiceden.dev/v2/instructions/withdraw', {
      params: {
        buyer: wallet, 
        auctionHouseAddress: auctionHouseAddress,
        amount: amount
        },
        headers: { Authorization: "Bearer " + bearerToken }
    }).then((res) => {
        // sign and send txn here
        const txSigned = res.data.txSigned
        const txn = Transaction.from(Buffer.from(txSigned.data))
        const signature = sendAndConfirmTransaction(
            connection,
            txn,
            [keypair]
        )
        console.log("withdraw: ", signature)
    })
}

module.exports = {
  buyNFT,  buyNowNFT, buyCancelNFT, buyChangePriceNFT, sellNFT, sellNowNFT, sellCancelNFT, sellChangePriceNFT, deposit, withdraw,
  getCollectionList, getCollectionStats, refund
}