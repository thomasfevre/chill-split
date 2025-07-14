"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useWallet } from "@/context/wallet-context"
import type { Expense } from "@/lib/mock-data"

interface ExpenseValidationActionsProps {
  expense: Expense
  onValidate: (expenseId: string, status: "Validated" | "Rejected") => void
}

export function ExpenseValidationActions({ expense, onValidate }: ExpenseValidationActionsProps) {
  const { userId } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine the overall status of the expense
  const getOverallStatus = () => {
    const statuses = expense.validations.map((v) => v.status)
    if (statuses.every((status) => status === "Validated")) {
      return "Validated"
    }
    if (statuses.every((status) => status === "Rejected")) {
      return "Rejected"
    }
    return "Pending"
  }

  const overallStatus = getOverallStatus()

  const userHasValidated = expense.validations.some(
    (validation) => validation.participantId === userId && validation.status === "Validated"
  )

  // Display the overall status
  if (overallStatus !== "Pending" || userHasValidated) {
    return (
      <div className="flex items-center gap-1 text-sm">
        {overallStatus === "Validated" && userHasValidated ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Validated</span>
          </>
        ) : overallStatus === "Rejected" ? (
          <>
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Rejected</span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-600">Pending</span>
          </>
        ) }
      </div>
    )
  }

  const handleValidate = async () => {
    setIsSubmitting(true)
    try {
      onValidate(expense.id, "Validated")
    } catch (error) {
      console.error("Error validating expense:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      onValidate(expense.id, "Rejected")
    } catch (error) {
      console.error("Error rejecting expense:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              onClick={handleValidate}
              disabled={isSubmitting}
            >
              <CheckCircle className="h-4 w-4" />
              <span className="sr-only">Validate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Validate this expense</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            disabled={isSubmitting}
          >
            <XCircle className="h-4 w-4" />
            <span className="sr-only">Reject</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this expense? This action will mark the expense as disputed and may
              require further discussion with the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
