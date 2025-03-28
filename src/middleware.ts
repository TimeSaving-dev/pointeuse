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
    
    console.log("Middleware token détaillé:", {
      token,
      tokenIsAdmin: token?.isAdmin,
      url: req.nextUrl.pathname
    });
    
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
    
    // Vérifier explicitement si l'utilisateur est admin
    // Nous garantissons que c'est toujours un booléen
    const isAdmin = token?.isAdmin === true;
    
    console.log("Middleware variables de décision:", {
      isAuthenticated,
      isAdmin,
      isAdminRoute,
      isDashboardRoute,
      isRootPath
    });

    // Vérifier s'il y a un paramètre de redirection dans l'URL
    const redirectParam = req.nextUrl.searchParams.get("redirect");

    // NOUVELLE CONDITION: Si l'utilisateur est admin et se trouve sur /dashboard-demo, le rediriger vers /admin/dashboard
    if (isAuthenticated && isAdmin && isDashboardRoute) {
      console.log("Admin sur dashboard-demo, redirection vers admin/dashboard");
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Si l'utilisateur est connecté et accède à la racine, rediriger selon son statut d'admin
    if (isAuthenticated && isRootPath) {
      console.log("Redirect depuis racine, isAdmin:", isAdmin);
      
      if (isAdmin) {
        console.log("Redirection vers /admin/dashboard");
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else {
        console.log("Redirection vers /dashboard-demo");
        return NextResponse.redirect(new URL("/dashboard-demo", req.url));
      }
    }

    // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
    if (!isAuthenticated && (isAdminRoute || isDashboardRoute || isConfirmationRoute)) {
      console.log("Redirect non authentifié vers login");
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Si l'utilisateur est connecté et tente d'accéder à une route d'authentification
    if (isAuthenticated && isAuthRoute) {
      console.log("Redirect depuis auth, isAdmin:", isAdmin);
      
      // Si un paramètre de redirection est présent, l'utiliser
      if (redirectParam) {
        console.log("Redirection vers:", redirectParam);
        return NextResponse.redirect(new URL(redirectParam, req.url));
      }
      
      // Sinon, rediriger selon le statut d'admin
      if (isAdmin) {
        console.log("Redirection vers /admin/dashboard");
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else {
        console.log("Redirection vers /dashboard-demo");
        return NextResponse.redirect(new URL("/dashboard-demo", req.url));
      }
    }

    // Bloquer l'accès aux routes admin pour les utilisateurs non-admin
    if (isAuthenticated && isAdminRoute && !isAdmin) {
      console.log("Utilisateur non-admin tente d'accéder à une route admin");
      return NextResponse.redirect(new URL("/dashboard-demo", req.url));
    }

    // Autoriser l'accès à toutes les routes protégées si l'utilisateur est authentifié
    if (isAuthenticated && (isAdminRoute || isDashboardRoute || isConfirmationRoute)) {
      console.log("Accès autorisé à la route protégée");
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