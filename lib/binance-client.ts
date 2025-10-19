// lib/binance-client.ts
import axios, { AxiosRequestConfig } from "axios"

const DEFAULT_ENDPOINTS = [
  "https://api.binance.com/api",
]

let serverTimeOffset = 0

type BinanceBalance = { asset: string; free: string; locked: string }
type BinanceAccount = { balances: BinanceBalance[]; updateTime?: number }
type BinanceDeposit = {
  id: string
  coin: string
  amount: number
  network: string
  status: number
  insertTime: number
  txId: string
  confirmTimes?: string
}
type BinancePrice = Record<string, string>

class BinanceClient {
  private apiKey: string
  private apiSecret: string
  private useMock: boolean
  private baseUrl: string | null = null
  private timeSynced = false

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || ""
    this.apiSecret = process.env.BINANCE_API_SECRET || ""
    this.useMock = process.env.USE_MOCK_SERVER === "true"
  }

  // pick a working endpoint (tries endpoints in DEFAULT_ENDPOINTS)
  private async detectEndpoint(): Promise<string> {
    if (this.baseUrl) return this.baseUrl

    for (const url of DEFAULT_ENDPOINTS) {
      try {
        // quick HEAD-like request to /api/v3/time to check response JSON
        const cfg: AxiosRequestConfig = {
          timeout: 5000,
          headers: this.defaultHeaders(),
          validateStatus: (s) => s < 500,
        }
        const r = await axios.get(`${url}/api/v3/time`, cfg)
        // If response is JSON with serverTime, consider endpoint usable
        if (r?.data && typeof r.data.serverTime === "number") {
          this.baseUrl = url
          console.log("[Binance] Using endpoint:", url)
          return url
        }
        // Some WAF return 202 challenge or HTML - log and continue
        console.warn("[Binance] Endpoint responded but no serverTime:", url, "status:", r.status)
      } catch (err: any) {
        console.warn("[Binance] Endpoint unreachable:", url, err?.message || err)
      }
    }

    // nothing worked — still set to first endpoint (to preserve previous behavior)
    this.baseUrl = DEFAULT_ENDPOINTS[0]
    console.warn("[Binance] No endpoint verified; defaulting to:", this.baseUrl)
    return this.baseUrl
  }

  private defaultHeaders() {
    // Use a realistic User-Agent — some WAFs are stricter with default Node UA
    return {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-MBX-APIKEY": this.apiKey,
      Accept: "application/json, text/plain, */*",
    }
  }

  private async syncServerTime(): Promise<void> {
    if (this.timeSynced || this.useMock) return

    try {
      const base = await this.detectEndpoint()
      const r = await axios.get(`${base}/api/v3/time`, {
        timeout: 7000,
        headers: this.defaultHeaders(),
        validateStatus: (s) => s < 500,
      })

      const serverTime = r?.data?.serverTime
      if (typeof serverTime !== "number") {
        console.warn("[Binance] Invalid serverTime response, falling back to local time:", r?.data)
        serverTimeOffset = 0
        this.timeSynced = true
        return
      }
      serverTimeOffset = serverTime - Date.now()
      this.timeSynced = true
      console.log("[Binance] Time synced. Offset:", serverTimeOffset, "ms")
    } catch (error: any) {
      console.error("[Binance] Failed to sync time:", error?.message || error)
      serverTimeOffset = 0
      this.timeSynced = true
    }
  }

  private getTimestamp(): number {
    return Date.now() + serverTimeOffset
  }

  private createSignature(query: string): string {
    const crypto = require("crypto")
    return crypto.createHmac("sha256", this.apiSecret).update(query).digest("hex")
  }

  // friendly handler that throws helpful messages for Binance errors
  private handleBinanceError(error: any, operation: string): never {
    console.error(`[Binance] ${operation} error:`, error?.response?.data || error?.message || error)
    if (axios.isAxiosError(error) && error.response) {
      const code = error.response.data?.code ?? error.response.status
      const msg = error.response.data?.msg ?? error.response.statusText ?? error.message
      if (code === -2015 || error.response.status === 401 || error.response.status === 403) {
        throw new Error(
          `API key authentication failed. Check API key/secret, IP whitelist, and region endpoint. Binance: ${msg}`,
        )
      }
      if (code === -1021) {
        throw new Error(`Timestamp sync error. ${msg}`)
      }
      throw new Error(`${operation} failed: ${msg} (Code: ${code})`)
    }
    throw new Error(`${operation} failed: ${error?.message || String(error)}`)
  }

  // returns safe array (empty if something went wrong)
async getAccountBalances(): Promise<BinanceBalance[]> {
  if (this.useMock) return this.getMockBalances();

  try {
    // 1️⃣ Ensure server time is synced
    await this.syncServerTime();

    // 2️⃣ Detect correct base endpoint (api.binance.com or region-specific)
    const base = await this.detectEndpoint();

    // 3️⃣ Prepare signed query
    const timestamp = this.getTimestamp();
    const recvWindow = 60000;
    const query = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
    const signature = this.createSignature(query);

    // 4️⃣ Make API call
    const r = await axios.get<BinanceAccount>(`${base}/api/v3/account`, {
      params: { timestamp, recvWindow, signature },
      headers: this.defaultHeaders(), // includes X-MBX-APIKEY
      timeout: 10000,
      validateStatus: (s) => s < 500, // treat 4xx as valid for handling
    });

    // 5️⃣ Validate response
    if (!r?.data || !Array.isArray(r.data.balances)) {
      console.warn("[BinanceClient] Unexpected balances response:", r?.data);
      return [];
    }

    // 6️⃣ Return balances
    return r.data.balances;
  } catch (err: any) {
    // Wrap error with helpful message
    console.error("[BinanceClient] Failed to fetch balances:", err.response?.data || err.message);
    return [];
  }
}


  async getDepositHistory(coin?: string, startTime?: number, endTime?: number): Promise<BinanceDeposit[]> {
    if (this.useMock) return this.getMockDeposits(coin)

    try {
      await this.syncServerTime()
      const base = await this.detectEndpoint()
      const timestamp = this.getTimestamp()
      const recvWindow = 60000
      const params: Record<string, any> = { timestamp, recvWindow }
      if (coin) params.coin = coin
      if (startTime) params.startTime = startTime
      if (endTime) params.endTime = endTime

      const query = new URLSearchParams(params as Record<string, string>).toString()
      const signature = this.createSignature(query)

      const r = await axios.get(`${base}/v1/capital/deposit/hisrec`, {
        params: { ...params, signature },
        timeout: 10000,
        headers: this.defaultHeaders(),
        validateStatus: (s) => s < 500,
      })

      if (!r?.data || !Array.isArray(r.data)) {
        console.warn("[BinanceClient] Unexpected deposit history response:", r?.data)
        return []
      }

      return r.data as BinanceDeposit[]
    } catch (err) {
      return this.handleErrorAndReturnEmpty(err, "Get deposit history")
    }
  }

async getPrices(): Promise<BinancePrice> {
  // ✅ Return mock prices if in mock mode
  if (this.useMock) return this.getMockPrices()

  try {
    // Detect correct Binance endpoint (e.g., default vs regional)
    const base = await this.detectEndpoint()

    // Fetch all symbol prices
    const response = await axios.get(`${base}/api/v3/ticker/price`, {
      timeout: 9000,
      headers: this.defaultHeaders(),
      validateStatus: (status) => status < 500, // Accept <500 as valid
    })

    // Check response structure
    if (!Array.isArray(response.data)) {
      console.warn("[BinanceClient] Unexpected prices response:", response.data)
      return this.getMockPrices()
    }

    // Map to { symbol: price } object
    const prices: BinancePrice = {}
    response.data.forEach((item: any) => {
      if (item?.symbol && item?.price) {
        prices[item.symbol] = String(item.price)
      }
    })

    return prices
  } catch (err: any) {
    console.error("[Binance] Error fetching prices:", err?.message || err)
    // Fallback to mock prices on error
    return this.getMockPrices()
  }
}


  // Validate API key (returns simple flags)
  async validateApiKey(): Promise<{ canRead: boolean; canWithdraw: boolean }> {
    if (this.useMock) return { canRead: true, canWithdraw: true }

    try {
      await this.syncServerTime()
      const base = await this.detectEndpoint()
      const timestamp = this.getTimestamp()
      const recvWindow = 60000
      const q = `timestamp=${timestamp}&recvWindow=${recvWindow}`
      const sig = this.createSignature(q)

      await axios.get(`${base}/api/v3/account`, {
        params: { timestamp, recvWindow, signature: sig },
        headers: this.defaultHeaders(),
        timeout: 10000,
        validateStatus: (s) => s < 500,
      })

      // attempt withdraw-permission check (best-effort)
      try {
        await axios.get(`${base}/sapi/v1/account/apiRestrictions`, {
          params: { timestamp, recvWindow, signature: sig },
          headers: this.defaultHeaders(),
          timeout: 10000,
          validateStatus: (s) => s < 500,
        })
        return { canRead: true, canWithdraw: true }
      } catch {
        return { canRead: true, canWithdraw: false }
      }
    } catch (err) {
      console.error("[Binance] Error validating API key:", err?.response?.data || err?.message || err)
      throw new Error("Invalid API key or region/whitelist issue")
    }
  }

  // Initiate withdrawal (will throw helpful errors)
  async initiateWithdraw(coin: string, network: string, address: string, amount: number, addressTag?: string) {
    if (this.useMock) return this.getMockWithdrawResponse()
    try {
      await this.syncServerTime()
      const base = await this.detectEndpoint()
      const timestamp = this.getTimestamp()
      const recvWindow = 60000
      const params: Record<string, any> = { coin, network, address, amount, timestamp, recvWindow }
      if (addressTag) params.addressTag = addressTag

      const q = new URLSearchParams(params as Record<string, string>).toString()
      const sig = this.createSignature(q)

      const r = await axios.post(
        `${base}/sapi/v1/capital/withdraw/apply`,
        {},
        {
          params: { ...params, signature: sig },
          headers: this.defaultHeaders(),
          timeout: 15000,
          validateStatus: (s) => s < 500,
        },
      )

      return r.data
    } catch (err) {
      this.handleBinanceError(err, "Initiate withdrawal")
    }
  }

  // common fallback handler returning empty arrays (logs & converts error)
  private handleErrorAndReturnEmpty(err: any, operation: string): any[] {
    console.error(`[BinanceClient] ${operation} failed:`, err?.response?.data || err?.message || err)
    // if axios response includes a WAF challenge, show helpful message
    const body = err?.response?.data
    if (typeof body === "string" && body.includes("WAF")) {
      console.warn("[BinanceClient] WAF/challenge detected in response body")
    }
    return []
  }

  // MOCKS
  private getMockBalances(): BinanceBalance[] {
    return [
      { asset: "BTC", free: "0.5", locked: "0.1" },
      { asset: "ETH", free: "5.0", locked: "1.0" },
      { asset: "USDT", free: "10000", locked: "2000" },
    ]
  }

  private getMockDeposits(coin?: string): BinanceDeposit[] {
    const all: BinanceDeposit[] = [
      { id: "1", coin: "BTC", amount: 0.5, network: "BTC", status: 1, insertTime: Date.now() - 86400000, txId: "0x1" },
      { id: "2", coin: "ETH", amount: 5, network: "ETH", status: 1, insertTime: Date.now() - 172800000, txId: "0x2" },
    ]
    return coin ? all.filter((d) => d.coin === coin) : all
  }

  private getMockPrices(): BinancePrice {
    return { BTCUSDT: "43000", ETHUSDT: "2300", USDTUSDT: "1" }
  }

  private getMockWithdrawResponse() {
    return { id: `withdraw_${Date.now()}`, status: "success" }
  }
}

let instance: BinanceClient | null = null
export function getBinanceClient(): BinanceClient {
  if (!instance) instance = new BinanceClient()
  return instance
}
