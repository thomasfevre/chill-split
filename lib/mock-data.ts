export type GroupStatus = "Live" | "To Be Closed" | "Closed"

export type ValidationStatus = "Validated" | "Pending" | "Rejected"

export interface Participant {
  id: string
  walletAddress: string
  shortName: string
  pseudo: string
  balance?: number
}

export interface Expense {
  id: string
  label: string
  amount: number
  paidBy: string
  date: string
  validations: {
    participantId: string
    status: ValidationStatus
  }[]
  fullyValidated?: boolean
}

export interface Group {
  id: string
  name: string
  status: GroupStatus
  participants: Participant[]
  expenses: Expense[]
  realExpensesCount: number
  creator: string
  createdAt: string
  pendingAction?: boolean
}

// Generate random wallet address
const randomWallet = () => {
  const chars = "0123456789abcdef"
  let result = "0x"
  for (let i = 0; i < 40; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// Generate short name from wallet
const shortName = (wallet: string) => {
  return wallet.substring(0, 4) + "..." + wallet.substring(wallet.length - 4)
}

// Generate random participants


// Generate random expenses
const generateExpenses = (participants: Participant[], count: number): Expense[] => {
  const label = [
    "Dinner at restaurant",
    "Taxi ride",
    "Museum tickets",
    "Groceries",
    "Hotel room",
    "Beach equipment",
    "Concert tickets",
    "Drinks at bar",
  ]

  return Array.from({ length: count }, (_, i) => {
    const paidBy = participants[Math.floor(Math.random() * participants.length)].id
    const amount = Math.floor(Math.random() * 10000) / 100

    return {
      id: `e${i + 1}`,
      label: label[Math.floor(Math.random() * label.length)],
      amount,
      paidBy,
      date: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      validations: participants.map((p) => ({
        participantId: p.id,
        status: paidBy === p.id ? "Validated" : Math.random() > 0.3 ? "Validated" : "Pending",
      })),
    }
  })
}

// Mock groups
export const mockGroups: Group[] = [
  // {
  //   id: "g1",
  //   name: "Barcelona Trip",
  //   code: "123-234-456",
  //   status: "Live",
  //   participants: generateParticipants(4),
  //   expenses: [],
  //   createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  //   pendingAction: "Validation Needed",
  // },
  // {
  //   id: "g2",
  //   name: "Apartment Expenses",
  //   code: "789-012-345",
  //   status: "To Be Closed",
  //   participants: generateParticipants(3),
  //   expenses: [],
  //   createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  //   closingTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  //   pendingAction: null,
  // },
  // {
  //   id: "g3",
  //   name: "Road Trip 2023",
  //   code: "567-890-123",
  //   status: "Closed",
  //   participants: generateParticipants(5),
  //   expenses: [],
  //   createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  //   closingTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  //   settledAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString(),
  //   pendingAction: "Pending Refund",
  // },
]

// Add expenses to each group
// mockGroups[0].expenses = generateExpenses(mockGroups[0].participants, 3)
// mockGroups[1].expenses = generateExpenses(mockGroups[1].participants, 4)
// mockGroups[2].expenses = generateExpenses(mockGroups[2].participants, 2)

// Get a specific group by ID
export const getGroupById = (id: string): Group | undefined => {
  return mockGroups.find((group) => group.id === id)
}
