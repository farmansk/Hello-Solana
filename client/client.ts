import { Keypair, PublicKey, Connection, clusterApiUrl, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from 'fs';
import {
  createMint,
  mintTo,
  createAccount,
  transfer,
  approve,
} from "@solana/spl-token";

const wallet = { windows: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('./windows.json', 'utf8')))), ubuntu: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('./ubuntu.json', 'utf8')))) };

const PROGRAM_ID = new PublicKey("CJcFRnkze26x5UEiaqRC7XvtEv8yHRcefGorsok665NA");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
// const wallet = { keypair: web3.Keypair.generate() };

const reciever = new PublicKey("8jdGVk4fx41jG5TZNrVy7Xr7wbCbLKvN7rzX1WVL17ph")
const MINT = new PublicKey("HGLxHekiNWHRHweZ8XVBegbS9Yzzy7TU2PGYbcNGBYxY")

async function callProgram() {
  // // Airdrop SOL to the new keypair
  // console.log("Airdropping 5 SOL to the wallet...");
  // const airdropSignature = await connection.requestAirdrop(wallet.keypair.publicKey, 5 * LAMPORTS_PER_SOL);
  // await connection.confirmTransaction(airdropSignature);
  // console.log("Airdrop complete.");

  // Get latest blockhash info
  const blockhashInfo = await connection.getLatestBlockhash();

  // Create transaction
  const tx = new Transaction({
    ...blockhashInfo,
    feePayer: wallet.windows.publicKey,
  });
  // Add our hello world program instruction
  tx.add(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [],
      data: Buffer.from([]),
    })
  );
  // Sign transaction
  tx.sign(wallet.windows);

  // Send the transaction to the Solana cluster
  try {
    const txHash = await connection.sendRawTransaction(tx.serialize());
    console.log(`Transaction sent with hash: ${txHash}`);
  } catch (error) {
    console.error("Failed to send transaction:", error);
  }
}

async function getBalance() {
  const txbalance = await connection.getBalance(wallet.windows.publicKey);
  console.log(`Sender balance: ${txbalance / LAMPORTS_PER_SOL} SOL`);
  const rxbalance = await connection.getBalance(reciever);
  console.log(`Reciever balance: ${rxbalance / LAMPORTS_PER_SOL} SOL`);
}

async function transferSol(from: Keypair, to: PublicKey, amount: number) {

  console.log(`Transferring ${amount} SOL from ${from.publicKey} to ${to}`)

  const transaction = new Transaction();

  const instruction = SystemProgram.transfer({
    fromPubkey: from.publicKey,
    toPubkey: to,
    lamports: amount * LAMPORTS_PER_SOL,
  });

  transaction.add(instruction);

  await sendAndConfirmTransaction(connection, transaction, [from]);

  console.log("Transfer successful");
  getBalance();
}

// async function setApprove() {
//   const associated = spl.getAssociatedTokenAddressSync(MINT, wallet.windows.publicKey);
//   const associatedRecv = spl.getAssociatedTokenAddressSync(MINT, wallet.ubuntu.publicKey);
//   spl.approve(connection, wallet.windows, associated, associatedRecv, wallet.windows.publicKey, 1000);
// }

// async function transfer() {
//   const windows = spl.getAssociatedTokenAddressSync(MINT, wallet.windows.publicKey);
//   const rx = spl.getAssociatedTokenAddressSync(MINT, reciever);
//   const newAcc = spl.getAssociatedTokenAddressSync(MINT, new PublicKey("8hi256mQrcTvkX2q7HJyLV9zu3tVY2PZpTvcoJUTsgAk"));
//   spl.transfer(connection, wallet.ubuntu, windows, rx, wallet.ubuntu.publicKey, 100);
// }

async function delegate() {
  const payer = wallet.windows;

  // Connection to devnet cluster
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Transaction signature returned from sent transaction
  let transactionSignature: string;

  // // Authority that can mint new tokens
  const mintAuthority = wallet.windows.publicKey;

  // Create new mint account using `createMint` helper function
  const mint = await createMint(
    connection,
    payer, // payer
    payer.publicKey, // mint authority
    null, // freeze authority
    2 // decimals
  );

  console.log(
    "Mint Account: ",
    `https://explorer.solana.com/address/${mint.toString()}?cluster=devnet`
  );

  // Random keypair to use as owner of Token Account
  const bakra = new Keypair();
  // Create Token Account for random keypair
  const sourceTokenAccount = await createAccount(
    connection,
    payer, // Payer to create Token Account
    mint, // Mint Account address
    bakra.publicKey // Token Account owner
  );

  // Create Token Account for Playground wallet
  const destinationTokenAccount = await createAccount(
    connection,
    payer, // Payer to create Token Account
    mint, // Mint Account address
    wallet.ubuntu.publicKey // Token Account owner
  );

  // Mint tokens to sourceTokenAccount, owned by bakra
  transactionSignature = await mintTo(
    connection,
    payer, // Transaction fee payer
    mint, // Mint Account address
    sourceTokenAccount, // Mint to
    mintAuthority, // Mint Authority address
    100 // Amount
  );

  console.log(
    "\nMint Tokens:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
  );

  // Approve delegate, (playground wallet as delegate)
  transactionSignature = await approve(
    connection,
    payer, // Transaction fee payer
    sourceTokenAccount, // Token Account to set delegate for
    wallet.ubuntu.publicKey, // Delegate
    bakra.publicKey, // Token Account owner
    100, // Amount delegated
    [bakra] // Signer
  );

  console.log(
    "\nApprove Delegate:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
  );

  // Transfer with delegate
  transactionSignature = await transfer(
    connection,
    wallet.ubuntu, // Transaction fee payer
    sourceTokenAccount, // Transfer from
    destinationTokenAccount, // Transfer to
    wallet.ubuntu.publicKey, // Pass in delegate as owner
    100 // Amount
  );

  console.log(
    "\nTranfer with Delegate:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
  );
}

// callProgram();
// getBalance()
// .then(()=>{
//   transferSol(wallet.keypair, reciever, 0.1);
// });
// setApprove();
delegate();