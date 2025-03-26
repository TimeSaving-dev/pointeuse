"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Suspense } from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginSkeleton } from "@/components/skeletons/AuthSkeletons";
import Image from "next/image";

function LoginContent() {
  const searchParams = useSearchParams();
  const pendingParam = searchParams.get("pending");
  const errorParam = searchParams.get("error");
  const redirectParam = searchParams.get("redirect");
  
  const [errorState, setErrorState] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorState(null);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        if (result?.error === "AccountPending") {
          setStatusMessage({
            type: "pending",
            message: "Votre compte est en attente d'approbation par un administrateur."
          });
        } else if (result?.error === "AccountRejected") {
          setStatusMessage({
            type: "rejected",
            message: "Votre demande de compte a été rejetée."
          });
        } else {
          setErrorState("Identifiants invalides");
        }
      } else {
        // Rediriger vers la page spécifiée dans le paramètre redirect ou vers le dashboard approprié
        if (redirectParam) {
          window.location.href = redirectParam;
        } else if (email === "admin@example.com") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/dashboard-demo";
        }
      }
    } catch (error) {
      setErrorState("Une erreur est survenue lors de l'authentification.");
      console.error("Erreur d'authentification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Définir le message de statut initial en fonction des paramètres d'URL
  useEffect(() => {
    if (pendingParam) {
      setStatusMessage({
        type: "pending",
        message: "Votre compte est en attente d'approbation par un administrateur."
      });
    } else if (errorParam === "AccountPending") {
      setStatusMessage({
        type: "pending",
        message: "Votre compte est en attente d'approbation par un administrateur."
      });
    } else if (errorParam === "AccountRejected") {
      setStatusMessage({
        type: "rejected",
        message: "Votre demande de compte a été rejetée."
      });
    }
  }, [pendingParam, errorParam]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Pointeuse
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center gap-2 text-center mb-6">
              <h1 className="text-2xl font-bold">Connexion</h1>
              <p className="text-muted-foreground text-sm text-balance">
                Entrez vos identifiants pour vous connecter
              </p>
            </div>
            
            {statusMessage && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                statusMessage.type === "pending" 
                  ? "bg-yellow-50 text-yellow-800" 
                  : "bg-red-50 text-red-800"
              }`}>
                {statusMessage.message}
              </div>
            )}
            
            {errorState && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {errorState}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="exemple@email.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </div>
              <div className="text-center text-sm">
                Pas encore de compte?{" "}
                <Link href="/auth/register" className="underline underline-offset-4">
                  Créer un compte
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image de fond décorative"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          fill
          priority
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
} 