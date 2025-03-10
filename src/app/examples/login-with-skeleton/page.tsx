"use client";

import { useState, useEffect } from "react";
import { LoginFormSkeleton } from "@/components/skeletons/FormSkeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginWithSkeletonPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simuler le chargement initial de la page
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 secondes de délai simulé
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simuler l'envoi des données de connexion
    setTimeout(() => {
      // Ici vous feriez normalement un appel API
      console.log("Tentative de connexion avec:", { email, password });
      setIsSubmitting(false);
      alert("Connexion simulée réussie!");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {loading ? (
          // Afficher le squelette pendant le chargement
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <div className="py-6">
                <LoginFormSkeleton />
              </div>
            </CardHeader>
          </Card>
        ) : (
          // Afficher le formulaire de connexion une fois chargé
          <Card className="shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour vous connecter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="#" className="text-xs text-blue-600 hover:underline">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/" className="text-sm text-blue-600 hover:underline">
                Retour à l&apos;accueil
              </Link>
              <Link href="#" className="text-sm text-blue-600 hover:underline">
                Créer un compte
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 