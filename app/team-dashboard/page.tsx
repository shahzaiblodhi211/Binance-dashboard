"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import BalanceCard from "@/components/balance-card"
import DepositTable from "@/components/deposit-table"
import WithdrawModal from "@/components/withdraw-modal"
import ActivityPanel from "@/components/activity-panel"

export default function DashboardPage() {
  
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        if (response.ok) {
          setAuthenticated(true)
        } else {
          router.push("/")
        }
      } catch (err) {
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Security Banner */}
        <div className="bg-warning/10 border border-warning rounded-lg p-4 mb-8">
          <p className="text-warning text-sm">
            <strong>Welcome back! 🎉</strong> 
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Balances and Deposits */}
          <div className="lg:col-span-2 space-y-8">
            <DepositTable />
          </div>

          {/* Right Column - Withdraw and Activity */}
          <div className="space-y-8">
            <ActivityPanel />
          </div>
        </div>
      </main>
    </div>
  )
}
