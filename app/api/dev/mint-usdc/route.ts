import { NextRequest, NextResponse } from "next/server";
import { BaseError, createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { factoryAbi } from "@/constants/factory-abi";
import { USDC_ADDRESS } from "@/constants/constant";
import { verifySignature } from "@/app/api/api-utils";
import { usdcDevAbi } from "@/constants/usdc-dev";

const privateKey = process.env.PRIVATE_KEY;
const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS! as `0x${string}`;

if (!privateKey || !factoryAddress) {
  throw new Error("Missing env vars for blockchain connection");
}
if (!USDC_ADDRESS) {
  throw new Error("Missing USDC address in constants.");
}

// Create signer (account) and wallet client
const account = privateKeyToAccount(`0x${privateKey}`);

const client = createWalletClient({
  account,
  chain: baseSepolia, // Optional: specify chain if needed (ex: { id: 88882, name: 'Chiliz' })
  transport: http(),
});

// Public client to wait until the tx is finalized
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participant } = body;

    console.log("[For Dev] Mint 100 Dev-USDC for:", { participant });


    const txHash = await client.writeContract({
      address: USDC_ADDRESS,
      abi: usdcDevAbi,
      functionName: "mint",
      args: [
        participant,
        100, // USDC has 6 decimals but TESTNET Custom USDC has 18 decimals
      ],
      chain: baseSepolia,
    });

    console.log("Transaction sent:", txHash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (!receipt.status) {
      console.error("Transaction failed:", txHash);
      return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
    }
    return NextResponse.json({ success: receipt.status, txHash });
  } catch (error: BaseError | any) {
    const errorType = error.message.match(/Error: (.*)/) ?? null;
    if (errorType && errorType.length > 0) {
      console.error("Error minting DEV USDC:", errorType[1]);
      return NextResponse.json({ error: errorType[1] }, { status: 500 });
    }
    console.error("Error minting DEV USDC:", error);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
