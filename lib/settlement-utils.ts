import type { Group } from "./mock-data"

export interface ParticipantBalance {
  participantId: string
  pseudo: string
  paid: number
  owes: number
  netBalance: number
  netBalanceCopy: number // Copy of the original net balance for later use
}

export interface SettlementTransaction {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export interface SettlementSummary {
  totalExpenses: number
  avgShare: number
  participantBalances: ParticipantBalance[]
  transactions: SettlementTransaction[]
}

/**
 * Calculate the settlement for a group
 */
export function calculateSettlement(group: Group): SettlementSummary {
  const totalExpenses = group.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const avgShare = totalExpenses / group.participants.length

  const participantBalances: ParticipantBalance[] = group.participants.map((participant) => {
    const participantId = participant.id

    // 1. Total paid by this participant
    const paid = group.expenses
      .filter((expense) => expense.paidBy === participantId)
      .reduce((sum, expense) => sum + expense.amount, 0)

    // 2. Total this participant owes across all expenses
    const owes = group.expenses.reduce((totalOwes, expense) => {
      const involved = expense.validations;
      const isInvolved = involved.map((validation) => validation.participantId).includes(participantId)
      if (!isInvolved) return totalOwes

      const share = expense.amount / involved.length
      return totalOwes + share
    }, 0)

    const netBalance = paid - owes

    return {
      participantId,
      pseudo: participant.pseudo,
      paid,
      owes,
      netBalance,
      netBalanceCopy: netBalance
    }
  })


  // Step 2: Calculate the optimal set of transactions to settle the group
  const transactions = calculateOptimalTransactions(participantBalances)

  return {
    totalExpenses,
    avgShare,
    participantBalances,
    transactions,
  }
}

/**
 * Calculate the optimal set of transactions to settle the group
 */
function calculateOptimalTransactions(balances: ParticipantBalance[]): SettlementTransaction[] {
  const transactions: SettlementTransaction[] = []

  // Create copies of the balances to work with
  const debtors = balances
    .filter((balance) => balance.netBalance < 0)
    .map((balance) => ({
      ...balance,
      netBalance: Math.abs(balance.netBalance), // Convert to positive for easier calculation
    }))
    .sort((a, b) => b.netBalance - a.netBalance) // Sort by amount (descending)

  const creditors = balances.filter((balance) => balance.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance) // Sort by amount (descending)

  // While there are still debtors and creditors
  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0]
    const creditor = creditors[0]

    // Calculate the transaction amount (minimum of what the debtor owes and what the creditor is owed)
    const amount = Math.min(debtor.netBalance, creditor.netBalance)

    // Round to 2 decimal places to avoid floating point issues
    const roundedAmount = Math.round(amount * 100) / 100

    if (roundedAmount > 0) {
      transactions.push({
        fromId: debtor.participantId,
        fromName: debtor.pseudo,
        toId: creditor.participantId,
        toName: creditor.pseudo,
        amount: roundedAmount,
      })
    }

    // Update balances
    debtor.netBalance -= roundedAmount
    creditor.netBalance -= roundedAmount

    // Remove participants with zero balance
    if (Math.abs(debtor.netBalance) < 0.01) {
      debtors.shift()
    }

    if (Math.abs(creditor.netBalance) < 0.01) {
      creditors.shift()
    }
  }

  return transactions
}
