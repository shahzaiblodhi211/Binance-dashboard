const withdrawalAttempts: Map<string, number[]> = new Map()

export function checkRateLimit(identifier: string, maxAttempts = 1, windowMs = 60000): boolean {
  const now = Date.now()
  const attempts = withdrawalAttempts.get(identifier) || []

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((time) => now - time < windowMs)

  if (recentAttempts.length >= maxAttempts) {
    return false
  }

  recentAttempts.push(now)
  withdrawalAttempts.set(identifier, recentAttempts)
  return true
}

export function resetRateLimit(identifier: string): void {
  withdrawalAttempts.delete(identifier)
}
