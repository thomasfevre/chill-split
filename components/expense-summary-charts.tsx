"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"
import type { Group } from "@/lib/mock-data"
import { useWallet } from "@/context/wallet-context"

interface ExpenseSummaryChartsProps {
  group: Group
}

export function ExpenseSummaryCharts({ group }: ExpenseSummaryChartsProps) {
  const { walletAddress, username } = useWallet()
  // Calculate data for participant distribution chart
  const participantDistribution = useMemo(() => {
    const distribution = group.participants.map((participant) => {
      const totalPaid = group.expenses
        .filter((expense) => expense.paidBy === participant.id)
        .reduce((sum, expense) => sum + expense.amount, 0)

      return {
        name: participant.walletAddress === walletAddress ? "You" : participant.pseudo,
        value: totalPaid,
        id: participant.id,
      }
    })

    return distribution.sort((a, b) => b.value - a.value)
  }, [group.expenses, group.participants])

  // Calculate data for validation status chart
  const validationStatusData = useMemo(() => {
    const validationCounts = { Validated: 0, Pending: 0, Rejected: 0 }

    group.expenses.forEach((expense) => {
      expense.validations.forEach((validation) => {
        validationCounts[validation.status]++
      })
    })

    return [
      { name: "Validated", value: validationCounts.Validated },
      { name: "Pending", value: validationCounts.Pending },
      { name: "Rejected", value: validationCounts.Rejected },
    ].filter((item) => item.value > 0)
  }, [group.expenses])

  // Calculate data for expense timeline
  const expenseTimeline = useMemo(() => {
    const sortedExpenses = [...group.expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return sortedExpenses.map((expense) => {
      return {
        name: new Date(expense.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        amount: expense.amount,
        label: expense.label,
      }
    })
  }, [group.expenses])

  // Colors for charts
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c", "#d0ed57"]
  const STATUS_COLORS = {
    Validated: "#22c55e", // green
    Pending: "#eab308", // yellow
    Rejected: "#ef4444", // red
  }

  if (group.expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No expenses to display</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution">
            <TabsList className="flex flex-col gap-2 sm:grid sm:grid-cols-3 w-full h-auto">
            <TabsTrigger value="distribution" className="w-full">Who Paid</TabsTrigger>
            <TabsTrigger value="validation" className="w-full">Validation Status</TabsTrigger>
            <TabsTrigger value="timeline" className="w-full">Timeline</TabsTrigger>
            </TabsList>

          <TabsContent value="distribution" className="mt-4">
            <div className="h-[300px] md:h-[400px] w-full max-w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={participantDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={window.innerWidth < 768 ? 100 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={
                      window.innerWidth < 768
                        ? false
                        : ({ name, value, percent }) =>
                            `${name}: $${value.toFixed(2)} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {participantDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount Paid"]}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="mt-4">
            <div className="h-[300px] md:h-[400px] w-full max-w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={validationStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={window.innerWidth < 768 ? 100 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={window.innerWidth < 768
                        ? false
                        : ({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {validationStatusData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <ChartContainer
              config={{
                amount: {
                  label: "Amount ($)",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px] md:h-[400px] w-full max-w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseTimeline} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={window.innerWidth < 640 ? -30 : -45}
                    textAnchor="end"
                    height={window.innerWidth < 640 ? 40 : 60}
                    fontSize={window.innerWidth < 640 ? 10 : 12}
                  />
                  <YAxis tickFormatter={(value) => `$${value}`} fontSize={window.innerWidth < 640 ? 10 : 12} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" name="Amount" fill="var(--color-amount)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Custom tooltip for the timeline chart
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-2 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{payload[0].payload.description}</p>
        <p className="font-bold">${payload[0].value.toFixed(2)}</p>
      </div>
    )
  }

  return null
}
