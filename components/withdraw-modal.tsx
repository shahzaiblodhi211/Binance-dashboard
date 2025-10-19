"use client"

import type React from "react"

import { useState } from "react"
import { Send, AlertCircle } from "lucide-react"
import type { WithdrawRequest } from "@/lib/types"
import { initiateWithdrawal } from "@/app/actions/withdraw"

export default function WithdrawModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [step, setStep] = useState<"form" | "confirm">("form")
  const [formData, setFormData] = useState<WithdrawRequest>({
    coin: "",
    network: "",
    address: "",
    amount: 0,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number.parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.coin || !formData.network || !formData.address || formData.amount <= 0) {
      setError("Please fill in all required fields")
      return
    }

    if (step === "form") {
      setStep("confirm")
      return
    }

    setLoading(true)
    try {
      const result = await initiateWithdrawal(formData)

      if (result.success) {
        setSuccess(`Withdrawal initiated! ID: ${result.id}`)
        setFormData({ coin: "", network: "", address: "", amount: 0 })
        setStep("form")
        setTimeout(() => {
          setIsOpen(false)
          setSuccess("")
        }, 3000)
      } else {
        setError(result.error || "Withdrawal failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-accent hover:bg-accent-dark font-semibold py-3 rounded-lg transition-colors flex items-center justify-center text-white gap-2"
      >
        <Send className="w-5 h-5" />
        Withdraw
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{step === "form" ? "Initiate Withdrawal" : "Confirm Withdrawal"}</h2>

            {error && (
              <div className="bg-danger/10 border border-danger rounded-lg p-3 text-danger text-sm mb-4 flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-success/10 border border-success rounded-lg p-3 text-success text-sm mb-4">
                {success}
              </div>
            )}

            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Coin</label>
                  <input
                    type="text"
                    name="coin"
                    value={formData.coin}
                    onChange={handleInputChange}
                    placeholder="e.g., BTC"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-text-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Network</label>
                  <input
                    type="text"
                    name="network"
                    value={formData.network}
                    onChange={handleInputChange}
                    placeholder="e.g., BTC"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-text-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Withdrawal address"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-text-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount || ""}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.00000001"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-text-secondary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg hover:bg-border transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-accent hover:bg-accent-dark text-background rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Coin:</span>
                    <span className="font-semibold">{formData.coin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Network:</span>
                    <span className="font-semibold">{formData.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Amount:</span>
                    <span className="font-semibold">{formData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Address:</span>
                    <span className="font-semibold text-xs truncate">{formData.address}</span>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning rounded-lg p-3 text-warning text-xs">
                  Please verify all details before confirming. This action cannot be undone.
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg hover:bg-border transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-danger hover:bg-danger/80 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Confirm Withdraw"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
