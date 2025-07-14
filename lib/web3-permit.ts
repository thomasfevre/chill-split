import { createPublicClient, createWalletClient, custom, http } from "viem"
import { baseSepolia } from "viem/chains";
import { parseUnits } from "viem/utils"
import { EthereumWalletConnector } from "@dynamic-labs/ethereum"

export async function signUSDCPermit({
  primaryWallet,
  owner,
  spender,
  amount,
  usdcAddress,
  chainId,
  deadline,
}: {
  primaryWallet: EthereumWalletConnector,
  owner: `0x${string}`,
  spender: `0x${string}`,
  amount: string | number,
  usdcAddress: `0x${string}`,
  chainId: number,
  deadline: string
}) {
  const publicClient = createPublicClient({
    chain: baseSepolia, // Optional: if using a chain config
    transport: http(),
  }); 


  const client = await primaryWallet.getWalletClient()
  if (!client) {
    throw new Error("Wallet client is null")
  }

  const value = parseUnits((Number(amount) + 0.01).toString(), 3) // 

  const nonce: bigint = await publicClient.readContract({
    address: usdcAddress,
    abi: [
      {
        inputs: [{ name: "owner", type: "address" }],
        name: "nonces",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: "nonces",
    args: [owner],
  })
  console.log("nonce", nonce)
  const domain = {
    name: "Mock USDC",
    version: "1", // May differ depending on chain/version — verify!
    chainId,
    verifyingContract: usdcAddress,
  }

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ]
  }

  const message = {
    owner,
    spender,
    value: BigInt(Number(amount) * 10 ** 18),
    nonce,
    deadline,
  }
  console.log("message", message)
  const signature = await client.signTypedData({
    domain,
    types,
    primaryType: "Permit",
    message,
  })
  if (!signature) {
    throw new Error("Signature is null")
  }
  console.log("signature", signature)
  const { r, s, v } = splitSignature(signature)

  return {
    value,
    deadline,
    nonce,
    r,
    s,
    v,
  }
}

function splitSignature(sig: `0x${string}`) {
  return {
    r: sig.slice(0, 66),
    s: `0x${sig.slice(66, 130)}`,
    v: parseInt(sig.slice(130, 132), 16),
  }
}
