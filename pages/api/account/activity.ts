import { NextApiRequest, NextApiResponse } from "next"
import axios from "axios"
import crypto from "crypto"

// Minimal in-memory log
const activityLog: Array<{ id: string; action: string; timestamp: number; status: "success" | "error" | "pending" }> = []

function logActivity(action: string, status: "success" | "error" | "pending" = "success") {
  activityLog.push({ id: `activity_${Date.now()}_${Math.random()}`, action, timestamp: Date.now(), status })
  if (activityLog.length > 50) activityLog.shift()
}

const API_KEY = "yNQjNVQM2gW3qoLcoLQ8Lo5zD4W1G9I0BzW8ZTBSphDG5zIz8HhVELz3LuIoVzXd" as string
const API_SECRET = "K5HZBQ4pVh0T9so95fXC1i3ILHHSioSvvo09SXyjmieUp7IAfLJ9yEqATIPhwsFo" as string

function signParams(params: Record<string, any>): string {
  const queryString = new URLSearchParams(params).toString()
  return crypto.createHmac("sha256", API_SECRET).update(queryString).digest("hex")
}

// Explorer mapping
const explorers: Record<string, string> = {
  BTC: "https://www.blockchain.com/btc/tx/",
  ETH: "https://etherscan.io/tx/",
  BSC: "https://bscscan.com/tx/",
  POLYGON: "https://polygonscan.com/tx/",
  TRX: "https://tronscan.org/#/transaction/",
  SOL: "https://explorer.solana.com/tx/",
  USDT_ETH: "https://etherscan.io/tx/",
  USDT_BSC: "https://bscscan.com/tx/",
  USDT_POLYGON: "https://polygonscan.com/tx/",
  USDT_TRX: "https://tronscan.org/#/transaction/",
}

// Minimal explorer URL helper
function getExplorerUrl(coin: string, network: string, txId: string): string {
  const key = coin === "USDT" ? `USDT_${network}` : network
  return txId && explorers[key] ? explorers[key] + txId : ""
}

// Fetch Binance deposits & withdrawals
async function fetchBinanceActivity() {
  const timestamp = Date.now()
  const recvWindow = 5000
  const params = { timestamp, recvWindow }

  const deposits = await axios.get("https://api.binance.com/sapi/v1/capital/deposit/hisrec", {
    headers: { "X-MBX-APIKEY": API_KEY },
    params: { ...params, signature: signParams(params) },
  })

  const withdrawals = await axios.get("https://api.binance.com/sapi/v1/capital/withdraw/history", {
    headers: { "X-MBX-APIKEY": API_KEY },
    params: { ...params, signature: signParams(params) },
  })

  // Minimal mapping
  const depositsMinimal = deposits.data.map((d: any) => ({
    coin: d.coin,
    network: d.network,
    amount: d.amount,
    status: d.status,
    txId: d.txId,
    explorerUrl: getExplorerUrl(d.coin, d.network, d.txId),
  }))

  const withdrawalsMinimal = withdrawals.data.map((w: any) => ({
    coin: w.coin,
    network: w.network,
    amount: w.amount,
    status: w.status,
    txId: w.txId,
    explorerUrl: getExplorerUrl(w.coin, w.network, w.txId),
  }))

  return { deposits: depositsMinimal, withdrawals: withdrawalsMinimal }
}

// API handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })
  if (req.cookies.auth_token !== "authenticated") return res.status(401).json({ error: "Unauthorized" })

  try {
    const activity = await fetchBinanceActivity()
    logActivity("Fetched Binance activity", "success")
    return res.status(200).json({ activities: activityLog.slice().reverse(), data: activity })
  } catch (err: any) {
    logActivity("Failed to fetch Binance activity", "error")
    console.error(err.response?.data || err.message)
    return res.status(500).json({ error: "Failed to fetch Binance activity" })
  }
}
