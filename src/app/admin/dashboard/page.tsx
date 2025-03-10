"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { WorkTimeChart } from "@/components/dashboard/WorkTimeChart";
import { RecentActivitiesTable } from "@/components/dashboard/RecentActivitiesTable";
import { UserManagement } from "@/components/dashboard/UserManagement";
import { QRCodeDisplay } from "@/components/dashboard/QRCodeDisplay";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<{ id: string; message: string; createdAt: string }[]>([]);
  const [isResettingNotifications, setIsResettingNotifications] = useState(false);
  
  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    try {
      console.log("Récupération des notifications...");
      const response = await fetch("/api/admin/notifications");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des notifications");
      }
      const data = await response.json();
      console.log("Notifications reçues:", data);
      setNotificationsList(data.notifications || []);
      setNotificationsCount(data.notifications?.length || 0);
    } catch (error: unknown) {
      console.error("Erreur:", error instanceof Error ? error.message : "Une erreur inconnue s'est produite");
    }
  };
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/dashboard");
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error: unknown) {
        console.error("Erreur:", error instanceof Error ? error.message : "Une erreur inconnue s'est produite");
        setError("Impossible de charger les données du tableau de bord");
      } finally {
        setLoading(false);
      }
    }

    // Fonction de gestionnaire d'événement pour le rafraîchissement des notifications
    const handleRefreshNotifications = () => {
      console.log("Événement de rafraîchissement des notifications détecté");
      fetchNotifications();
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener('refreshNotifications', handleRefreshNotifications);

    fetchDashboardData();
    fetchNotifications();

    // Rafraîchir les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    // Nettoyer les écouteurs d'événements et intervalles
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
    };
  }, []);

  // Fonction pour réinitialiser les notifications bloquées
  const resetNotificationsCounter = async () => {
    try {
      setIsResettingNotifications(true);
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reset_counter"
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la réinitialisation des notifications");
      }
      
      const data = await response.json();
      console.log("Résultat de la réinitialisation:", data);
      
      // Rafraîchir les notifications
      fetchNotifications();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsResettingNotifications(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-sm font-medium text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <div className="flex items-center gap-4">
          {notificationsCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {notificationsCount} notification{notificationsCount > 1 ? 's' : ''} non lue{notificationsCount > 1 ? 's' : ''}
              </div>
              {notificationsCount > 0 && (
                <button 
                  onClick={resetNotificationsCounter}
                  disabled={isResettingNotifications}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded"
                  title="Réinitialiser le compteur de notifications"
                >
                  {isResettingNotifications ? "..." : "Réinitialiser"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          <TabsTrigger value="activity">Activités récentes</TabsTrigger>
          <TabsTrigger value="users">
            Utilisateurs
            {notificationsCount > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center text-xs">
                {notificationsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Nombre d&apos;utilisateurs"
              value={dashboardData?.users || 0}
            />
            <StatCard
              title="Nombre d&apos;arrivées"
              value={dashboardData?.checkIns || 0}
            />
            <StatCard
              title="Nombre de pauses"
              value={dashboardData?.pauses || 0}
            />
            <StatCard
              title="Nombre de départs"
              value={dashboardData?.checkOuts || 0}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <ActivityChart
              title="Activité hebdomadaire"
              data={dashboardData?.weeklyActivity || []}
              className="col-span-4"
            />
            <WorkTimeChart
              title="Temps de travail moyen"
              data={dashboardData?.workTimeData || []}
              className="col-span-3"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <WorkTimeChart
              title="Temps de travail moyen"
              data={dashboardData?.workTimeData || []}
              className="col-span-3"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ActivityChart
              title="Activité hebdomadaire"
              data={dashboardData?.weeklyActivity || []}
              className="col-span-3"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RecentActivitiesTable
              title="Arrivées récentes"
              type="checkins"
              data={dashboardData?.recentCheckIns || []}
              className="col-span-3"
            />
            <RecentActivitiesTable
              title="Pauses récentes"
              type="pauses"
              data={dashboardData?.recentPauses || []}
              className="col-span-3"
            />
            <RecentActivitiesTable
              title="Départs récents"
              type="checkouts"
              data={dashboardData?.recentCheckOuts || []}
              className="col-span-3"
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Gestion des utilisateurs</h3>
              <Link href="/admin/import-users" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Importer des utilisateurs (CSV)
              </Link>
            </div>
            <UserManagement />
          </div>
        </TabsContent>

        <TabsContent value="qrcodes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <QRCodeDisplay />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 