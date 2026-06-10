import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/registro",
  "/recuperar-contrasena",
  "/resetear-contrasena",
  "/verificar-correo",
  "/verificar-email",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Las rutas /admin y /api tienen su propia lógica — no interferir
  if (pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const token = req.cookies.get("gm_token")?.value;
  const adminToken = req.cookies.get("gm_admin_token")?.value;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Super admin autenticado intenta acceder a una ruta pública → panel admin
  if (adminToken && isPublic) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Usuario autenticado intenta acceder a una ruta pública → dashboard
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Usuario no autenticado intenta acceder a una ruta protegida → login
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
