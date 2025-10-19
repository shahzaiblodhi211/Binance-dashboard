import type { NextApiRequest, NextApiResponse } from "next"
import axios from "axios"
import crypto from "crypto"

interface Deposit {
  coin: string
  amount: number
  usdValue: number
  insertTime: number
  status: string
  txId: string
  network: string
}

interface DepositResponse {
  deposits: Deposit[]
  totalUSD: number
  timestamp: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Check authentication
  if (req.cookies.auth_token !== "authenticated") {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const apiKey = "yNQjNVQM2gW3qoLcoLQ8Lo5zD4W1G9I0BzW8ZTBSphDG5zIz8HhVELz3LuIoVzXd" as string
    const secretKey = "K5HZBQ4pVh0T9so95fXC1i3ILHHSioSvvo09SXyjmieUp7IAfLJ9yEqATIPhwsFo" as string

    if (!apiKey || !secretKey) {
      return res.status(500).json({ error: "Missing Binance API credentials." })
    }

    const timestamp = Date.now()
    const query = `timestamp=${timestamp}`
    const signature = crypto.createHmac("sha256", secretKey).update(query).digest("hex")

    // 1️⃣ Fetch deposit history from Binance
    const depositUrl = `https://api.binance.com/sapi/v1/capital/deposit/hisrec?${query}&signature=${signature}`
    const depositRes = await axios.get(depositUrl, {
      headers: { "X-MBX-APIKEY": apiKey },
    })

    const depositsRaw: any[] = depositRes.data || []

    // 2️⃣ Fetch prices to compute USD value
    const priceRes = await axios.get("https://api.binance.com/api/v3/ticker/price")
    const pricesRaw: any[] = priceRes.data
    const prices: Record<string, number> = {}
    pricesRaw.forEach((p) => {
      prices[p.symbol] = parseFloat(p.price)
    })

    // 3️⃣ Map deposits to include usdValue, txId, network
    const deposits: Deposit[] = depositsRaw.map((d) => {
      const coin = d.coin
      const amount = parseFloat(d.amount)
      const priceKey = `${coin}USDT`
      const usdValue = prices[priceKey] ? amount * prices[priceKey] : 0
      return {
        coin,
        amount,
        usdValue,
        insertTime: d.insertTime,
        status: d.status === 1 ? "Completed" : "Pending",
        txId: d.txId,
        network: d.network,
      }
    })

    const totalUSD = deposits.reduce((sum, d) => sum + d.usdValue, 0)

    res.status(200).json({
      deposits,
      totalUSD,
      timestamp: Date.now(),
    } as DepositResponse)
  } catch (error: any) {
    console.error("Binance API error:", error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
}
