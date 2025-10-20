export function validateWithdrawActionKey(providedKey: string | undefined): boolean {
  const expectedKey = process.env.WITHDRAW_ACTION_KEY
  if (!expectedKey) {
    console.warn("[Security] WITHDRAW_ACTION_KEY not configured")
    return false
  }
  return providedKey === expectedKey
}

export function validateDashboardPassword(
  providedPassword: string | undefined
): { valid: boolean; route?: string; role?: string } {
  const mainPassword = process.env.DASHBOARD_PASSWORD
  const teamPassword = process.env.TEAM_DASHBOARD_PASSWORD

  if (!mainPassword && !teamPassword) {
    return { valid: true, route: "/dashboard", role: "admin" }
  }

  if (providedPassword === mainPassword) {
    return { valid: true, route: "/dashboard", role: "admin" }
  }

  if (providedPassword === teamPassword) {
    return { valid: true, route: "/team-dashboard", role: "team" }
  }

  return { valid: false }
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
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
