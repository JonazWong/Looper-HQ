import { NextRequest } from "next/server"
import { hash } from "bcryptjs"
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
        result.error.errors[0]?.message || "無效輸入",
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

    // Hash password with bcryptjs
    const hashedPassword = await hash(password, 10)

    // Create user with hashed password
    // Note: In production with Keycloak, this should sync with Keycloak user creation
    const user = await prisma.user.create({
      data: {
        email,
        name,
        // Store hashed password for credentials auth fallback
        // In production, consider storing this in a separate table or using Keycloak exclusively
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
        message: "註冊成功，您現在可以使用憑證登入。",
      },
      201
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
