"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExamplesPage() {
  const examples = [
    {
      title: "Gestion des Utilisateurs avec Skeleton",
      description: "Exemple d'un tableau de gestion d'utilisateurs avec états de chargement.",
      href: "/examples/user-management-with-skeleton",
    },
    {
      title: "Page de Connexion avec Skeleton",
      description: "Exemple d'une page de connexion avec squelette pendant le chargement.",
      href: "/examples/login-with-skeleton",
    },
    {
      title: "Tableau de Bord avec Skeleton",
      description: "Démonstration d'un tableau de bord complet avec états de chargement.",
      href: "/examples/dashboard-with-skeleton",
    },
    {
      title: "Squelettes de Tableau",
      description: "Démonstration des différents squelettes de tableau disponibles.",
      href: "#",
    },
    {
      title: "Squelettes de Carte",
      description: "Démonstration des différents squelettes de carte disponibles.",
      href: "#",
    },
    {
      title: "Squelettes de Formulaire",
      description: "Démonstration des différents squelettes de formulaire disponibles.",
      href: "#",
    },
    {
      title: "Squelettes de Profil",
      description: "Démonstration des différents squelettes de profil disponibles.",
      href: "#",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">Exemples de Composants Skeleton</h1>
        <p className="text-lg text-gray-600 mt-2">
          Explorez les différentes implémentations de composants de chargement (skeletons)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examples.map((example, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <CardTitle>{example.title}</CardTitle>
              <CardDescription>{example.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Link href={example.href} className="w-full">
                <Button variant="default" className="w-full">
                  Voir l&apos;exemple
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/">
          <Button variant="outline">Retour à l&apos;accueil</Button>
        </Link>
      </div>
    </div>
  );
} 