// app/factoryFetch.ts

import { createPublicClient, http } from 'viem';
import { factoryAbi } from '@/constants/factory-abi';
import { Address } from 'viem'; // For better types
import { baseSepolia } from 'viem/chains';

const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;

// Setup a readonly public client
export const publicClient = createPublicClient({
  chain: baseSepolia, // Optional: if using a chain config
  transport: http(),
});

// --------- Factory Read Functions ---------

/**
 * Get all groups for a given user wallet
 */
export async function getGroupsByUser(userWallet: Address): Promise<Address[]> {
    console.log("Fetching groups for user:", userWallet);
    console.log("Factory address:", factoryAddress);
  const groups = await publicClient.readContract({
    address: factoryAddress as Address,
    abi: factoryAbi,
    functionName: 'getGroupsByUser',
    args: [userWallet],
  });
  console.log("Fetched groups:", groups);
  return groups as `0x${string}`[];
}

/**
 * Get group contract address by group code
 */
export async function getGroupByCode(code: `0x${string}`): Promise<Address> {
  const groupAddress = await publicClient.readContract({
    address: factoryAddress as Address,
    abi: factoryAbi,
    functionName: 'getGroupAddress', // Updated to match new function name
    args: [code],
  });
  return groupAddress as Address;
}

/**
 * Get the admin address
 */
export async function getAdmin(): Promise<Address> {
  const admin = await publicClient.readContract({
    address: factoryAddress as Address,
    abi: factoryAbi,
    functionName: 'getAdmin', // Updated to match new function name
  });
  return admin as Address;
}

// Helper function to check if a group code exists
export async function groupCodeExists(code: `0x${string}`): Promise<boolean> {
  const groupAddress = await getGroupByCode(code);
  return groupAddress !== '0x0000000000000000000000000000000000000000';
}