export function validateWithdrawActionKey(providedKey: string | undefined): boolean {
  const expectedKey = process.env.WITHDRAW_ACTION_KEY
  if (!expectedKey) {
    console.warn("[Security] WITHDRAW_ACTION_KEY not configured")
    return false
  }
  return providedKey === expectedKey
}

export function validateDashboardPassword(providedPassword: string | undefined): boolean {
  const expectedPassword = process.env.DASHBOARD_PASSWORD
  if (!expectedPassword) {
    return true // No password set, allow access
  }
  return providedPassword === expectedPassword
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Never expose API secrets in error messages
    const message = error.message
    if (message.includes("API-key")) {
      return "Authentication failed. Please check your API credentials."
    }
    if (message.includes("secret")) {
      return "Authentication error. Please verify your configuration."
    }
    return message
  }
  return "An unknown error occurred"
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "****"
  return key.substring(0, 4) + "****" + key.substring(key.length - 4)
}
