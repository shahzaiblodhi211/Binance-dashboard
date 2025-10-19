"use server"

import { cookies } from "next/headers"
import type { WithdrawRequest } from "@/lib/types"

export async function initiateWithdrawal(formData: WithdrawRequest) {
  // Check authentication
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("dashboard_auth")

  if (!authCookie || authCookie.value !== "authenticated") {
    return {
      success: false,
      error: "Unauthorized",
    }
  }

  // Validate input
  if (!formData.coin || !formData.network || !formData.address || formData.amount <= 0) {
    return {
      success: false,
      error: "Invalid withdrawal request",
    }
  }

  try {
    // Make the API call with the action key from server-side env
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/account/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-ACTION-KEY": process.env.WITHDRAW_ACTION_KEY || "",
        Cookie: `dashboard_auth=${authCookie.value}`,
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        id: data.id,
      }
    } else {
      return {
        success: false,
        error: data.error || "Withdrawal failed",
      }
    }
  } catch (error) {
    console.error("[Server Action] Withdrawal error:", error)
    return {
      success: false,
      error: "An error occurred. Please try again.",
    }
  }
}
