"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"

interface Transaction {
  coin: string
  network: string
  amount: string
  status: number
  txId: string
  explorerUrl?: string
  type: "Deposit" | "Withdrawal"
  timestamp: number
}

export default function ActivityPanel() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/account/activity")
        if (response.ok) {
          const data = await response.json()
          const deposits = (data.data.deposits || []).map((d: any) => ({
            ...d,
            type: "Deposit" as const,
            timestamp: d.completeTime || d.insertTime || Date.now(),
          }))
          const withdrawals = (data.data.withdrawals || []).map((w: any) => ({
            ...w,
            type: "Withdrawal" as const,
            timestamp: w.completeTime ? new Date(w.completeTime).getTime() : Date.now(),
          }))
          // Merge and sort by latest
          const allTx = [...deposits, ...withdrawals].sort((a, b) => b.timestamp - a.timestamp)
          setTransactions(allTx)
        }
      } catch (err) {
        console.error("Failed to fetch transactions")
      }
    }

    fetchTransactions()
    const interval = setInterval(fetchTransactions, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "bg-success" // Completed
      case 0:
      case 6:
        return "bg-warning" // Pending
      default:
        return "bg-danger" // Failed
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 text-white">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-white" />
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.txId + tx.type}
              className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(tx.status)}`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {tx.type}: {tx.amount} {tx.coin} ({tx.network})
                </p>
                <p className="text-xs mt-2 text-text-secondary">{formatTime(tx.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  )
}
