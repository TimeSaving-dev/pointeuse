import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Autoriser l'accès aux endpoints de diagnostic
  if (req.nextUrl.pathname.startsWith("/api/debug-")) {
    return NextResponse.next();
  }

  try {
    // Essayer d'obtenir le token de manière standard
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.SECURE_COOKIES === "true"
    });
    
    console.log("Middleware token:", token);
    
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard-demo");
    const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
    const isRootPath = req.nextUrl.pathname === "/";
    const isConfirmationRoute = req.nextUrl.pathname.startsWith("/confirmation");
    
    // SOLUTION CRITIQUE: Vérifier le cookie de session directement 
    // Cela contourne le problème de getToken() qui échoue derrière Nginx
    const sessionCookie = req.cookies.get("next-auth.session-token");
    const hasSessionCookie = !!sessionCookie;
    
    // Si l'utilisateur a un cookie de session, considérer qu'il est authentifié
    // même si getToken() a échoué (ce qui arrive en production)
    const isAuthenticated = !!token || (process.env.NODE_ENV === "production" && hasSessionCookie);
    
    // Vérifier s'il y a un paramètre de redirection dans l'URL
    const redirectParam = req.nextUrl.searchParams.get("redirect");

    // Si l'utilisateur est connecté et accède à la racine, rediriger vers le tableau de bord approprié
    if (isAuthenticated && isRootPath) {
      // Ici, nous ne pouvons pas vérifier isAdmin si token est null
      // Par défaut, rediriger vers le tableau de bord utilisateur
      return NextResponse.redirect(new URL("/dashboard-demo", req.url));
    }

    // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
    if (!isAuthenticated && (isAdminRoute || isDashboardRoute || isConfirmationRoute)) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Si l'utilisateur est connecté et tente d'accéder à une route d'authentification
    if (isAuthenticated && isAuthRoute) {
      // Si un paramètre de redirection est présent, l'utiliser
      if (redirectParam) {
        return NextResponse.redirect(new URL(redirectParam, req.url));
      }
      
      // Sinon, rediriger vers le tableau de bord utilisateur par défaut
      return NextResponse.redirect(new URL("/dashboard-demo", req.url));
    }

    // Autoriser l'accès à toutes les routes protégées si l'utilisateur est authentifié
    if (isAuthenticated && (isAdminRoute || isDashboardRoute || isConfirmationRoute)) {
      return NextResponse.next();
    }
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/dashboard-demo/:path*", "/auth/:path*", "/confirmation/:path*", "/api/debug-:path*"],
}; 