import { validateWithdrawRequest, estimateWithdrawFee } from "@/lib/validate-withdraw"

describe("Withdraw Validation", () => {
  describe("validateWithdrawRequest", () => {
    it("should validate correct request", () => {
      const request = {
        coin: "BTC",
        network: "BTC",
        address: "1A1z7agoat7sTKfKz87zr57YzxS1L8SyP1",
        amount: 0.1,
      }
      const result = validateWithdrawRequest(request)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should reject missing coin", () => {
      const request = {
        coin: "",
        network: "BTC",
        address: "1A1z7agoat7sTKfKz87zr57YzxS1L8SyP1",
        amount: 0.1,
      }
      const result = validateWithdrawRequest(request)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Coin is required")
    })

    it("should reject invalid amount", () => {
      const request = {
        coin: "BTC",
        network: "BTC",
        address: "1A1z7agoat7sTKfKz87zr57YzxS1L8SyP1",
        amount: -0.1,
      }
      const result = validateWithdrawRequest(request)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Amount must be greater than 0")
    })

    it("should reject short address", () => {
      const request = {
        coin: "BTC",
        network: "BTC",
        address: "short",
        amount: 0.1,
      }
      const result = validateWithdrawRequest(request)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Address length must be between 20 and 200 characters")
    })
  })

  describe("estimateWithdrawFee", () => {
    it("should estimate BTC fee", () => {
      const fee = estimateWithdrawFee("BTC", 1)
      expect(fee).toBe(0.0005)
    })

    it("should estimate ETH fee", () => {
      const fee = estimateWithdrawFee("ETH", 1)
      expect(fee).toBe(0.005)
    })

    it("should use default fee for unknown coin", () => {
      const fee = estimateWithdrawFee("UNKNOWN", 1)
      expect(fee).toBe(0.001)
    })
  })
})
