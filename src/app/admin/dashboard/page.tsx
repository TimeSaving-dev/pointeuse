"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { WorkTimeChart } from "@/components/dashboard/WorkTimeChart";
import { WorkDistributionChart } from "@/components/dashboard/WorkDistributionChart";
import { ArrivalTimeChart } from "@/components/dashboard/ArrivalTimeChart";
import { RecentActivitiesTable } from "@/components/dashboard/RecentActivitiesTable";
import { UserManagement } from "@/components/dashboard/UserManagement";
import { QRCodeDisplay } from "@/components/dashboard/QRCodeDisplay";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getTestData, shouldUseTestData } from "./testData";
import { 
  prepareWorkDistributionData,
  prepareArrivalTimeData,
  prepareBreaksData,
  prepareLocationData
} from "@/utils/chartDataHelpers";
import { BreaksAnalysisChart } from "@/components/dashboard/BreaksAnalysisChart";
import { LocationAnalysisChart } from "@/components/dashboard/LocationAnalysisChart";

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
  
  // État pour le filtre par collaborateur
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
  
  // État pour le menu contextuel de navigation rapide
  const [showContextMenu, setShowContextMenu] = useState<{x: number, y: number, id: string} | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  // État pour les sous-onglets d'analytiques
  const [analyticsCategory, setAnalyticsCategory] = useState<"worktime" | "schedule" | "breaks" | "location">("worktime");

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
    
    // Définir la période à explorer
    setFocusedPeriod({ type: periodType as any, value: periodValue });
    
    // Pour une meilleure expérience utilisateur, basculer automatiquement vers un niveau de détail plus précis
    if (periodType === "year" && !selectedCollaborator) {
      // Si on est sur une année, passer à la vue mensuelle
      setSelectedPeriod("month");
    } else if (periodType === "month" && !selectedCollaborator) {
      // Si on est sur un mois, passer à la vue hebdomadaire
      setSelectedPeriod("week");
    } else if (periodType === "week") {
      // Si on est sur une semaine, passer à la vue journalière
      setSelectedPeriod("day");
    }
    
    // Réinitialiser la pagination
    setCurrentPage(1);
  };

  // Fonction pour revenir au niveau supérieur
  const handleDrillUp = () => {
    // Si nous avons un focus sur une période, le supprimer
    if (focusedPeriod) {
      setFocusedPeriod(null);
      return;
    }
    
    // Sinon, remonter d'un niveau de granularité
    if (selectedPeriod === "day") {
      setSelectedPeriod("week");
    } else if (selectedPeriod === "week") {
      setSelectedPeriod("month");
    } else if (selectedPeriod === "month") {
      setSelectedPeriod("year");
    }
    
    // Réinitialiser la pagination
    setCurrentPage(1);
  };

  // Fonction pour effectuer un drill-down sur un niveau spécifique directement
  const handleDirectDrillDown = (targetPeriod: "day" | "week" | "month" | "year", period?: { type: "week" | "month" | "year", value: string }) => {
    setSelectedPeriod(targetPeriod);
    if (period) {
      setFocusedPeriod(period);
    }
    // Réinitialiser la pagination
    setCurrentPage(1);
  };

  // Fonction pour obtenir la liste unique des collaborateurs
  const getUniqueCollaborators = () => {
    if (!dashboardData?.recentActivities?.length) return [];
    
    // Extraire tous les utilisateurs uniques des activités
    const uniqueUsers = new Map();
    dashboardData.recentActivities.forEach((activity: any) => {
      if (activity.userId && activity.userName) {
        uniqueUsers.set(activity.userId, activity.userName);
      }
    });
    
    // Convertir la Map en tableau d'objets pour l'affichage
    const collaborators = Array.from(uniqueUsers.entries()).map(([id, name]) => ({
      id,
      name
    }));
    
    // Trier par nom d'utilisateur
    return collaborators.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Fonction pour filtrer les données selon le focus
  const getFilteredActivities = () => {
    // Commencer avec les données agrégées selon la période
    const aggregatedData = getAggregatedActivities();
    
    // Appliquer le filtre de collaborateur si sélectionné
    let filteredByCollaborator = aggregatedData;
    if (selectedCollaborator) {
      filteredByCollaborator = aggregatedData.filter((item: any) => 
        item.userId === selectedCollaborator
      );
    }
    
    // Si aucun focus, retourner les données filtrées par collaborateur
    if (!focusedPeriod) return filteredByCollaborator;
    
    // Sinon continuer avec le filtrage par période comme avant
    if (focusedPeriod.type === "week") {
      // Pour un focus sur une semaine, afficher les journées de cette semaine
      return dashboardData.recentActivities
        .filter((item: any) => {
          // Filtre par collaborateur
          if (selectedCollaborator && item.userId !== selectedCollaborator) return false;
          
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
        ? filteredByCollaborator.filter((item: any) => {
            const [yearMonth] = focusedPeriod.value.split('-');
            return item.id.includes(yearMonth);
          })
        : dashboardData.recentActivities.filter((item: any) => {
            // Filtre par collaborateur
            if (selectedCollaborator && item.userId !== selectedCollaborator) return false;
            
            if (!item.checkInTimestamp) return false;
            const formattedMonth = format(new Date(item.checkInTimestamp), "yyyy-MM");
            return formattedMonth === focusedPeriod.value;
          });
    } else if (focusedPeriod.type === "year") {
      // Pour un focus sur une année, afficher les mois ou semaines de cette année
      return selectedPeriod === "month" 
        ? filteredByCollaborator.filter((item: any) => {
            return item.id.includes(focusedPeriod.value);
          })
        : selectedPeriod === "week"
          ? filteredByCollaborator.filter((item: any) => {
              const weekDate = new Date(item.periodStartDate);
              return weekDate.getFullYear().toString() === focusedPeriod.value;
            })
          : dashboardData.recentActivities.filter((item: any) => {
              // Filtre par collaborateur
              if (selectedCollaborator && item.userId !== selectedCollaborator) return false;
              
              if (!item.checkInTimestamp) return false;
              const year = new Date(item.checkInTimestamp).getFullYear().toString();
              return year === focusedPeriod.value;
            });
    }
    
    return filteredByCollaborator;
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
      // Ajouter la colonne Adresse uniquement lorsqu'un collaborateur est sélectionné
      if (selectedCollaborator) {
        headers = [...headers, "Adresse"];
      }
      headers = [...headers, "Date d'arrivée", "Heure d'arrivée", "Date de sortie", "Heure de sortie", "Pauses", "Temps moyen/pause", "Heures travaillées"];
    } else {
      // Pour les vues agrégées
      headers = [...headers, "Période", "Première arrivée", "Dernier départ", "Nombre de pauses", "Temps moyen/pause", "Total heures travaillées"];
    }
    
    // Transformer les données
    const csvData = data.map((item: any) => {
      if (selectedPeriod === "day") {
        const dayData: Record<string, string | number> = {
          "Utilisateur": item.userName,
        };
        
        // Ajouter l'adresse uniquement si un collaborateur est sélectionné
        if (selectedCollaborator) {
          dayData["Adresse"] = item.location || "Adresse non disponible";
        }
        
        // Ajouter les autres champs
        return {
          ...dayData,
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
    
    // Ajuster le nom du fichier pour indiquer quand l'adresse est incluse
    let fileName = `historique_${selectedPeriod}_${format(new Date(), "yyyy-MM-dd")}`;
    if (selectedPeriod === "day" && selectedCollaborator) {
      // Ajouter indication pour l'adresse incluse
      const collaboratorName = getUniqueCollaborators().find(c => c.id === selectedCollaborator)?.name || 'collaborateur';
      fileName = `historique_${selectedPeriod}_${collaboratorName.replace(/\s+/g, '_')}_avec_adresse_${format(new Date(), "yyyy-MM-dd")}`;
    }
    
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour changer le collaborateur sélectionné
  const handleCollaboratorChange = (collaboratorId: string | null) => {
    setSelectedCollaborator(collaboratorId);
    // Réinitialiser la pagination
    setCurrentPage(1);
  };

  // Fonction pour afficher le menu contextuel
  const handleContextMenu = (e: React.MouseEvent, item: any) => {
    if (!item.isAggregated) return;
    
    e.preventDefault(); // Empêcher le menu contextuel par défaut
    const x = e.clientX;
    const y = e.clientY;
    setShowContextMenu({ x, y, id: item.id });
  };

  // Fonction pour masquer le menu contextuel
  const handleHideContextMenu = () => {
    setShowContextMenu(null);
  };

  // Fonction pour changer la catégorie d'analytiques
  const handleAnalyticsCategoryChange = (category: "worktime" | "schedule" | "breaks" | "location") => {
    setAnalyticsCategory(category);
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
          <div className="grid gap-4">
            {/* Navigation des sous-onglets d'analytiques */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Analytiques détaillées</h3>
                </div>
                <div className="inline-flex rounded-md border bg-muted p-1 text-muted-foreground mb-6">
                  <button 
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${analyticsCategory === "worktime" ? "bg-blue-100 text-blue-800 border border-blue-300" : ""}`}
                    onClick={() => handleAnalyticsCategoryChange("worktime")}
                    title="Analyses du temps de travail et productivité"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Temps de travail
                  </button>
                  <button 
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${analyticsCategory === "schedule" ? "bg-purple-100 text-purple-800 border border-purple-300" : ""}`}
                    onClick={() => handleAnalyticsCategoryChange("schedule")}
                    title="Analyse des horaires d'arrivée et départ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                      <path d="M8 14h.01" />
                      <path d="M12 14h.01" />
                      <path d="M16 14h.01" />
                      <path d="M8 18h.01" />
                      <path d="M12 18h.01" />
                      <path d="M16 18h.01" />
                    </svg>
                    Horaires
                  </button>
                  <button 
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${analyticsCategory === "breaks" ? "bg-amber-100 text-amber-800 border border-amber-300" : ""}`}
                    onClick={() => handleAnalyticsCategoryChange("breaks")}
                    title="Analyse des pauses et de leur durée"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" x2="6" y1="1" y2="4" />
                      <line x1="10" x2="10" y1="1" y2="4" />
                      <line x1="14" x2="14" y1="1" y2="4" />
                    </svg>
                    Pauses
                  </button>
                  <button 
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${analyticsCategory === "location" ? "bg-green-100 text-green-800 border border-green-300" : ""}`}
                    onClick={() => handleAnalyticsCategoryChange("location")}
                    title="Analyse de la répartition géographique"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Localisation
                  </button>
                </div>
                
                {/* Filtres communs pour tous les graphiques d'analytiques */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Période :</span>
                    <select 
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedPeriod}
                      onChange={(e) => handlePeriodChange(e.target.value as "day" | "week" | "month" | "year")}
                    >
                      <option value="day">Jour</option>
                      <option value="week">Semaine</option>
                      <option value="month">Mois</option>
                      <option value="year">Année</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Collaborateur :</span>
                    <select 
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedCollaborator || ""}
                      onChange={(e) => handleCollaboratorChange(e.target.value || null)}
                    >
                      <option value="">Tous les collaborateurs</option>
                      {getUniqueCollaborators().map(collaborator => (
                        <option key={collaborator.id} value={collaborator.id}>
                          {collaborator.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Contenu conditionnel basé sur la catégorie sélectionnée */}
            {analyticsCategory === "worktime" && (
              <>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <WorkDistributionChart
                    title="Répartition du temps de travail par collaborateur"
                    data={prepareWorkDistributionData(getFilteredActivities())}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <ArrivalTimeChart
                    title="Temps d'arrivée moyen"
                    data={prepareArrivalTimeData(getFilteredActivities())}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
            
            {analyticsCategory === "schedule" && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ArrivalTimeChart
                  title="Distribution des heures d'arrivée"
                  data={prepareArrivalTimeData(getFilteredActivities())}
                  className="col-span-3"
                />
              </div>
            )}
            
            {analyticsCategory === "breaks" && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <BreaksAnalysisChart
                  data={prepareBreaksData(getFilteredActivities(), selectedPeriod)}
                  title="Analyse des pauses"
                  className="col-span-3"
                />
              </div>
            )}
            
            {analyticsCategory === "location" && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Répartition des lieux de travail</CardTitle>
                    <CardDescription>
                      Analyse de la fréquentation des différents lieux de travail par les collaborateurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LocationAnalysisChart 
                      title="Répartition par lieu de travail" 
                      data={getFilteredActivities().length > 0 
                        ? prepareLocationData(getFilteredActivities())
                        : []}
                      className=""
                    />
                  </CardContent>
                </Card>
              </div>
            )}
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
                </div>

                {/* Sélecteur de collaborateur et indicateurs contextuels */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Collaborateur :</span>
                    <select 
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={selectedCollaborator || ""}
                      onChange={(e) => handleCollaboratorChange(e.target.value || null)}
                    >
                      <option value="">Tous les collaborateurs</option>
                      {getUniqueCollaborators().map(collaborator => (
                        <option key={collaborator.id} value={collaborator.id}>
                          {collaborator.name}
                        </option>
                      ))}
                    </select>
                    
                    {selectedCollaborator && (
                      <button
                        onClick={() => handleCollaboratorChange(null)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background p-0 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        title="Réinitialiser la sélection"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span className="sr-only">Réinitialiser</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Indicateur de collaborateur actif */}
                  <div className="flex items-center gap-2">
                    {selectedCollaborator && (
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md border border-indigo-200 text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Consultation des données de {getUniqueCollaborators().find(c => c.id === selectedCollaborator)?.name || 'collaborateur'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {getPaginatedData().length} enregistrement(s) affichés
                      {selectedPeriod !== "day" || selectedCollaborator ? (
                        <span className="ml-1">
                          sur {dashboardData?.recentActivities?.length || 0} au total 
                          {selectedCollaborator && (
                            <span className="inline-flex items-center ml-1 text-indigo-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              filtrés
                            </span>
                          )}
                        </span>
                      ) : null}
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
                  <div className="flex items-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <button onClick={handleDrillUp} className="mr-2 text-sm flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="m15 18-6-6 6-6"></path>
                      </svg>
                      Retour à la vue complète
                    </button>
                    <span className="text-sm text-slate-500 mx-2">|</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">Vous consultez :</span>
                      <span className={`ml-2 px-2 py-1 text-sm rounded-md ${
                        focusedPeriod.type === "week" ? "bg-green-100 text-green-800" :
                        focusedPeriod.type === "month" ? "bg-amber-100 text-amber-800" :
                        "bg-purple-100 text-purple-800"
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
                          Affiner la vue
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Chemin de navigation (breadcrumb) pour le drill-down */}
                <div className="mb-4 flex items-center text-sm">
                  <div className="flex items-center">
                    <button 
                      onClick={() => {
                        setSelectedPeriod("year");
                        setFocusedPeriod(null);
                      }}
                      className={`inline-flex items-center px-2 py-1 rounded-md transition-colors ${
                        selectedPeriod === "year" && !focusedPeriod 
                          ? "bg-purple-100 text-purple-800 font-medium" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <path d="M2 10h20" />
                      </svg>
                      Années
                    </button>

                    {(selectedPeriod === "month" || selectedPeriod === "week" || selectedPeriod === "day" || focusedPeriod?.type === "year") && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-1 text-gray-400">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <button 
                          onClick={() => {
                            setSelectedPeriod("month");
                            setFocusedPeriod(focusedPeriod?.type === "year" ? focusedPeriod : null);
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded-md transition-colors ${
                            selectedPeriod === "month" && (!focusedPeriod || focusedPeriod.type === "year")
                              ? "bg-amber-100 text-amber-800 font-medium" 
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                          </svg>
                          Mois
                        </button>
                      </>
                    )}

                    {(selectedPeriod === "week" || selectedPeriod === "day" || focusedPeriod?.type === "month") && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-1 text-gray-400">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <button 
                          onClick={() => {
                            setSelectedPeriod("week");
                            setFocusedPeriod(focusedPeriod?.type === "month" ? focusedPeriod : null);
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded-md transition-colors ${
                            selectedPeriod === "week" && (!focusedPeriod || focusedPeriod.type === "month")
                              ? "bg-green-100 text-green-800 font-medium" 
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                            <line x1="8" x2="16" y1="14" y2="14" />
                            <line x1="8" x2="16" y1="18" y2="18" />
                          </svg>
                          Semaines
                        </button>
                      </>
                    )}

                    {(selectedPeriod === "day" || focusedPeriod?.type === "week") && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-1 text-gray-400">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <button 
                          onClick={() => {
                            setSelectedPeriod("day");
                            setFocusedPeriod(focusedPeriod?.type === "week" ? focusedPeriod : null);
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded-md transition-colors ${
                            selectedPeriod === "day"
                              ? "bg-blue-100 text-blue-800 font-medium" 
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                            <circle cx="12" cy="16" r="2" />
                          </svg>
                          Jours
                        </button>
                      </>
                    )}
                  </div>

                  {/* Indicateur d'agrégation */}
                  <div className="ml-auto text-xs text-muted-foreground">
                    {selectedPeriod !== "day" && (
                      <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                          <line x1="6" y1="6" x2="6" y2="6"></line>
                          <line x1="6" y1="18" x2="6" y2="18"></line>
                        </svg>
                        <span>Données agrégées par {selectedPeriod === "week" ? "semaine" : selectedPeriod === "month" ? "mois" : "année"}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className={`${selectedPeriod === "day" ? "bg-blue-50" : selectedPeriod === "week" ? "bg-green-50" : selectedPeriod === "month" ? "bg-amber-50" : "bg-purple-50"}`}>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        
                        {selectedPeriod === "day" ? (
                          <>
                            {/* Ajout de la colonne d'adresse uniquement en vue journalière avec collaborateur sélectionné */}
                            {selectedCollaborator && (
                              <TableHead className="font-semibold" title="Adresse du lieu d'enregistrement">
                                Adresse
                                <span className="ml-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                  Lieu
                                </span>
                              </TableHead>
                            )}
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
                        getPaginatedData().map((item: any, i: number) => {
                          const isOngoing = !item.checkOutTimestamp;
                          return (
                            <TableRow 
                              key={i}
                              className={`
                                ${isOngoing ? "border-l-4 border-l-blue-400" : ""}
                                ${selectedPeriod === "day" ? "hover:bg-blue-50" : ""}
                                ${selectedPeriod === "week" ? "hover:bg-green-50" : ""}
                                ${selectedPeriod === "month" ? "hover:bg-amber-50" : ""}
                                ${selectedPeriod === "year" ? "hover:bg-purple-50" : ""}
                                ${i % 2 === 0 ? `${selectedPeriod === "day" ? "bg-blue-50/30" : selectedPeriod === "week" ? "bg-green-50/30" : selectedPeriod === "month" ? "bg-amber-50/30" : "bg-purple-50/30"}` : ""}
                                ${item.isAggregated ? "cursor-pointer group" : ""}
                                transition-colors
                              `}
                              onClick={() => item.isAggregated && handleDrillDown(item)}
                              onContextMenu={(e) => item.isAggregated && handleContextMenu(e, item)}
                            >
                              <TableCell>
                                <div className="flex items-center">
                                  {item.userName}
                                  {isOngoing && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                      En cours
                                    </span>
                                  )}
                                  {item.isAggregated && (
                                    <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      selectedPeriod === "week" ? "bg-green-100 text-green-800" : 
                                      selectedPeriod === "month" ? "bg-amber-100 text-amber-800" : 
                                      selectedPeriod === "year" ? "bg-purple-100 text-purple-800" : 
                                      "bg-gray-100 text-gray-800"
                                    }`}>
                                      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${
                                        selectedPeriod === "week" ? "bg-green-500" : 
                                        selectedPeriod === "month" ? "bg-amber-500" : 
                                        selectedPeriod === "year" ? "bg-purple-500" : 
                                        "bg-gray-500"
                                      }`}></span>
                                      {selectedPeriod === "week" ? "Semaine" : 
                                       selectedPeriod === "month" ? "Mois" : 
                                       selectedPeriod === "year" ? "Année" : 
                                       "Agrégé"}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              
                              {selectedPeriod === "day" ? (
                                <>
                                  {selectedCollaborator && (
                                    <TableCell>{item.location || "Adresse non disponible"}</TableCell>
                                  )}
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
                                    {selectedPeriod === "day" ? (
                                      item.checkInTimestamp ? (
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
                                      ) : <span className="text-gray-500">--</span>
                                    ) : (
                                      <>
                                        {format(new Date(item.totalWorkTime || 0), "HH:mm", { locale: fr })}
                                        {item.isAggregated && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {selectedPeriod === "week" && "Total semaine"}
                                            {selectedPeriod === "month" && "Total mois"}
                                            {selectedPeriod === "year" && "Total année"}
                                          </div>
                                        )}
                                        {/* Ajout d'un bouton de détail explicite pour le drill-down */}
                                        {item.isAggregated && (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation(); // Éviter le double déclenchement
                                              handleDrillDown(item);
                                            }}
                                            className="mt-2 w-full inline-flex items-center justify-center px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                              <circle cx="11" cy="11" r="8" />
                                              <path d="m21 21-4.3-4.3" />
                                            </svg>
                                            Voir détails
                                          </button>
                                        )}
                                      </>
                                    )}
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

                {/* Message d'aide pour le drill-down */}
                {selectedPeriod !== "day" && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                      <span className="font-medium">Astuce de navigation</span>
                    </div>
                    <p>
                      En mode {selectedPeriod === "week" ? "semaine" : selectedPeriod === "month" ? "mois" : "année"}, 
                      vous pouvez cliquer sur une ligne pour voir le détail 
                      {selectedPeriod === "week" ? " journalier" : selectedPeriod === "month" ? " par semaine" : " par mois"} 
                      de cette période.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <div className="bg-white border border-blue-200 rounded-md px-2 py-1 inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-blue-600">
                          <path d="M15 15H9v4l3-3 3 3v-4z"/>
                          <rect width="18" height="18" x="3" y="3" rx="2"/>
                          <path d="M9 9h6"/>
                        </svg>
                        <span>Clic gauche</span>
                        <span className="mx-2 text-gray-500">→</span>
                        <span>Zoom sur la période</span>
                      </div>
                      <div className="bg-white border border-blue-200 rounded-md px-2 py-1 inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-blue-600">
                          <path d="M14 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4z"/>
                          <path d="M4 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v4z"/>
                          <path d="M14 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4z"/>
                          <path d="M4 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v4z"/>
                        </svg>
                        <span>Bouton "Voir détails"</span>
                        <span className="mx-2 text-gray-500">→</span>
                        <span>Accéder au niveau inférieur</span>
                      </div>
                      <div className="bg-white border border-blue-200 rounded-md px-2 py-1 inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-blue-600">
                          <rect width="18" height="18" x="3" y="3" rx="2"/>
                          <path d="M9 15v-6"/>
                          <path d="M15 15v-6"/>
                        </svg>
                        <span>Bouton "Retour"</span>
                        <span className="mx-2 text-gray-500">→</span>
                        <span>Revenir au niveau supérieur</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Menu contextuel de navigation rapide */}
                {showContextMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={handleHideContextMenu}
                    />
                    <div 
                      className="fixed z-50 bg-white shadow-lg rounded-md border p-2 w-56"
                      style={{ 
                        top: `${showContextMenu.y}px`, 
                        left: `${showContextMenu.x}px`,
                      }}
                    >
                      <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                        Options de navigation
                      </div>
                      <div className="flex flex-col gap-1">
                        {selectedPeriod === "year" && (
                          <button 
                            onClick={() => {
                              const item = getFilteredActivities().find((a: any) => a.id === showContextMenu.id);
                              if (item) handleDrillDown(item);
                              handleHideContextMenu();
                            }}
                            className="flex items-center px-2 py-1.5 text-sm text-left hover:bg-blue-50 rounded-md"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            Voir les mois de cette année
                          </button>
                        )}
                        {selectedPeriod === "month" && (
                          <button 
                            onClick={() => {
                              const item = getFilteredActivities().find((a: any) => a.id === showContextMenu.id);
                              if (item) handleDrillDown(item);
                              handleHideContextMenu();
                            }}
                            className="flex items-center px-2 py-1.5 text-sm text-left hover:bg-blue-50 rounded-md"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                              <line x1="8" x2="16" y1="14" y2="14" />
                              <line x1="8" x2="16" y1="18" y2="18" />
                            </svg>
                            Voir les semaines de ce mois
                          </button>
                        )}
                        {selectedPeriod === "week" && (
                          <button 
                            onClick={() => {
                              const item = getFilteredActivities().find((a: any) => a.id === showContextMenu.id);
                              if (item) handleDrillDown(item);
                              handleHideContextMenu();
                            }}
                            className="flex items-center px-2 py-1.5 text-sm text-left hover:bg-blue-50 rounded-md"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                              <circle cx="12" cy="16" r="2" />
                            </svg>
                            Voir les jours de cette semaine
                          </button>
                        )}
                        <div className="border-t border-gray-100 my-1" />
                        <button 
                          onClick={() => {
                            handleDrillUp();
                            handleHideContextMenu();
                          }}
                          className="flex items-center px-2 py-1.5 text-sm text-left hover:bg-gray-50 rounded-md"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-600">
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                          Retour à la vue complète
                        </button>
                      </div>
                    </div>
                  </>
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
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span><strong>Vue hebdomadaire:</strong> Cumule les heures travaillées par semaine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <span><strong>Vue mensuelle:</strong> Cumule les heures travaillées par mois</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span><strong>Vue annuelle:</strong> Cumule les heures travaillées par année</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 