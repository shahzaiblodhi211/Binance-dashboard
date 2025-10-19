import { validateWithdrawActionKey, validateDashboardPassword, sanitizeErrorMessage, maskApiKey } from "@/lib/security"

describe("Security Utilities", () => {
  describe("validateWithdrawActionKey", () => {
    it("should return true for correct key", () => {
      process.env.WITHDRAW_ACTION_KEY = "test-secret-key"
      expect(validateWithdrawActionKey("test-secret-key")).toBe(true)
    })

    it("should return false for incorrect key", () => {
      process.env.WITHDRAW_ACTION_KEY = "test-secret-key"
      expect(validateWithdrawActionKey("wrong-key")).toBe(false)
    })

    it("should return false when key is not set", () => {
      delete process.env.WITHDRAW_ACTION_KEY
      expect(validateWithdrawActionKey("any-key")).toBe(false)
    })
  })

  describe("validateDashboardPassword", () => {
    it("should return true for correct password", () => {
      process.env.DASHBOARD_PASSWORD = "secure-password"
      expect(validateDashboardPassword("secure-password")).toBe(true)
    })

    it("should return false for incorrect password", () => {
      process.env.DASHBOARD_PASSWORD = "secure-password"
      expect(validateDashboardPassword("wrong-password")).toBe(false)
    })

    it("should return true when no password is set", () => {
      delete process.env.DASHBOARD_PASSWORD
      expect(validateDashboardPassword("any-password")).toBe(true)
    })
  })

  describe("sanitizeErrorMessage", () => {
    it("should mask API-key errors", () => {
      const error = new Error("Invalid API-key format")
      expect(sanitizeErrorMessage(error)).toContain("Authentication failed")
    })

    it("should mask secret errors", () => {
      const error = new Error("Invalid secret provided")
      expect(sanitizeErrorMessage(error)).toContain("Authentication error")
    })

    it("should return original message for safe errors", () => {
      const error = new Error("Network timeout")
      expect(sanitizeErrorMessage(error)).toBe("Network timeout")
    })

    it("should handle non-Error objects", () => {
      expect(sanitizeErrorMessage("string error")).toBe("An unknown error occurred")
    })
  })

  describe("maskApiKey", () => {
    it("should mask API key correctly", () => {
      const key = "abcdefghijklmnopqrst"
      const masked = maskApiKey(key)
      expect(masked).toBe("abcd****mnop")
    })

    it("should handle short keys", () => {
      const key = "short"
      expect(maskApiKey(key)).toBe("****")
    })
  })
})
