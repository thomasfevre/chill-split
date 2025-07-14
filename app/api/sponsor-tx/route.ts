import { NextRequest, NextResponse } from "next/server";
import { BaseError, createWalletClient, http, createPublicClient } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { factoryAbi } from "@/constants/factory-abi";
import { USDC_ADDRESS } from "@/constants/constant";
import { verifySignature } from "@/app/api/api-utils";

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
    const { delegateSignature, userWallet, calls, callSignature } = body;

    // If delegateSignature and callData/callSignature are provided, that means that the user EOA is not yet delegated
    // and we need to send a sponsored transaction to the delegate contract
    if (delegateSignature && userWallet) {
      const hash = await client.sendTransaction({
          authorizationList: [delegateSignature],
          to: userWallet as `0x${string}`,
          value: BigInt(0),
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (!receipt.status) {
        console.error("Authorization Transaction failed:", hash);
        return NextResponse.json({ error: "Authorization Transaction failed" }, { status: 500 });
      }
    }

    if (calls && callSignature) {
      // Example: call the delegate contract's execute function
      const txHash = await client.writeContract({
        address: userWallet as `0x${string}`,
        abi: require("@/constants/delegate-abi").delegateAbi,
        functionName: "execute",
        args: [
          calls,
          callSignature,
        ],
        chain: baseSepolia,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
      if (!receipt.status) {
        console.error("Transaction failed:", txHash);
        return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
      }
      return NextResponse.json({ success: receipt.status, txHash });
    }
   
   } catch (error: BaseError | any) {
    const errorType = error.message.match(/Error: (.*)/) ?? null;
    if (errorType && errorType.length > 0) {
      console.error("Error for :", req.url, errorType[1]);
      return NextResponse.json({ error: errorType[1] }, { status: 500 });
    }
    console.error("Error for :", req.url, error);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
