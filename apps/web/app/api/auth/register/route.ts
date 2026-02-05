import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api/response"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(
        result.error.errors[0]?.message || "Invalid input",
        400
      )
    }

    const { name, email, password } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return errorResponse("User with this email already exists", 409)
    }

    // For now, create a local user account
    // In production, this should integrate with Keycloak user creation
    // Note: Password is not stored in DB as authentication is handled by NextAuth
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
        message: "Account created successfully. You can now sign in with your credentials.",
      },
      201
    )
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create account",
      500
    )
  }
}
