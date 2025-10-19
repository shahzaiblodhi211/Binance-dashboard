import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter"

describe("Rate Limiter", () => {
  afterEach(() => {
    resetRateLimit("test-user")
  })

  it("should allow first request", () => {
    expect(checkRateLimit("test-user", 1, 1000)).toBe(true)
  })

  it("should block second request within window", () => {
    checkRateLimit("test-user", 1, 1000)
    expect(checkRateLimit("test-user", 1, 1000)).toBe(false)
  })

  it("should allow multiple requests up to limit", () => {
    expect(checkRateLimit("test-user", 3, 1000)).toBe(true)
    expect(checkRateLimit("test-user", 3, 1000)).toBe(true)
    expect(checkRateLimit("test-user", 3, 1000)).toBe(true)
    expect(checkRateLimit("test-user", 3, 1000)).toBe(false)
  })

  it("should track different users separately", () => {
    expect(checkRateLimit("user1", 1, 1000)).toBe(true)
    expect(checkRateLimit("user2", 1, 1000)).toBe(true)
    expect(checkRateLimit("user1", 1, 1000)).toBe(false)
    expect(checkRateLimit("user2", 1, 1000)).toBe(false)
  })
})
