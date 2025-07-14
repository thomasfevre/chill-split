import { getGroupsByUser } from "@/services/smart-contract-fetch/factoryFetch";
import { getGroupDetails, getExpenses, getParticipants, getUserBalance } from "@/services/smart-contract-fetch/groupFetch"; // Assuming you have these
import { Group, Expense, Participant, ValidationStatus, GroupStatus } from "@/lib/mock-data"; 
import { Address } from "viem";
import { saveGroups, getGroups, clearGroupsCache } from "@/services/cache/sessionStorage"; // Assuming you have a sessionStorage utility
import { getRealExpenseCount } from "@/lib/utils";


// Example helper to map validations
function mapValidations(validators: string[], validationsStatus: boolean[]): { participantId: string, status: ValidationStatus }[] {
  const validations: { participantId: string, status: ValidationStatus }[] = [];

  for (let i = 0; i < validators.length; i++) {
    validations.push({
      participantId: validators[i],
      status: validationsStatus[i] ? "Validated" : "Pending", // You can later support "Rejected" if needed
    });
  }

  return validations;
}

// Example helper to format a participant
function formatParticipant(walletAddress: string, pseudo: string, balance?: number): Participant {
  return {
    id: walletAddress,
    walletAddress,
    shortName: walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4),
    pseudo,
    balance
  };
}

// Main function to refresh
export async function refreshBlockchainCache(address: Address, pseudo: string) {
  console.log("Refreshing blockchain cache...");
  clearGroupsCache();

  const allGroupsAddresses = await getGroupsByUser(address);
  const groups: Group[] = [];

  for (const groupAddress of allGroupsAddresses) {
    try {
      console.log("getting group details for address:", groupAddress);
      const groupDetail = await getGroupDetails(groupAddress, address); // Should return name, code, participants, status, etc
      let groupParticipants = await getParticipants(groupAddress, address); // Should return participants from contract
      const groupExpenses = await getExpenses(groupAddress, address);    // Should return your ExpenseView from contract

      const participants: Participant[] = [];
      for (let i = 0; i < groupParticipants.participants.length; i++) {
        participants.push(formatParticipant(groupParticipants.participants[i], groupParticipants.usernames[i], Number(groupParticipants.balances[i] ?? 0)/100));
      }

      const expenses: Expense[] = groupExpenses.map((expense: any, index: number) => ({
        id: `${groupAddress}-${index}`, // Unique id
        label: expense.label,
        amount: Number(expense.amount) / 100,
        paidBy: expense.payer,
        date: new Date(Number(expense.timestamp) * 1000).toISOString(),
        validations: mapValidations(expense.validators, expense.validationsStatus),
        fullyValidated: expense.validationsStatus.every((status: boolean) => status), // Check if all validations are true
      }));

      const groupStatus: GroupStatus = groupDetail.state === 0
        ? "Live"
        : groupDetail.state === 1
        ? "To Be Closed"
        : "Closed";
      
      // function see if the user has to validate one or more expenses
      const userPendingAction = expenses.some((expense: any) => {
        return expense.validations.some((validation: any) => {
          return validation.participantId === address && validation.status === "Pending";
        });
      }) || (groupStatus === "To Be Closed" && participants.some((participant) => {
        return participant.walletAddress === address && (participant.balance ?? 0) < 0;
      }));

      const group: Group = {
        id: groupAddress,
        name: groupDetail.name,
        status: groupStatus,
        participants,
        expenses,
        realExpensesCount: getRealExpenseCount(expenses),
        creator: groupDetail.creator,
        createdAt: new Date(Number(groupDetail.createdAt) * 1000).toISOString(),
        pendingAction: userPendingAction, 
      };

      groups.push(group);
      console.log("Group details:", group);

    } catch (err) {
      console.error(`Failed to fetch group ${groupAddress}`, err);
    }
  }
  groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  saveGroups(groups);
}


export async function getCachedBlockchainGroups(address: Address, pseudo: string): Promise<Group[]> {
  try {
    let cache = getGroups(); // Assuming this returns the cached groups
    if (!cache || cache.length === 0) {
      console.log("Cache is stale, refreshing...");
      await refreshBlockchainCache(address, pseudo);
      cache = getGroups();
    } else {
      console.log("Using cached blockchain groups");
      console.log("Cache:", cache);
    }
    return cache;
  } catch (err) {
    console.error("Failed to get cached blockchain groups", err);
    return [];
  }
}

export async function getCachedBlockchainGroup(address: Address, pseudo: string): Promise<Group | undefined> {
  try {
    let cache = getGroups(); // Assuming this returns the cached groups
    if (!cache || cache.length === 0) {
      await refreshBlockchainCache(address, pseudo);
      cache = getGroups();
    }
    return cache.find((group) => group.id === address);
  } catch (err) {
    console.error(`Failed to get cached blockchain group for address ${address}`, err);
    return undefined;
  }
}
