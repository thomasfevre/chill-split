import { createPublicClient, http, encodeFunctionData, encodePacked, keccak256, Hex, concatHex, hexToBytes } from "viem";
import { baseSepolia } from "viem/chains";
import { delegateAbi } from "@/constants/delegate-abi";
import { factoryAbi } from "@/constants/factory-abi";
import { groupAbi } from "@/constants/group-abi";
import { isDynamicWaasConnector, Wallet } from '@dynamic-labs/wallet-connector-core';
import { EthereumWalletConnector, isEthereumWallet } from "@dynamic-labs/ethereum";
import { Address, recoverMessageAddress } from "viem";
import { SignAuthorizationReturnType } from "viem/accounts";

// Your delegate contract address (from .env or constants)
export const DELEGATE_ADDRESS = process.env.NEXT_PUBLIC_DELEGATE_ADDRESS as Address;

// Public client for read-only blockchain calls
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * Checks the delegation status of an address using EIP-7702 logic.
 * Returns the delegated address if delegation is found, otherwise null.
 */
export async function checkDelegationStatus(address: Address): Promise<Address | null> {
    try {
        // Get the code at the EOA address
        const code = await publicClient.getCode({ address });

        if (!code || code === "0x") {
            // No delegation found
            return null;
        }

        // Check if it's an EIP-7702 delegation (starts with 0xef0100)
        if (code.startsWith("0xef0100")) {
            // Extract the delegated address (remove 0xef0100 prefix)
            const delegatedAddress = ("0x" + code.slice(8)) as Address;
            return delegatedAddress;
        } else {
            // Address has code but not EIP-7702 delegation
            return null;
        }
    } catch (error) {
        console.error("Error checking delegation status:", error);
        return null;
    }
}

/**
 * Authorizes the delegate contract for the user (EIP-7702 style) with a nonce.
 * Returns the transaction hash or null.
 */
export async function createAuthorization(
    primaryWallet: Wallet,
    targetAddress: Address,
    nonce: number,
    chainId: number
) {
    const connector = primaryWallet?.connector;
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        console.log('Primary wallet is not available or not an Ethereum wallet');
        return null;
    }

    // if (!connector || !isDynamicWaasConnector(connector) && connector.isEmbeddedWallet) {
    //     console.log('Connector is not a WaaS wallet connector');
    //     return null;
    // }

    try {
        console.log('Starting authorization process...');

        console.log('Signing authorization for', targetAddress);
        const authorization = await (connector as any).signAuthorization({
            address: targetAddress,
            chainId,
            nonce,
        });

        console.log('Authorization signed:', authorization);
        return authorization;
    } catch (error) {
        console.error('Error during authorization:', error);
        return null;
    }
}

/**
 * Signs a contract call (for factory or group) to be sponsored by the backend.
 * Returns the call data and the signature.
 */
export async function signSponsoredCall({
    primaryWallet,
    userWalletAddress,
  contractAddress,
  abi,
  functionName,
  args,
}: {
    primaryWallet: EthereumWalletConnector;
    userWalletAddress?: `0x${string}`; // Optional, used for delegation check
    contractAddress: Address;
    abi: any;
    functionName: string;
    args: any[];
}) {
    if (!primaryWallet || !userWalletAddress) {
        throw new Error("Primary wallet is not connected");
    }
    // 1. Check if delegate is authorized, if not, authorize
    const authorized = await checkDelegationStatus(userWalletAddress);
    let delegateSignature: SignAuthorizationReturnType | undefined = undefined;
    
    console.log("isDelegateAuthorized", authorized, primaryWallet)
    if (!authorized) {
        // get the nonce from the contract 
        const nonce = await publicClient.getTransactionCount({
            address: userWalletAddress,
            blockTag: 'latest', // or 'pending' for the next transaction nonce
        });
        console.log("nonce", nonce);
        
        // Create the authorization signature
        delegateSignature = await createAuthorization(primaryWallet as unknown as Wallet, DELEGATE_ADDRESS, nonce, baseSepolia.id);
        if (delegateSignature  === null) {
            throw new Error("Failed to create authorization signature");
        }
    } 
    // Encode the function call
    const data = encodeFunctionData({
        abi,
        functionName,
        args,
    });

    const calls = [{
        to: contractAddress,
        value: 0n, // Assuming no value transfer, adjust if needed
        data,
    }];

    // Create contract instance for sponsored transaction
    const delegatedContract = {
        nonce: async () => {
            return await publicClient.readContract({
                address: userWalletAddress,
                abi: delegateAbi,
                functionName: "nonce",
                args: [],
            });
        }
    };

    // Get contract nonce and create signature
    const contractNonce = await delegatedContract.nonce() as unknown as number;
    console.log ("contractNonce", contractNonce);

    // Convert the calls array to the format our helper expects: [to, value, data][]
    const callsForSigning: [Address, bigint, Hex][] = calls.map(
        c => [c.to as Address, c.value as bigint, c.data as `0x${string}`]
    );

    // Call the new viem-based helper function
    const signature = await createSignatureForCallsViem(
        callsForSigning,
        BigInt(contractNonce), // The nonce you read from the contract
        primaryWallet
    );

    if (!signature || typeof signature !== "string" || !signature.startsWith("0x")) {
        throw new Error("Failed to obtain a valid signature");
    }

    // 4. Correctly verify the signature on the client side for confirmation
    const digest = keccak256(
        encodePacked(       
            ['uint256', 'bytes'],
            [BigInt(contractNonce), concatHex(callsForSigning.map(call => encodePacked(['address', 'uint256', 'bytes'], call)))]
        )
    );

    // Verify the signature matches the user wallet address 
    const recovered = await recoverMessageAddress({
        message: digest,
        signature: signature as `0x${string}`,
    });
    if (recovered.toLowerCase() !== userWalletAddress.toLowerCase()) {
        throw new Error('Signature does not match user wallet! On-chain verification will fail.');
    }
    
    return {
        calls,
        signature,
        delegateSignature
    };
}

/**
 * Creates a signature for a batch of calls using viem, matching the provided ethers.js logic.
 *
 * @param calls - An array of calls, where each call is an array: [to, value, data].
 * @param contractNonce - The current nonce from the smart contract's state.
 * @param primaryWallet - The Dynamic wallet connector for the user who will sign.
 * @returns The resulting signature as a Hex string.
 */
async function createSignatureForCallsViem(
    calls: [Address, bigint, Hex][],
    contractNonce: bigint,
    primaryWallet: EthereumWalletConnector
): Promise<Hex> {
    // 1. Get the viem WalletClient from the Dynamic connector
    const walletClient = await primaryWallet.getWalletClient();
    if (!walletClient) {
        throw new Error("Could not get WalletClient from primary wallet.");
    }
    
    // 2. Encode and concatenate all calls into a single hex string, just like the ethers example
    const encodedCalls = calls.reduce<Hex>((acc, call) => {
        const [to, value, data] = call;
        const packedCall = encodePacked(
            ['address', 'uint256', 'bytes'],
            [to, value, data]
        );
        // concatHex is the clean viem equivalent of manual string concatenation
        return concatHex([acc, packedCall]);
    }, '0x');

    // 3. Create the final digest that needs to be signed
    const digest = keccak256(
        encodePacked(
            ['uint256', 'bytes'],
            [contractNonce, encodedCalls]
        )
    );

    // 4. Sign the pre-computed digest directly using signMessage
    // This is the direct viem equivalent of `signer.signMessage(ethers.getBytes(digest))`
    const signature = await walletClient.signMessage({
        message: { raw: hexToBytes(digest) }
    });

    return signature;
}

export function deepBigIntToString(obj: any): any {
        if (typeof obj === "bigint") return obj.toString();
        if (Array.isArray(obj)) return obj.map(deepBigIntToString);
        if (obj && typeof obj === "object") {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, deepBigIntToString(v)])
          );
        }
        return obj;
      }