"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer } from "@/components/ui/chart"
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { ArrowRight } from "lucide-react"
import type { Group } from "@/lib/mock-data"
import { calculateSettlement } from "@/lib/settlement-utils"
import { useWallet } from "@/context/wallet-context"

interface SettlementSummaryProps {
  group: Group
}

export function SettlementSummary({ group }: SettlementSummaryProps) {
  const { userId } = useWallet()

  // Calculate settlement
  const settlement = useMemo(() => calculateSettlement(group), [group])

  // Prepare data for the balance chart
  const balanceChartData = useMemo(() => {
    return settlement.participantBalances
      .map((balance) => ({
        name: balance.pseudo,
        balance: Number(balance.netBalanceCopy.toFixed(2)),
        isCurrentUser: balance.participantId === userId,
        id: balance.participantId,
      }))
      .sort((a, b) => a.balance - b.balance) // Sort by balance (ascending)
  }, [settlement, userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances & Refunds</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Balances</TabsTrigger>
            <TabsTrigger value="transactions">Refunds To Be Done</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">${settlement.totalExpenses.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Share</p>
                <p className="text-2xl font-bold">${settlement.avgShare.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Participant Balances</h3>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    balance: {
                      label: "Balance ($)",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={balanceChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tickFormatter={(value, index) => {
                          const item = balanceChartData[index]
                          return item?.isCurrentUser ? `${value} (You)` : value
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Balance"]}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                      <Bar dataKey="balance" name="Balance">
                        {balanceChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.balance < 0 ? "#ef4444" : "#22c55e"}
                            stroke={entry.isCurrentUser ? "#8884d8" : undefined}
                            strokeWidth={entry.isCurrentUser ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 py-4">
            <h3 className="font-medium">These are the automatic transactions that will be processed once all participants have paid their share.</h3>
            {settlement.transactions.length === 0 ? (
              <p className="text-muted-foreground">No transactions needed. Everyone is settled up!</p>
            ) : (
              <ul className="space-y-3">
                {settlement.transactions.map((transaction, index) => {
                  const isUserSending = transaction.fromId === userId
                  const isUserReceiving = transaction.toId === userId
                  const isUserInvolved = isUserSending || isUserReceiving

                  return (
                    <li
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        isUserInvolved ? "bg-purple-50 border-purple-200" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isUserSending ? "font-bold" : ""}>
                          {isUserSending ? "You" : transaction.fromName}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className={isUserReceiving ? "font-bold" : ""}>
                          {isUserReceiving ? "You" : transaction.toName}
                        </span>
                      </div>
                      <span className="font-bold">${transaction.amount.toFixed(2)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
