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

  if (!validateDashboardPassword(password)) {
    return res.status(401).json({ error: "Invalid password" })
  }

  // Set authentication cookie
  res.setHeader("Set-Cookie", `auth_token=authenticated; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`)

  return res.status(200).json({ success: true })
}
