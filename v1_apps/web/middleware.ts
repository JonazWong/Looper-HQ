import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // 舊路徑 → 新路徑對照（按實際情況調整）
  if (url.pathname === "/zh/landing") {
    url.pathname = "/zh"; // 或你真正的中文首頁
    return NextResponse.redirect(url, 308);
  }

  if (url.pathname === "/zh/login") {
    url.pathname = "/login"; // 或你真正的登入路徑
    return NextResponse.redirect(url, 308);
  }

  if (url.pathname === "/en") {
    url.pathname = "/"; // 或真正的英文首頁
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/zh/landing",
    "/zh/login",
    "/en",
  ],
};