import { recoverMessageAddress, verifyMessage } from 'viem'

export async function verifySignature({
  message,
  signature,
  expectedAddress,
}: {
  message: string
  signature: `0x${string}`
  expectedAddress: `0x${string}`
}): Promise<boolean> {
  const recoveredAddress = await recoverMessageAddress({
    message,
    signature,
  })

  return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
}
