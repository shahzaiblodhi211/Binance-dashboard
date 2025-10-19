const http = require("http")
const url = require("url")

const PORT = 3001

const mockData = {
  account: {
    balances: [
      { asset: "BTC", free: "0.5", locked: "0.1" },
      { asset: "ETH", free: "5.0", locked: "1.0" },
      { asset: "USDT", free: "10000", locked: "2000" },
      { asset: "BNB", free: "10", locked: "0" },
    ],
  },
  deposits: [
    {
      id: "1",
      coin: "BTC",
      amount: 0.5,
      network: "BTC",
      status: 1,
      insertTime: Date.now() - 86400000,
      txId: "0x1234567890abcdef",
    },
    {
      id: "2",
      coin: "ETH",
      amount: 5.0,
      network: "ETH",
      status: 1,
      insertTime: Date.now() - 172800000,
      txId: "0xabcdef1234567890",
    },
  ],
  prices: {
    BTCUSDT: "43000",
    ETHUSDT: "2300",
    BNBUSDT: "600",
    USDTUSDT: "1",
  },
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname
  const query = parsedUrl.query

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-MBX-APIKEY")
  res.setHeader("Content-Type", "application/json")

  if (req.method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return
  }

  // Mock endpoints
  if (pathname === "/api/v3/account") {
    res.writeHead(200)
    res.end(JSON.stringify(mockData.account))
  } else if (pathname === "/api/v3/capital/deposit/hisrec") {
    let deposits = mockData.deposits
    if (query.coin) {
      deposits = deposits.filter((d) => d.coin === query.coin)
    }
    res.writeHead(200)
    res.end(JSON.stringify(deposits))
  } else if (pathname === "/api/v3/ticker/price") {
    const prices = Object.entries(mockData.prices).map(([symbol, price]) => ({
      symbol,
      price,
    }))
    res.writeHead(200)
    res.end(JSON.stringify(prices))
  } else if (pathname === "/api/v3/capital/withdraw/apply") {
    res.writeHead(200)
    res.end(
      JSON.stringify({
        id: `withdraw_${Date.now()}`,
        status: "success",
      }),
    )
  } else {
    res.writeHead(404)
    res.end(JSON.stringify({ error: "Not found" }))
  }
})

server.listen(PORT, () => {
  console.log(`Mock Binance API server running on http://localhost:${PORT}`)
  console.log("Available endpoints:")
  console.log("  GET  /api/v3/account")
  console.log("  GET  /api/v3/capital/deposit/hisrec")
  console.log("  GET  /api/v3/ticker/price")
  console.log("  POST /api/v3/capital/withdraw/apply")
})
