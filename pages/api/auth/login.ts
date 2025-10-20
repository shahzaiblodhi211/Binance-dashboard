import type { NextApiRequest, NextApiResponse } from "next"
import { validateDashboardPassword } from "@/lib/security"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: "Password required" })
  }

  const result = validateDashboardPassword(password)

  if (!result.valid) {
    return res.status(401).json({ error: "Invalid password" })
  }

  // ✅ Set cookies: auth + dashboard type
  const cookieOptions = "Path=/; HttpOnly; SameSite=Strict; Max-Age=86400"
  const dashboardType = result.route === "/dashboard" ? "main" : "team"

  res.setHeader("Set-Cookie", [
    `auth_token=authenticated; ${cookieOptions}`,
    `dashboard_type=${dashboardType}; ${cookieOptions}`,
  ])

  return res.status(200).json({
    success: true,
    route: result.route, // either /dashboard or /team-dashboard
  })
}
