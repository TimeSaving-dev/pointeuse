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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<{ id: string; message: string; createdAt: string }[]>([]);
  const [isResettingNotifications, setIsResettingNotifications] = useState(false);
  // État pour la période sélectionnée
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("day");
  
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

  // Fonction pour changer la période sélectionnée
  const handlePeriodChange = (period: "day" | "week" | "month" | "year") => {
    setSelectedPeriod(period);
  };

  // Fonction pour agréger les données selon la période sélectionnée
  const getAggregatedActivities = () => {
    if (!dashboardData?.recentActivities?.length) return [];

    // Si on affiche par jour, on retourne les données telles quelles
    if (selectedPeriod === "day") {
      return dashboardData.recentActivities;
    }

    // Pour les autres périodes, on agrège les données
    const activities = [...dashboardData.recentActivities];
    
    // Fonction pour obtenir la clé de regroupement selon la période
    const getGroupKey = (timestamp: string, userId: string) => {
      const date = new Date(timestamp);
      
      switch (selectedPeriod) {
        case "week":
          // Début de la semaine (lundi)
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
          return `${userId}-${format(startOfWeek, "yyyy-MM-dd")}`;
        
        case "month":
          // Premier jour du mois
          return `${userId}-${format(date, "yyyy-MM")}`;
        
        case "year":
          // Année
          return `${userId}-${date.getFullYear()}`;
        
        default:
          return `${userId}-${format(date, "yyyy-MM-dd")}`;
      }
    };

    // Regrouper les données par période et par utilisateur
    const groupedData: Record<string, any> = {};
    
    activities.forEach(activity => {
      if (!activity.checkInTimestamp) return;
      
      const userId = activity.userId || activity.id;
      const userName = activity.userName;
      const groupKey = getGroupKey(activity.checkInTimestamp, userId);
      
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          id: groupKey,
          userId,
          userName,
          checkInTimestamps: [],
          checkOutTimestamps: [],
          pauses: [],
          totalWorkTime: 0,
          periodStartDate: new Date(activity.checkInTimestamp),
          periodLabel: getPeriodLabel(activity.checkInTimestamp)
        };
      }
      
      // Ajouter les timestamps d'arrivée et de sortie
      groupedData[groupKey].checkInTimestamps.push(activity.checkInTimestamp);
      if (activity.checkOutTimestamp) {
        groupedData[groupKey].checkOutTimestamps.push(activity.checkOutTimestamp);
      }
      
      // Ajouter les pauses
      if (activity.pauses?.length) {
        groupedData[groupKey].pauses = [...groupedData[groupKey].pauses, ...activity.pauses];
      }
      
      // Ajouter le temps de travail
      groupedData[groupKey].totalWorkTime += activity.totalWorkTime || 0;
    });
    
    // Convertir l'objet en tableau et calculer les agrégations
    return Object.values(groupedData).map((group: any) => {
      // Trier les timestamps
      group.checkInTimestamps.sort();
      group.checkOutTimestamps.sort();
      
      // Prendre le premier check-in et le dernier check-out de la période
      const firstCheckIn = group.checkInTimestamps[0];
      const lastCheckOut = group.checkOutTimestamps.length ? 
        group.checkOutTimestamps[group.checkOutTimestamps.length - 1] : null;
      
      // Calculer le nombre total de pauses
      const pausesCount = group.pauses.length;
      
      // Calculer le temps moyen par pause
      let averagePauseTime = 0;
      if (pausesCount > 0) {
        const totalPauseTime = group.pauses.reduce((total: number, pause: any) => 
          total + (pause.duration || 0), 0);
        averagePauseTime = totalPauseTime / pausesCount;
      }
      
      return {
        ...group,
        checkInTimestamp: firstCheckIn,
        checkOutTimestamp: lastCheckOut,
        pausesCount,
        averagePauseTime,
        isAggregated: true
      };
    });
  };

  // Fonction pour obtenir le libellé de la période selon la date
  const getPeriodLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    
    switch (selectedPeriod) {
      case "week":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${format(startOfWeek, "dd/MM/yyyy", { locale: fr })} - ${format(endOfWeek, "dd/MM/yyyy", { locale: fr })}`;
      
      case "month":
        return format(date, "MMMM yyyy", { locale: fr });
      
      case "year":
        return format(date, "yyyy", { locale: fr });
      
      default:
        return format(date, "dd/MM/yyyy", { locale: fr });
    }
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    const aggregatedData = getAggregatedActivities();
    if (!aggregatedData.length) return;
    
    // Définir les en-têtes selon la période
    let headers = ["Utilisateur"];
    
    if (selectedPeriod === "day") {
      headers = [...headers, "Date d'arrivée", "Heure d'arrivée", "Date de sortie", "Heure de sortie", "Pauses", "Temps moyen/pause", "Heures travaillées"];
    } else {
      // Pour les vues agrégées
      headers = [...headers, "Période", "Première arrivée", "Dernier départ", "Nombre de pauses", "Temps moyen/pause", "Total heures travaillées"];
    }
    
    // Transformer les données
    const csvData = aggregatedData.map((item: any) => {
      if (selectedPeriod === "day") {
        return {
          "Utilisateur": item.userName,
          "Date d'arrivée": item.checkInTimestamp ? format(new Date(item.checkInTimestamp), "dd/MM/yyyy", { locale: fr }) : "-",
          "Heure d'arrivée": item.checkInTimestamp ? format(new Date(item.checkInTimestamp), "HH:mm", { locale: fr }) : "-",
          "Date de sortie": item.checkOutTimestamp ? format(new Date(item.checkOutTimestamp), "dd/MM/yyyy", { locale: fr }) : "En cours",
          "Heure de sortie": item.checkOutTimestamp ? format(new Date(item.checkOutTimestamp), "HH:mm", { locale: fr }) : "En cours",
          "Pauses": item.pauses?.length || 0,
          "Temps moyen/pause": item.pauses?.length > 0 ? format(new Date(item.averagePauseTime || 0), "HH:mm", { locale: fr }) : "--",
          "Heures travaillées": item.totalWorkTime ? format(new Date(item.totalWorkTime), "HH:mm", { locale: fr }) : "--"
        };
      } else {
        return {
          "Utilisateur": item.userName,
          "Période": item.periodLabel,
          "Première arrivée": format(new Date(item.checkInTimestamp), "dd/MM/yyyy HH:mm", { locale: fr }),
          "Dernier départ": item.checkOutTimestamp ? format(new Date(item.checkOutTimestamp), "dd/MM/yyyy HH:mm", { locale: fr }) : "En cours",
          "Nombre de pauses": item.pausesCount,
          "Temps moyen/pause": item.pausesCount > 0 ? format(new Date(item.averagePauseTime), "HH:mm", { locale: fr }) : "--",
          "Total heures travaillées": format(new Date(item.totalWorkTime), "HH:mm", { locale: fr })
        };
      }
    });
    
    // Convertir en CSV
    let csvContent = headers.join(",") + "\n";
    
    csvData.forEach((row: any) => {
      const values = headers.map(header => {
        const value = row[header]?.toString() || "";
        // Échapper les virgules en entourant de guillemets
        return value.includes(",") ? `"${value}"` : value;
      });
      csvContent += values.join(",") + "\n";
    });
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `historique_${selectedPeriod}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <TabsTrigger value="history">Historique</TabsTrigger>
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

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Historique des activités</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {dashboardData?.recentActivities?.length || 0} entrée(s)
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Période :</span>
                    <div className="inline-flex rounded-md border bg-muted p-1 text-muted-foreground">
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "day" ? "bg-background text-foreground shadow-sm" : ""}`}
                        onClick={() => handlePeriodChange("day")}
                        title="Afficher les données par jour"
                      >
                        Jour
                      </button>
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "week" ? "bg-background text-foreground shadow-sm" : ""}`}
                        onClick={() => handlePeriodChange("week")}
                        title="Afficher les données par semaine"
                      >
                        Semaine
                      </button>
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "month" ? "bg-background text-foreground shadow-sm" : ""}`}
                        onClick={() => handlePeriodChange("month")}
                        title="Afficher les données par mois"
                      >
                        Mois
                      </button>
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "year" ? "bg-background text-foreground shadow-sm" : ""}`}
                        onClick={() => handlePeriodChange("year")}
                        title="Afficher les données par année"
                      >
                        Année
                      </button>
                    </div>
                    {selectedPeriod !== "day" && (
                      <div className="text-xs text-muted-foreground ml-2 bg-muted px-2 py-1 rounded-md">
                        {selectedPeriod === "week" && "Données regroupées par semaine"}
                        {selectedPeriod === "month" && "Données regroupées par mois"}
                        {selectedPeriod === "year" && "Données regroupées par année"}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {getAggregatedActivities().length} enregistrement(s)
                    </div>
                    <button 
                      onClick={exportToCSV}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      title="Exporter les données au format CSV"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Exporter CSV
                    </button>
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Utilisateur</TableHead>
                        {selectedPeriod === "day" ? (
                          <>
                            <TableHead className="font-semibold">Date d'arrivée</TableHead>
                            <TableHead className="font-semibold">Heure d'arrivée</TableHead>
                            <TableHead className="font-semibold">Date de sortie</TableHead>
                            <TableHead className="font-semibold">Heure de sortie</TableHead>
                            <TableHead className="text-right font-semibold">Pauses</TableHead>
                            <TableHead className="text-right font-semibold">Temps moyen/pause</TableHead>
                            <TableHead className="text-right font-semibold">Heures travaillées</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead className="font-semibold">Période</TableHead>
                            <TableHead className="font-semibold">Première arrivée</TableHead>
                            <TableHead className="font-semibold">Dernier départ</TableHead>
                            <TableHead className="text-right font-semibold">Nombre de pauses</TableHead>
                            <TableHead className="text-right font-semibold">Temps moyen/pause</TableHead>
                            <TableHead className="text-right font-semibold">Total heures travaillées</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAggregatedActivities().length > 0 ? (
                        getAggregatedActivities().map((item: any) => {
                          const isOngoing = !item.checkOutTimestamp;
                          return (
                            <TableRow key={item.id} className={isOngoing ? "bg-blue-50" : ""}>
                              <TableCell>{item.userName}</TableCell>
                              
                              {selectedPeriod === "day" ? (
                                <>
                                  <TableCell>{item.checkInTimestamp ? format(new Date(item.checkInTimestamp), "dd/MM/yyyy", { locale: fr }) : "-"}</TableCell>
                                  <TableCell>{item.checkInTimestamp ? format(new Date(item.checkInTimestamp), "HH:mm", { locale: fr }) : "-"}</TableCell>
                                  <TableCell>
                                    {item.checkOutTimestamp 
                                      ? format(new Date(item.checkOutTimestamp), "dd/MM/yyyy", { locale: fr }) 
                                      : <span className="text-blue-600 font-medium">En cours</span>}
                                  </TableCell>
                                  <TableCell>
                                    {item.checkOutTimestamp 
                                      ? format(new Date(item.checkOutTimestamp), "HH:mm", { locale: fr }) 
                                      : <span className="text-blue-600 font-medium">En cours</span>}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{item.pauses?.length || 0}</TableCell>
                                  <TableCell className="text-right">
                                    {item.pauses?.length > 0 
                                      ? format(new Date(item.averagePauseTime || 0), "HH:mm", { locale: fr }) 
                                      : <span className="text-gray-500">--</span>}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {item.checkInTimestamp ? (
                                      item.checkOutTimestamp 
                                        ? format(new Date(item.totalWorkTime || 0), "HH:mm", { locale: fr })
                                        : <span className="text-blue-600">
                                            {format(
                                              new Date(
                                                new Date().getTime() - new Date(item.checkInTimestamp).getTime() - (item.totalPauseTime || 0)
                                              ), 
                                              "HH:mm", 
                                              { locale: fr }
                                            )} <small className="text-xs">(provisoire)</small>
                                          </span>
                                    ) : <span className="text-gray-500">--</span>}
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="font-medium">{item.periodLabel}</TableCell>
                                  <TableCell>
                                    {format(new Date(item.checkInTimestamp), "dd/MM/yyyy HH:mm", { locale: fr })}
                                  </TableCell>
                                  <TableCell>
                                    {item.checkOutTimestamp 
                                      ? format(new Date(item.checkOutTimestamp), "dd/MM/yyyy HH:mm", { locale: fr }) 
                                      : <span className="text-blue-600 font-medium">En cours</span>}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{item.pausesCount || 0}</TableCell>
                                  <TableCell className="text-right">
                                    {item.pausesCount > 0 
                                      ? format(new Date(item.averagePauseTime || 0), "HH:mm", { locale: fr }) 
                                      : <span className="text-gray-500">--</span>}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {format(new Date(item.totalWorkTime || 0), "HH:mm", { locale: fr })}
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={selectedPeriod === "day" ? 8 : 7} className="text-center">
                            Aucune donnée d&apos;historique disponible
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 