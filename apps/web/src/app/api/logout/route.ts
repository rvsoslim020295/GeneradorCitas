import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  const res = NextResponse.redirect(loginUrl);

  // Borrar cookies server-side — funciona en local y producción
  res.cookies.set("gm_token", "", { maxAge: 0, path: "/" });
  res.cookies.set("gm_admin_token", "", { maxAge: 0, path: "/" });

  return res;
}
