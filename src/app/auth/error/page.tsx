"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Erreur d&apos;authentification</CardTitle>
            <CardDescription>
              Une erreur s&apos;est produite lors de l&apos;authentification
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-red-500 mb-4">
              {error || "Une erreur inconnue s'est produite"}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/login">
              <Button>Retour à la connexion</Button>
            </Link>
          </CardFooter>
          <p className="mt-4 text-center text-gray-600">
            Nous n&apos;avons pas pu vous authentifier. Veuillez réessayer.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ErrorContent />
    </Suspense>
  );
} 