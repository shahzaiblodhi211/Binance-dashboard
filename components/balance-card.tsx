"use client"

import { useState } from "react"
import useSWR from "swr"
import { RefreshCw } from "lucide-react"
import type { Balance } from "@/lib/types"

interface BalanceResponse {
  balances: Balance[]
  totalUSD: number
  timestamp: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BalanceCard() {
  const { data, error, isLoading, mutate } = useSWR<BalanceResponse>("/api/account/balances", fetcher, {
    refreshInterval: 30000,
  })
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Account Balances</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          className="p-2 hover:bg-background rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger rounded-lg p-4 text-danger text-sm mb-4">
          Failed to load balances. Please check your API credentials.
        </div>
      )}

      {isLoading && !data ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-background rounded animate-pulse"></div>
          ))}
        </div>
      ) : data && data.balances.length > 0 ? (
        <>
          {/* Total Balance */}
          <div className="bg-background rounded-lg p-4 mb-6 border border-border">
            <p className="text-text-secondary text-sm mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-white">{formatUSD(data.totalUSD)}</p>
            <p className="text-xs text-text-secondary mt-2">Updated: {new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>

          {/* Individual Balances */}
          <div className="space-y-3">
            {data.balances.map((balance) => (
              <div
                key={balance.asset}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-accent transition-colors"
              >
                <div>
                  <p className="font-semibold">{balance.asset}</p>
                  <p className="text-xs text-text-secondary">
                    Free: {formatNumber(balance.free)} | Locked: {formatNumber(balance.locked)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatUSD(balance.usdValue || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-text-secondary">
          <p>No balances found or using mock data</p>
        </div>
      )}
    </div>
  )
}
