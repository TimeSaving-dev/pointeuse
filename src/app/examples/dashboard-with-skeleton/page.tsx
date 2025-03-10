"use client";

import { useState, useEffect } from "react";
import { DashboardPageSkeleton } from "@/components/skeletons";

export default function DashboardWithSkeletonPage() {
  const [loading, setLoading] = useState(true);

  // Simuler le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // 2.5 secondes de délai simulé

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Interface du tableau de bord après chargement */}
      <div className="flex justify-between items-center mb-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Carte de statistiques 1 */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Heures Totales</p>
              <p className="text-2xl font-bold">42h</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
        </div>

        {/* Carte de statistiques 2 */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Présences</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="rounded-full bg-green-500/10 p-3 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-check"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>
            </div>
          </div>
        </div>

        {/* Autres cartes de statistiques... */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Pauses</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <div className="rounded-full bg-yellow-500/10 p-3 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coffee"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Moyenne/jour</p>
              <p className="text-2xl font-bold">8.4h</p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-3 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Conteneur des graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Premier graphique */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="font-semibold leading-none tracking-tight">Temps de travail</h3>
            <div className="h-[250px] mt-4 flex items-center justify-center text-muted-foreground">
              [Graphique de temps de travail]
            </div>
          </div>
        </div>

        {/* Second graphique */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="font-semibold leading-none tracking-tight">Répartition des activités</h3>
            <div className="h-[250px] mt-4 flex items-center justify-center text-muted-foreground">
              [Graphique en secteurs des activités]
            </div>
          </div>
        </div>
      </div>

      {/* Tableau d'activités récentes */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold leading-none tracking-tight">Activités récentes</h3>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
              Voir tout
            </button>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Utilisateur</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Heure</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">Jean Dupont</td>
                  <td className="p-4 align-middle">Check-in</td>
                  <td className="p-4 align-middle">09/03/2024</td>
                  <td className="p-4 align-middle">08:45</td>
                  <td className="p-4 align-middle">
                    <div className="flex gap-2">
                      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">Marie Martin</td>
                  <td className="p-4 align-middle">Check-out</td>
                  <td className="p-4 align-middle">09/03/2024</td>
                  <td className="p-4 align-middle">17:30</td>
                  <td className="p-4 align-middle">
                    <div className="flex gap-2">
                      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 