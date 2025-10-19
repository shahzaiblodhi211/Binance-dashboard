import type { WithdrawRequest } from "./types"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateWithdrawRequest(request: WithdrawRequest): ValidationResult {
  const errors: string[] = []

  // Validate coin
  if (!request.coin || request.coin.length === 0) {
    errors.push("Coin is required")
  } else if (!/^[A-Z0-9]{2,10}$/.test(request.coin)) {
    errors.push("Invalid coin format")
  }

  // Validate network
  if (!request.network || request.network.length === 0) {
    errors.push("Network is required")
  } else if (!/^[A-Z0-9]{2,20}$/.test(request.network)) {
    errors.push("Invalid network format")
  }

  // Validate address
  if (!request.address || request.address.length === 0) {
    errors.push("Address is required")
  } else if (request.address.length < 20 || request.address.length > 200) {
    errors.push("Address length must be between 20 and 200 characters")
  }

  // Validate amount
  if (request.amount <= 0) {
    errors.push("Amount must be greater than 0")
  } else if (request.amount > 1000000) {
    errors.push("Amount exceeds maximum limit")
  }

  // Validate addressTag if provided
  if (request.addressTag && request.addressTag.length > 100) {
    errors.push("Address tag is too long")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function estimateWithdrawFee(coin: string, amount: number): number {
  // Mock fee estimation - in production, fetch from Binance API
  const feePercentages: Record<string, number> = {
    BTC: 0.0005,
    ETH: 0.005,
    BNB: 0.001,
    USDT: 1,
  }

  const feePercent = feePercentages[coin] || 0.001
  return amount * feePercent
}
