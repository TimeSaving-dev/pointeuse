import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Autoriser l'accès aux endpoints de diagnostic
  if (req.nextUrl.pathname.startsWith("/api/debug-")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("Middleware token:", token); // Ajout d'un log pour déboguer
  
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard-demo");
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
  const isRootPath = req.nextUrl.pathname === "/";
  const isConfirmationRoute = req.nextUrl.pathname.startsWith("/confirmation");

  // Vérifier s'il y a un paramètre de redirection dans l'URL
  const redirectParam = req.nextUrl.searchParams.get("redirect");

  // Si l'utilisateur est connecté et accède à la racine, rediriger vers le tableau de bord approprié
  if (token && isRootPath) {
    if (token.isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard-demo", req.url));
    }
  }

  // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
  if (!token && (isAdminRoute || isDashboardRoute)) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Si l'utilisateur est connecté et tente d'accéder à une route d'authentification
  if (token && isAuthRoute) {
    // Si un paramètre de redirection est présent, l'utiliser
    if (redirectParam) {
      return NextResponse.redirect(new URL(redirectParam, req.url));
    }
    
    // Sinon, rediriger vers le tableau de bord approprié (admin ou utilisateur)
    if (token.isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard-demo", req.url));
    }
  }

  // Si un utilisateur non-admin tente d'accéder à une route admin
  if (token && isAdminRoute && !token.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard-demo", req.url));
  }

  // Si un admin tente d'accéder à une route utilisateur
  if (token && token.isAdmin && isDashboardRoute) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/dashboard-demo/:path*", "/auth/:path*", "/confirmation/:path*", "/api/debug-:path*"],
}; 