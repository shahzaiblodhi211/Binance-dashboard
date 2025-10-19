import type { NextApiRequest, NextApiResponse } from "next"
import { estimateWithdrawFee } from "@/lib/validate-withdraw"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { coin, amount } = req.body

  if (!coin || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid parameters" })
  }

  try {
    const fee = estimateWithdrawFee(coin, amount)
    const total = amount + fee

    return res.status(200).json({
      coin,
      amount,
      estimatedFee: fee,
      total,
    })
  } catch (error) {
    return res.status(500).json({ error: "Failed to estimate fee" })
  }
}
