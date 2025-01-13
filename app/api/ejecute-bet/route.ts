import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import ABI from "@/public/ABIS/ABI.json";

export async function POST(_request: NextRequest) {
  const pendingId = _request.nextUrl.searchParams.get("pendingId");

  console.log("STARTING BET");
  const signerPrivateKey = process.env.SIGNER_WALLET;
  const RPC = process.env.NEXT_PUBLIC_RPC_URL;
  const provider = new ethers.JsonRpcProvider(RPC);
  if (!signerPrivateKey) {
    throw new Error("SIGNER_WALLET_PRIVATE_KEY environment variable is not set");
  }
  const signer = new ethers.Wallet(signerPrivateKey, provider);
  const crashAddress = process.env.NEXT_PUBLIC_CRASH_ADDRESS;
  if (!crashAddress) {
    throw new Error("NEXT_PUBLIC_MINE_ADDRESS environment variable is not set");
  }

  const randomNumber = Math.floor(Math.random() * 10000);
  const contract = new ethers.Contract(crashAddress, ABI, signer);

  const maxRetries = 2;
  let attempts = 0;
  let transactionSuccessful = false;

  while (attempts <= maxRetries && !transactionSuccessful) {
    attempts++;
    console.log(`Attempt ${attempts} to settle bet...`);
    try {
      const resultBet = await contract._settleBet(pendingId, randomNumber, {
        gasPrice: 600000,
        gasLimit: 100000,
      });

      console.log("Transaction sent. Waiting for receipt...");

      const receipt = await resultBet.wait();
      if (receipt.status === 1) {
        console.log("Transaction mined successfully:", receipt);
        transactionSuccessful = true;

        return NextResponse.json({
          message: "Transaction succeeded",
          receipt,
        });
      } else {
        console.error("Transaction failed:", receipt);
        if (attempts > maxRetries) {
          return NextResponse.json({
            error: "Transaction failed after maximum retries",
          });
        }
      }
    } catch (error) {
      console.error(`Error on attempt ${attempts}:`, error);
      if (attempts > maxRetries) {
        return NextResponse.json({
          error: "Transaction failed after maximum retries",
          details: (error as any).message,
        });
      }
    }
  }

  console.log("Bet is not over");
  return NextResponse.json({ error: "Bet is not over" });
}
