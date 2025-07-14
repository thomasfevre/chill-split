import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Expense, Participant } from "./mock-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRealExpenseCount(Expenses: Expense[]) {
  return Expenses.filter((expense) => expense.amount !== 0).length
}

export function areExpensesAllValidated(Expenses: Expense[]) {
  if (Expenses.length === 0) return false
  return Expenses.every((expense) => expense.fullyValidated)
}

export function getReimbursementProgress(participants: Participant[]) {
  let reimbursedCount = 0;
  let totalParticipants = participants.length;

  participants.forEach((participant) => {
    if (participant.balance === 0) {
      reimbursedCount++;
    }
  });

  return {
    reimbursedCount,
    pendingCount: totalParticipants - reimbursedCount,
  };
}
