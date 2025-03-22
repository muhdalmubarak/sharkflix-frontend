// components/table/columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDateTime } from "@/lib/utils" // You'll need to create this utility function

// Define the type for our revenue data
export type Revenue = {
  id: number
  amount: number
  sourceType: 'movie' | 'event'
  sourceName: string
  createdAt: string
  isPaid: boolean
  paidAt: string | null
  transactionId: string
}

export const columns: ColumnDef<Revenue>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      return <div>{formatDate(row.getValue("createdAt"))}</div>
    },
  },
  {
    accessorKey: "sourceName",
    header: "Source",
  },
  {
    accessorKey: "sourceType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("sourceType") as string
      return (
        <Badge variant={type === 'movie' ? 'default' : 'secondary'}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "amount",
    header: "Amount (MYR)",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat('en-MY', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "isPaid",
    header: "Status",
    cell: ({ row }) => {
      const isPaid = row.getValue("isPaid") as boolean
      return (
        <Badge variant={isPaid ? "success" : "warning"}>
          {isPaid ? "Paid" : "Pending"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "paidAt",
    header: "Payment Date",
    cell: ({ row }) => {
      const paidAt = row.getValue("paidAt") as string | null
      return paidAt ? formatDate(paidAt) : "-"
    },
  },
  {
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => {
      const transactionId = row.getValue("transactionId") as string
      return <div className="font-mono text-sm">{transactionId}</div>
    },
  },
]
