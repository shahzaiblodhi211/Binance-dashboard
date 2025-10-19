import type { NextApiRequest, NextApiResponse } from "next"
import { getBinanceClient } from "@/lib/binance-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Check authentication
  if (req.cookies.auth_token !== "authenticated") {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const client = getBinanceClient()
    const capabilities = await client.validateApiKey()

    return res.status(200).json(capabilities)
  } catch (error) {
    console.error("[API] Error validating API key:", error)
    return res.status(500).json({
      canRead: false,
      canWithdraw: false,
      error: "Failed to validate API key",
    })
  }
}
