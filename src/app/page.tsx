"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Une fois que le statut de session est déterminé, on arrête le chargement
    if (status !== "loading") {
      setIsLoading(false);
    }

    // Redirection automatique si l'utilisateur est déjà connecté
    if (status === "authenticated") {
      if (session?.user?.isAdmin) {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/dashboard-demo";
      }
    }
  }, [status, session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-sm font-medium text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">QR Code Pointeuse</CardTitle>
            <CardDescription>
              Application de gestion des présences par QR code
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/auth/login" className="w-full">
              <Button className="w-full" size="lg">
                Se connecter
              </Button>
            </Link>
            <Link href="/auth/register" className="w-full">
              <Button variant="outline" className="w-full" size="lg">
                Créer un compte
              </Button>
            </Link>
          </CardContent>
          <CardFooter className="text-center text-xs text-gray-500">
            <p>
              Bienvenue sur l&apos;application QR Code Pointeuse. Connectez-vous ou créez un compte pour commencer.
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center">
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">
            Accès administrateur
          </Link>
        </div>
      </div>
    </div>
  );
}
