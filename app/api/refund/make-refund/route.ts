import { NextRequest, NextResponse } from "next/server";
import { BaseError, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { groupAbi } from "@/constants/group-abi";

const privateKey = process.env.PRIVATE_KEY!;
const account = privateKeyToAccount(`0x${privateKey}`);

const client = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});


// Public client to wait until the tx is finalized
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const { groupAddress, permit, participant } = await req.json();

    const { value, deadline, nonce, r, s, v } = permit;

    const txHash = await client.writeContract({
      address: groupAddress,
      abi: groupAbi,
      functionName: "reimburseWithPermit",
      args: [participant, value, deadline, v, r, s],
      chain: baseSepolia,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (!receipt.status) {
      console.error("Transaction failed:", txHash);
      return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
    }
    return NextResponse.json({ success: receipt.status, txHash });
  } catch (error: BaseError | any) {
    const errorType = error.message.match(/Error: (.*)/) ?? null;
    if (errorType && errorType.length > 0) {
      console.error("Error reimbursing:", errorType[1]);
      return NextResponse.json({ error: errorType[1] }, { status: 500 });
    }
    console.error("Error reimbursing:", error);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
