import { getBinanceClient } from "@/lib/binance-client"

describe("Binance Client - Balances", () => {
  beforeEach(() => {
    process.env.USE_MOCK_SERVER = "true"
  })

  it("should fetch mock balances", async () => {
    const client = getBinanceClient()
    const balances = await client.getAccountBalances()

    expect(balances).toBeDefined()
    expect(balances.length).toBeGreaterThan(0)
    expect(balances[0]).toHaveProperty("asset")
    expect(balances[0]).toHaveProperty("free")
    expect(balances[0]).toHaveProperty("locked")
  })

  it("should fetch mock prices", async () => {
    const client = getBinanceClient()
    const prices = await client.getPrices()

    expect(prices).toBeDefined()
    expect(Object.keys(prices).length).toBeGreaterThan(0)
    expect(prices.BTCUSDT).toBeDefined()
  })

  it("should validate API key", async () => {
    const client = getBinanceClient()
    const capabilities = await client.validateApiKey()

    expect(capabilities).toHaveProperty("canRead")
    expect(capabilities).toHaveProperty("canWithdraw")
  })
})
