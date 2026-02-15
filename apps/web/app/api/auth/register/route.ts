import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api/response"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字符"),
  email: z.string().email("無效的電郵地址"),
  password: z.string().min(8, "密碼至少需要 8 個字符"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(
        result.error.issues[0]?.message || "無效輸入",
        400
      )
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return errorResponse("電郵已被註冊", 409)
    }

    // Note: Password validation is done above, but not stored in database
    // Authentication is handled by NextAuth.js with Keycloak/credentials providers
    // The User model in Prisma doesn't have a password field for security reasons
    // In a full production setup, this endpoint would integrate with Keycloak to create the user there
    // For now, we create a local user record that can authenticate via Keycloak
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: "CLIENT",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return successResponse(
      {
        user,
        message: "註冊成功，請使用 Keycloak 或 OAuth 提供者登入。",
      },
      201  // HTTP 201 Created
    )
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))
    return errorResponse(
      error instanceof Error ? error.message : "註冊失敗",
      500
    )
  }
}
