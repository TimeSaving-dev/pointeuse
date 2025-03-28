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
import { getTestData, shouldUseTestData } from "./testData";

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<{ id: string; message: string; createdAt: string }[]>([]);
  const [isResettingNotifications, setIsResettingNotifications] = useState(false);
  // État pour la période sélectionnée
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("day");
  // État pour le drill-down
  const [focusedPeriod, setFocusedPeriod] = useState<{type: "week" | "month" | "year", value: string} | null>(null);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  
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
        
        // Vérifier si on doit utiliser les données de test
        if (shouldUseTestData()) {
          console.log("Utilisation des données de test pour le tableau de bord");
          const testData = getTestData();
          setDashboardData(testData);
          setLoading(false);
          return;
        }
        
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
    // Réinitialiser le focus lors du changement de période
    setFocusedPeriod(null);
    // Réinitialiser la pagination
    setCurrentPage(1);
  };

  // Fonction pour le drill-down sur une période
  const handleDrillDown = (item: any) => {
    if (!item.isAggregated) return;
    
    // Si nous sommes déjà en vue journalière, ne rien faire
    if (selectedPeriod === "day") return;
    
    const periodType = selectedPeriod;
    const periodValue = item.id.split('-')[1]; // Format userId-periodValue
    
    setFocusedPeriod({ type: periodType as any, value: periodValue });
    // Réinitialiser la pagination
    setCurrentPage(1);
  };

  // Fonction pour revenir au niveau supérieur
  const handleDrillUp = () => {
    setFocusedPeriod(null);
    // Réinitialiser la pagination
    setCurrentPage(1);
  };

  // Fonction pour filtrer les données selon le focus
  const getFilteredActivities = () => {
    const aggregatedData = getAggregatedActivities();
    
    // Si aucun focus, retourner toutes les données
    if (!focusedPeriod) return aggregatedData;
    
    // Sinon filtrer selon le focus
    if (focusedPeriod.type === "week") {
      // Pour un focus sur une semaine, afficher les journées de cette semaine
      return dashboardData.recentActivities.filter((item: any) => {
        if (!item.checkInTimestamp) return false;
        
        const date = new Date(item.checkInTimestamp);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
        const formattedWeekStart = format(startOfWeek, "yyyy-MM-dd");
        
        return formattedWeekStart === focusedPeriod.value;
      });
    } else if (focusedPeriod.type === "month") {
      // Pour un focus sur un mois, afficher les semaines ou journées de ce mois
      return selectedPeriod === "week" 
        ? aggregatedData.filter((item: any) => {
            const [yearMonth] = focusedPeriod.value.split('-');
            return item.id.includes(yearMonth);
          })
        : dashboardData.recentActivities.filter((item: any) => {
            if (!item.checkInTimestamp) return false;
            const formattedMonth = format(new Date(item.checkInTimestamp), "yyyy-MM");
            return formattedMonth === focusedPeriod.value;
          });
    } else if (focusedPeriod.type === "year") {
      // Pour un focus sur une année, afficher les mois ou semaines de cette année
      return selectedPeriod === "month" 
        ? aggregatedData.filter((item: any) => {
            return item.id.includes(focusedPeriod.value);
          })
        : selectedPeriod === "week"
          ? aggregatedData.filter((item: any) => {
              const weekDate = new Date(item.periodStartDate);
              return weekDate.getFullYear().toString() === focusedPeriod.value;
            })
          : dashboardData.recentActivities.filter((item: any) => {
              if (!item.checkInTimestamp) return false;
              const year = new Date(item.checkInTimestamp).getFullYear().toString();
              return year === focusedPeriod.value;
            });
    }
    
    return aggregatedData;
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

  // Fonction pour effectuer un drill-down automatique
  const autoDrillDown = (periodType: "year" | "month" | "week") => {
    if (periodType === "year") {
      // Passer de l'année aux mois
      setSelectedPeriod("month");
      if (focusedPeriod?.value) {
        setFocusedPeriod({ type: "year", value: focusedPeriod.value });
      }
    } else if (periodType === "month") {
      // Passer du mois aux semaines
      setSelectedPeriod("week");
      if (focusedPeriod?.value) {
        setFocusedPeriod({ type: "month", value: focusedPeriod.value });
      }
    } else if (periodType === "week") {
      // Passer de la semaine aux jours
      setSelectedPeriod("day");
      if (focusedPeriod?.value) {
        setFocusedPeriod({ type: "week", value: focusedPeriod.value });
      }
    }
  };

  // Fonction pour calculer le nombre total de pages
  const calculateTotalPages = (dataLength: number, itemsPerPage: number) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  // Fonction pour changer de page
  const handlePageChange = (newPage: number) => {
    // Vérifier que la nouvelle page est valide
    if (newPage < 1 || newPage > totalPages) return;
    
    // Activer l'indicateur de chargement
    setPageLoading(true);
    
    // Utiliser setTimeout pour simuler un court délai et montrer l'indicateur de chargement
    setTimeout(() => {
      setCurrentPage(newPage);
      // Réinitialiser à la position de défilement en haut
      window.scrollTo(0, 0);
      setPageLoading(false);
    }, 300);
  };

  // Fonction pour changer le nombre d'éléments par page
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    // Activer l'indicateur de chargement
    setPageLoading(true);
    
    setTimeout(() => {
      setItemsPerPage(newItemsPerPage);
      
      // Recalculer la page courante pour éviter des pages vides
      const newTotalPages = calculateTotalPages(getFilteredActivities().length, newItemsPerPage);
      const newCurrentPage = Math.min(currentPage, newTotalPages);
      
      setCurrentPage(newCurrentPage);
      setPageLoading(false);
    }, 300);
  };

  // Fonction pour obtenir la tranche de données à afficher selon la pagination
  const getPaginatedData = () => {
    const filteredData = getFilteredActivities();
    
    // Calculer le nombre total de pages
    const newTotalPages = calculateTotalPages(filteredData.length, itemsPerPage);
    if (newTotalPages !== totalPages) {
      setTotalPages(newTotalPages);
    }
    
    // Si la page courante dépasse le nombre total de pages, revenir à la dernière page
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
      return [];
    }
    
    // Calculer les indices de début et de fin pour la tranche
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    return filteredData.slice(startIndex, endIndex);
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = () => {
    const data = getFilteredActivities();
    if (!data.length) return;
    
    // Définir les en-têtes selon la période
    let headers = ["Utilisateur"];
    
    if (selectedPeriod === "day") {
      headers = [...headers, "Date d'arrivée", "Heure d'arrivée", "Date de sortie", "Heure de sortie", "Pauses", "Temps moyen/pause", "Heures travaillées"];
    } else {
      // Pour les vues agrégées
      headers = [...headers, "Période", "Première arrivée", "Dernier départ", "Nombre de pauses", "Temps moyen/pause", "Total heures travaillées"];
    }
    
    // Transformer les données
    const csvData = data.map((item: any) => {
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
                {/* Bandeau d'indication de la période active */}
                <div className={`mb-4 px-4 py-2 rounded-md text-sm ${
                  selectedPeriod === "day" ? "bg-blue-50 text-blue-700 border border-blue-200" : 
                  selectedPeriod === "week" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                  selectedPeriod === "month" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-green-50 text-green-700 border border-green-200"
                }`}>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span className="font-medium">
                      {selectedPeriod === "day" && "Vue journalière - Chaque ligne représente un jour de travail individuel"}
                      {selectedPeriod === "week" && "Vue hebdomadaire - Données agrégées par semaine et par utilisateur"}
                      {selectedPeriod === "month" && "Vue mensuelle - Données agrégées par mois et par utilisateur"}
                      {selectedPeriod === "year" && "Vue annuelle - Données agrégées par année et par utilisateur"}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Période :</span>
                    <div className="inline-flex rounded-md border bg-muted p-1 text-muted-foreground">
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "day" ? "bg-blue-100 text-blue-800 border border-blue-300" : ""}`}
                        onClick={() => handlePeriodChange("day")}
                        title="Afficher les données par jour - Chaque ligne représente une journée de travail"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                          <circle cx="12" cy="16" r="2" />
                        </svg>
                        Jour
                      </button>
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "week" ? "bg-purple-100 text-purple-800 border border-purple-300" : ""}`}
                        onClick={() => handlePeriodChange("week")}
                        title="Afficher les données par semaine - Les heures travaillées sont cumulées par semaine"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                          <line x1="8" x2="16" y1="14" y2="14" />
                          <line x1="8" x2="16" y1="18" y2="18" />
                        </svg>
                        Semaine
                      </button>
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "month" ? "bg-amber-100 text-amber-800 border border-amber-300" : ""}`}
                        onClick={() => handlePeriodChange("month")}
                        title="Afficher les données par mois - Les heures travaillées sont cumulées par mois"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        Mois
                      </button>
                      <button 
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === "year" ? "bg-green-100 text-green-800 border border-green-300" : ""}`}
                        onClick={() => handlePeriodChange("year")}
                        title="Afficher les données par année - Les heures travaillées sont cumulées par année"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M8 2v4" />
                          <path d="M16 2v4" />
                          <path d="M2 10h20" />
                        </svg>
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
                      {getPaginatedData().length} enregistrement(s)
                    </div>
                    <button 
                      onClick={exportToCSV}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      title="Exporter les données filtrées actuelles au format CSV"
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

                {/* Barre de navigation de drill-down */}
                {focusedPeriod && (
                  <div className="flex items-center mb-4 p-2 bg-slate-50 border rounded-md">
                    <button onClick={handleDrillUp} className="mr-2 text-sm flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="m9 14 6-6-6-6"></path>
                      </svg>
                      Retour à la vue complète
                    </button>
                    <span className="text-sm text-slate-500 mx-2">|</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">Vous consultez :</span>
                      <span className={`ml-2 px-2 py-1 text-sm rounded-md ${
                        focusedPeriod.type === "week" ? "bg-purple-100 text-purple-800" :
                        focusedPeriod.type === "month" ? "bg-amber-100 text-amber-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {focusedPeriod.type === "week" && `Semaine du ${format(new Date(focusedPeriod.value), "dd/MM/yyyy", { locale: fr })}`}
                        {focusedPeriod.type === "month" && `Mois de ${format(new Date(focusedPeriod.value + "-01"), "MMMM yyyy", { locale: fr })}`}
                        {focusedPeriod.type === "year" && `Année ${focusedPeriod.value}`}
                      </span>
                    </div>
                    
                    {/* Boutons de navigation entre niveaux d'analyse */}
                    <div className="ml-auto flex items-center gap-2">
                      {focusedPeriod.type !== "week" && selectedPeriod !== "day" && (
                        <button
                          onClick={() => autoDrillDown(focusedPeriod.type)}
                          className="text-xs flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                          title="Voir les données avec un niveau de détail plus fin"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                            <path d="M8 11h6" />
                            <path d="M11 8v6" />
                          </svg>
                          Affiner
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-md border overflow-hidden relative">
                  <Table>
                    <TableHeader>
                      <TableRow className={`bg-muted/50 ${
                        selectedPeriod === "day" ? "border-l-4 border-l-blue-400" : 
                        selectedPeriod === "week" ? "border-l-4 border-l-purple-400" :
                        selectedPeriod === "month" ? "border-l-4 border-l-amber-400" :
                        "border-l-4 border-l-green-400"
                      }`}>
                        <TableHead className="font-semibold">Utilisateur</TableHead>
                        {selectedPeriod === "day" ? (
                          <>
                            <TableHead className="font-semibold">Date d'arrivée</TableHead>
                            <TableHead className="font-semibold">Heure d'arrivée</TableHead>
                            <TableHead className="font-semibold">Date de sortie</TableHead>
                            <TableHead className="font-semibold">Heure de sortie</TableHead>
                            <TableHead className="text-right font-semibold" title="Nombre de pauses prises dans la journée">Pauses</TableHead>
                            <TableHead className="text-right font-semibold" title="Durée moyenne de chaque pause">Temps moyen/pause</TableHead>
                            <TableHead className="text-right font-semibold" title="Temps total travaillé dans la journée, hors pauses">Heures travaillées</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead className="font-semibold">
                              Période
                              {selectedPeriod === "week" && 
                                <span className="ml-2 inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">Semaine</span>
                              }
                              {selectedPeriod === "month" && 
                                <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-700/10">Mois</span>
                              }
                              {selectedPeriod === "year" && 
                                <span className="ml-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">Année</span>
                              }
                            </TableHead>
                            <TableHead className="font-semibold" title="Première arrivée enregistrée dans cette période">Première arrivée</TableHead>
                            <TableHead className="font-semibold" title="Dernier départ enregistré dans cette période">Dernier départ</TableHead>
                            <TableHead className="text-right font-semibold" title="Nombre total de pauses durant la période">Nombre de pauses</TableHead>
                            <TableHead className="text-right font-semibold" title="Durée moyenne des pauses sur la période">Temps moyen/pause</TableHead>
                            <TableHead className="text-right font-semibold" title="Temps total travaillé sur la période, hors pauses">
                              Total heures travaillées
                              <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Cumulé</span>
                            </TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginatedData().length > 0 ? (
                        getPaginatedData().map((item: any) => {
                          const isOngoing = !item.checkOutTimestamp;
                          return (
                            <TableRow key={item.id} className={`${isOngoing ? "bg-blue-50" : ""} ${
                              item.isAggregated ? "cursor-pointer hover:bg-gray-50 transition-colors group" : ""
                            }`} onClick={() => item.isAggregated && handleDrillDown(item)}>
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
                                    {item.isAggregated && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {selectedPeriod === "week" && "Total semaine"}
                                        {selectedPeriod === "month" && "Total mois"}
                                        {selectedPeriod === "year" && "Total année"}
                                      </div>
                                    )}
                                    {/* Ajout d'un indicateur de drill-down pour les lignes agrégées */}
                                    {item.isAggregated && (
                                      <div className="hidden group-hover:flex justify-center items-center text-xs text-blue-600 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                          <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                        Voir détails
                                      </div>
                                    )}
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

                {/* Indicateur de chargement de page */}
                {pageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                      <p className="text-sm font-medium text-gray-500">Chargement des données...</p>
                    </div>
                  </div>
                )}

                {/* Contrôles de pagination */}
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  {/* Sélecteur du nombre d'éléments par page */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Afficher</span>
                    <select 
                      className="h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-xs text-muted-foreground">éléments par page</span>
                  </div>
                  
                  {/* Information sur les éléments affichés */}
                  <div className="text-xs text-muted-foreground">
                    Affichage de {getFilteredActivities().length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, getFilteredActivities().length)} sur {getFilteredActivities().length} enregistrements
                  </div>
                  
                  {/* Contrôles de navigation entre les pages */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background p-0 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      title="Première page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="11 17 6 12 11 7"></polyline>
                        <polyline points="18 17 13 12 18 7"></polyline>
                      </svg>
                      <span className="sr-only">Première page</span>
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background p-0 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      title="Page précédente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      <span className="sr-only">Page précédente</span>
                    </button>
                    
                    {/* Affichage des numéros de pages */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logique pour afficher les pages autour de la page courante
                        let pageNumber;
                        if (totalPages <= 5) {
                          // Si moins de 5 pages, afficher toutes les pages
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          // Si on est au début, afficher les 5 premières pages
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // Si on est à la fin, afficher les 5 dernières pages
                          pageNumber = totalPages - 4 + i;
                        } else {
                          // Sinon, afficher 2 pages avant et 2 pages après la page courante
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              pageNumber === currentPage
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            }`}
                            aria-current={pageNumber === currentPage ? "page" : undefined}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background p-0 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      title="Page suivante"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                      <span className="sr-only">Page suivante</span>
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background p-0 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      title="Dernière page"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="13 17 18 12 13 7"></polyline>
                        <polyline points="6 17 11 12 6 7"></polyline>
                      </svg>
                      <span className="sr-only">Dernière page</span>
                    </button>
                  </div>
                </div>

                {/* Légende explicative */}
                <div className="mt-4 text-xs text-muted-foreground border-t pt-3">
                  <h4 className="font-medium mb-2">Légende des périodes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span><strong>Vue journalière:</strong> Affiche les heures travaillées par jour individuel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span><strong>Vue hebdomadaire:</strong> Cumule les heures travaillées par semaine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <span><strong>Vue mensuelle:</strong> Cumule les heures travaillées par mois</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span><strong>Vue annuelle:</strong> Cumule les heures travaillées par année</span>
                    </div>
                  </div>
                  
                  {selectedPeriod !== "day" && (
                    <div className="mt-2 flex items-start gap-2 border-t pt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mt-0.5">
                        <path d="M12 8h.01"></path>
                        <path d="M12 12h.01"></path>
                        <path d="M12 16h.01"></path>
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      </svg>
                      <div>
                        <p className="font-medium text-amber-700">Remarque sur les données agrégées:</p>
                        <p>En vue {selectedPeriod === "week" ? "hebdomadaire" : selectedPeriod === "month" ? "mensuelle" : "annuelle"}, 
                        les heures travaillées représentent le cumul sur la période. Le temps moyen par pause est calculé sur l'ensemble des pauses de la période.</p>
                        {selectedPeriod === "week" && (
                          <p className="mt-1">Une semaine commence le lundi et se termine le dimanche.</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Information sur le drill-down */}
                  <div className="mt-2 flex items-start gap-2 border-t pt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mt-0.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div>
                      <p className="font-medium text-blue-700">Exploration des données (drill-down):</p>
                      <p>Cliquez sur une ligne {selectedPeriod !== "day" ? "pour explorer les détails de cette période" : "agrégée pour voir ses détails"}. 
                      Un indicateur "Voir détails" apparaît au survol des lignes cliquables.</p>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span>Année</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Mois</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Semaine</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                        <div>
                          <span>Jour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPeriod === "day" && (
                    <div className="mt-2 flex items-start gap-2 border-t pt-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mt-0.5">
                        <path d="M12 8h.01"></path>
                        <path d="M12 12h.01"></path>
                        <path d="M12 16h.01"></path>
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      </svg>
                      <div>
                        <p className="font-medium text-blue-700">Remarque sur les journées en cours:</p>
                        <p>Les journées sans heure de sortie sont marquées "En cours" et les heures travaillées sont calculées jusqu'à présent.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 