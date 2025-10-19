"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Copy } from "lucide-react"

export default function Header() {
  const router = useRouter()
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const handleCopy = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Fetch USDT TRC20 wallet address from balances API
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/account/balances")
        if (!res.ok) return
        const data = await res.json()
        const usdtTrc20 = data.balances.find(
          (b: any) => b.asset === "USDT" && b.network === "TRC20"
        )
        if (usdtTrc20?.walletAddress) setWalletAddress(usdtTrc20.walletAddress)
      } catch (err) {
        console.error("Failed to fetch wallet address", err)
      }
    }

    fetchWallet()
  }, [])

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg text-white">₿</span>
          </div>
          <h1 className="text-xl font-bold">Binance Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {walletAddress && (
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-white">
              <span className="truncate max-w-[180px]">{walletAddress}</span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-accent/20 rounded transition-colors flex items-center justify-center"
                title="Copy wallet address"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
              {copied && <span className="ml-2 text-xs text-success">Copied!</span>}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
