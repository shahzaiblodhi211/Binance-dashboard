import type { NextApiRequest, NextApiResponse } from "next"
import { getBinanceClient } from "@/lib/binance-client"
import { validateWithdrawActionKey, sanitizeErrorMessage } from "@/lib/security"
import { checkRateLimit } from "@/lib/rate-limiter"
import { logActivity } from "./activity"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Check authentication
  if (req.cookies.auth_token !== "authenticated") {
    return res.status(401).json({ error: "Unauthorized" })
  }

  // Validate withdrawal action key
  const actionKey = req.headers["x-api-action-key"] as string | undefined
  if (!validateWithdrawActionKey(actionKey)) {
    logActivity("Withdrawal attempt with invalid action key", "error")
    return res.status(403).json({ error: "Invalid action key" })
  }

  // Rate limiting: 1 withdrawal per minute per IP
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown"
  if (!checkRateLimit(clientIp, 1, 60000)) {
    logActivity("Withdrawal rate limit exceeded", "error")
    return res.status(429).json({ error: "Too many withdrawal attempts. Please wait before trying again." })
  }

  const { coin, network, address, addressTag, amount } = req.body

  // Validate input
  if (!coin || !network || !address || !amount || amount <= 0) {
    logActivity(`Withdrawal validation failed for ${coin}`, "error")
    return res.status(400).json({ error: "Invalid withdrawal parameters" })
  }

  // Validate address format (basic check)
  if (address.length < 20 || address.length > 200) {
    logActivity(`Withdrawal with invalid address format`, "error")
    return res.status(400).json({ error: "Invalid address format" })
  }

  try {
    const client = getBinanceClient()

    // Get current balance to verify sufficient funds
    const balances = await client.getAccountBalances()
    const balance = balances.find((b) => b.asset === coin)

    if (!balance) {
      logActivity(`Withdrawal failed: ${coin} not found in balances`, "error")
      return res.status(400).json({ error: `${coin} not found in your account` })
    }

    const availableBalance = Number.parseFloat(balance.free)
    if (availableBalance < amount) {
      logActivity(`Withdrawal failed: insufficient balance for ${coin}`, "error")
      return res.status(400).json({
        error: `Insufficient balance. Available: ${availableBalance} ${coin}`,
      })
    }

    // Initiate withdrawal
    const withdrawResponse = await client.initiateWithdraw(coin, network, address, amount, addressTag)

    logActivity(`Withdrawal initiated: ${amount} ${coin} to ${address.substring(0, 10)}...`, "success")

    return res.status(200).json({
      id: withdrawResponse.id,
      status: "success",
      message: "Withdrawal initiated successfully",
    })
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error)
    logActivity(`Withdrawal error: ${errorMessage}`, "error")

    console.error("[API] Withdrawal error:", error)

    return res.status(500).json({
      error: errorMessage,
    })
  }
}
