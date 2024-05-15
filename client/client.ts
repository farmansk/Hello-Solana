import { Keypair, PublicKey, Connection, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from 'fs';

const keypairArray = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
const secretKey = Uint8Array.from(keypairArray);
const wallet = { keypair: Keypair.fromSecretKey(secretKey) };

const PROGRAM_ID = new PublicKey("CJcFRnkze26x5UEiaqRC7XvtEv8yHRcefGorsok665NA");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
// const wallet = { keypair: web3.Keypair.generate() };

const reciever = new PublicKey("J3GspTH27zWscQtS1dofAsFuRqGgVAwV4xKXTKZJVJQP")

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
    feePayer: wallet.keypair.publicKey,
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
  tx.sign(wallet.keypair);

  // Send the transaction to the Solana cluster
  try {
    const txHash = await connection.sendRawTransaction(tx.serialize());
    console.log(`Transaction sent with hash: ${txHash}`);
  } catch (error) {
    console.error("Failed to send transaction:", error);
  }
}

async function getBalance() {
  const txbalance = await connection.getBalance(wallet.keypair.publicKey);
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

// callProgram();
getBalance()
.then(()=>{
  transferSol(wallet.keypair, reciever, 0.1);
});
