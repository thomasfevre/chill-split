import { createPublicClient, http } from 'viem';
import { groupAbi } from '@/constants/group-abi';
import { Address } from 'viem'; // For better types
import { baseSepolia } from 'viem/chains';

// Setup a readonly public client
export const publicClient = createPublicClient({
  chain: baseSepolia, // Optional: if using a chain config
  transport: http()
});

// --------- Group Read Functions ---------


/**
 * Get the group code
 */
export async function getGroupCode(groupAddress: Address, walletAddress: Address): Promise<`0x${string}`> {
  const groupCode = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'getGroupCode',
    account: walletAddress,
  });
  return groupCode as `0x${string}`;
}


/**
 * Get the participants and usernames of the group
 */
export async function getParticipants(groupAddress: Address, walletAddress: Address): Promise<{
  participants: Address[];
  usernames: string[];
  balances: Number[];
}> {
  try {
    const [participants, usernames, balances] = await publicClient.readContract({
      address: groupAddress,
      abi: groupAbi,
      functionName: 'getParticipants',
      account: walletAddress,
    }) as [Address[], string[], Number[]];
    
    return { participants, usernames, balances };
  } catch (error) {
    // Handle custom error: NotParticipant
    console.error("Error getting participants:", error);
    throw error;
  }
}

/**
 * Get the group state
 */
export async function getGroupState(groupAddress: Address): Promise<number> {
  const groupState = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'groupState',
  });
  return groupState as number;
}

/**
 * Check if all expenses are settled
 */
export async function isAllSettled(groupAddress: Address): Promise<boolean> {
  const allSettled = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'isAllSettled',
  });
  return allSettled as boolean;
}

/**
 * Get the number of expenses in the group
 */
export async function getExpenseCount(groupAddress: Address): Promise<number> {
  const expenseCount = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'expenseCount',
  });
  return expenseCount as number;
}

/**
 * Get the USDC token address used in the group
 */
export async function getUsdcToken(groupAddress: Address): Promise<Address> {
  const usdcToken = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'usdcToken',
  });
  return usdcToken as Address;
}

/**
 * Get the group creation timestamp
 */
export async function getCreatedAt(groupAddress: Address): Promise<number> {
  const createdAt = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'createdAt',
  });
  return createdAt as number;
}

/**
 * Get group details
 */
export async function getGroupDetails(groupAddress: Address, walletAddress: Address): Promise<{
  name: string;
  creator: Address;
  state: number;
  createdAt: number;
}> {
  try {
    const [name, creator, state, createdAt] = await publicClient.readContract({
      address: groupAddress,
      abi: groupAbi,
      functionName: 'getGroupDetails',
      account: walletAddress,
    }) as [string, Address, number, number];
    
    return { name, creator, state, createdAt };
  } catch (error) {
    // Handle custom error: NotParticipant
    console.error("Error getting group details:", error);
    throw error;
  }
}

/**
 * Get user balances
 */
export async function getUserBalance(groupAddress: Address, user: Address, walletAddress: Address): Promise<bigint> {
  const balance = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'userBalances',
    account: walletAddress,
    args: [user],
  });
  return balance as bigint;
}

/**
 * Get a specific expense by ID
 */
export async function getExpense(groupAddress: Address, expenseId: number, walletAddress: Address): Promise<{
  label: string;
  amount: bigint;
  payer: Address;
  validators: Address[];
  validationsStatus: boolean[];
  fullyValidated: boolean;
  timestamp: number;
}> {
  try {
    const expense = await publicClient.readContract({
      address: groupAddress,
      abi: groupAbi,
      functionName: 'getExpense',
      account: walletAddress,
      args: [expenseId],
    });
    
    return expense as {
      label: string;
      amount: bigint;
      payer: Address;
      validators: Address[];
      validationsStatus: boolean[];
      fullyValidated: boolean;
      timestamp: number;
    };
  } catch (error) {
    // Handle custom errors: NotParticipant, InvalidExpenseId
    console.error(`Error getting expense ${expenseId}:`, error);
    throw error;
  }
}

/**
 * Get all expenses in the group
 */
export async function getExpenses(groupAddress: Address, walletAddress: Address): Promise<
  {
    label: string;
    amount: bigint;
    payer: Address;
    validators: Address[];
    validationsStatus: boolean[];
    fullyValidated: boolean;
    timestamp: number;
  }[]
> {
  try {
    const expenses = await publicClient.readContract({
      address: groupAddress,
      abi: groupAbi,
      functionName: 'getExpenses',
      account: walletAddress,
    });
    
    return expenses as {
      label: string;
      amount: bigint;
      payer: Address;
      validators: Address[];
      validationsStatus: boolean[];
      fullyValidated: boolean;
      timestamp: number;
    }[];
  } catch (error) {
    // Handle custom error: NotParticipant
    console.error("Error getting expenses:", error);
    throw error;
  }
}

/**
 * Check if a user is a participant or creator
 */
export async function isParticipant(groupAddress: Address, user: Address): Promise<boolean> {
  const result = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'isParticipant',
    args: [user],
  });
  return result as boolean;
}

/**
 * Check if a user is an expense validator
 */
export async function isExpenseValidator(
  groupAddress: Address,
  user: Address,
  expenseId: number
): Promise<boolean> {
  const result = await publicClient.readContract({
    address: groupAddress,
    abi: groupAbi,
    functionName: 'isExpenseValidator',
    args: [user, expenseId],
  });
  return result as boolean;
}

/**
 * Check if an expense is fully validated
 */
export async function isFullyValidated(
  groupAddress: Address,
  expenseId: number,
  walletAddress: Address
): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: groupAddress,
      abi: groupAbi,
      functionName: 'isFullyValidated',
      account: walletAddress,
      args: [expenseId],
    });
    return result as boolean;
  } catch (error) {
    // Handle custom error: NotParticipant
    console.error(`Error checking if expense ${expenseId} is fully validated:`, error);
    throw error;
  }
}