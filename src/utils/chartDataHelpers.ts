/**
 * Utilitaires pour la préparation des données pour les graphiques d'analytiques
 */

/**
 * Transforme les données d'activités pour le composant WorkDistributionChart
 * @param activities données d'activités provenant du dashboard
 * @returns données formatées pour le diagramme de répartition du temps de travail
 */
export function prepareWorkDistributionData(activities: any[]) {
  if (!activities || activities.length === 0) return [];
  
  // Regrouper les données par utilisateur
  const userWorkTimes = new Map<string, {id: string, name: string, workTime: number}>();
  
  activities.forEach(activity => {
    if (!activity.userId || !activity.userName || !activity.totalWorkTime) return;
    
    const userId = activity.userId;
    const userName = activity.userName;
    const workTime = activity.totalWorkTime;
    
    if (userWorkTimes.has(userId)) {
      // Ajouter le temps de travail à l'utilisateur existant
      const userData = userWorkTimes.get(userId)!;
      userData.workTime += workTime;
      userWorkTimes.set(userId, userData);
    } else {
      // Créer une nouvelle entrée pour cet utilisateur
      userWorkTimes.set(userId, {
        id: userId,
        name: userName,
        workTime
      });
    }
  });
  
  // Convertir la Map en tableau pour le graphique
  return Array.from(userWorkTimes.values());
}

/**
 * Calcule la moyenne des valeurs d'un tableau
 * @param values tableau de valeurs numériques
 * @returns la moyenne des valeurs
 */
export function calculateAverage(values: number[]) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

/**
 * Convertit les millisecondes en format heures:minutes
 * @param ms temps en millisecondes
 * @returns chaîne formatée "HH:mm"
 */
export function msToTime(ms: number) {
  if (!ms) return "00:00";
  
  // Convertir en heures et minutes
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Formater avec des zéros si nécessaire
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  
  return `${hoursStr}:${minutesStr}`;
}

/**
 * Prépare les données pour le graphique des heures d'arrivée
 * @param activities données d'activités de la journée
 * @returns données formatées pour le graphique des heures d'arrivée
 */
export function prepareArrivalTimeData(activities: any[]) {
  if (!activities || activities.length === 0) return [];
  
  return activities
    .filter(activity => activity.checkInTimestamp)
    .map(activity => {
      const date = new Date(activity.checkInTimestamp);
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      return {
        userId: activity.userId || activity.id,
        userName: activity.userName,
        hour,
        minute,
        timestamp: activity.checkInTimestamp,
        formattedTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      };
    })
    // Filtrer les heures d'arrivée raisonnables (entre 6h et 12h)
    .filter(item => item.hour >= 6 && item.hour <= 12);
}

export function prepareBreaksData(activities: any[], selectedPeriod: string) {
  if (!activities || activities.length === 0) return [];
  
  // Tableau pour stocker toutes les pauses extraites
  const allPauses: any[] = [];
  
  // Parcourir toutes les activités pour extraire leurs pauses
  activities.forEach(activity => {
    // Vérifier si l'activité contient un tableau de pauses
    if (activity.pauses && Array.isArray(activity.pauses) && activity.pauses.length > 0) {
      // Pour chaque pause dans l'activité
      activity.pauses.forEach((pause: any) => {
        // Vérifier que la pause a les propriétés nécessaires
        if (pause.startTime && (pause.endTime || pause.duration)) {
          const startTime = new Date(pause.startTime);
          const endTime = pause.endTime ? new Date(pause.endTime) : new Date(startTime.getTime() + pause.duration);
          const duration = pause.duration || (endTime.getTime() - startTime.getTime());
          
          const hour = startTime.getHours();
          
          let formattedStartTime = "";
          if (selectedPeriod === "day") {
            // Format 10:15
            formattedStartTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
          } else {
            // Format Lun 10:15
            const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
            formattedStartTime = `${dayNames[startTime.getDay()]} ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
          }
          
          allPauses.push({
            userId: activity.userId || "",
            userName: activity.userName || "Inconnu",
            startTime: pause.startTime,
            endTime: pause.endTime || new Date(startTime.getTime() + duration).toISOString(),
            duration,
            formattedStartTime,
            hour
          });
        }
      });
    }
    
    // Vérifier également si l'activité est elle-même une pause (pour la compatibilité avec un autre format possible)
    if (activity.type === "pause" && activity.startTime) {
      const startTime = new Date(activity.startTime);
      const endTime = activity.endTime ? new Date(activity.endTime) : new Date();
      const duration = activity.duration || (endTime.getTime() - startTime.getTime());
      
      const hour = startTime.getHours();
      
      let formattedStartTime = "";
      if (selectedPeriod === "day") {
        formattedStartTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      } else {
        const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        formattedStartTime = `${dayNames[startTime.getDay()]} ${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      }
      
      allPauses.push({
        userId: activity.userId || "",
        userName: activity.userName || "Inconnu",
        startTime: activity.startTime,
        endTime: activity.endTime || new Date().toISOString(),
        duration,
        formattedStartTime,
        hour
      });
    }
  });
  
  // Filtrer les pauses pour éliminer les valeurs aberrantes et les doublons
  return allPauses.filter(pause => 
    // S'assurer que l'heure est entre 6h et 20h (heures de travail raisonnables)
    pause.hour >= 6 && pause.hour <= 20 &&
    // S'assurer que la durée est entre 1 minute et 3 heures (limites raisonnables)
    pause.duration >= 60000 && pause.duration <= 10800000
  );
}

/**
 * Prépare les données pour le graphique de répartition des lieux de travail
 * @param activities données d'activités
 * @returns données formatées pour le graphique de localisation
 */
export function prepareLocationData(activities: any[]) {
  if (!activities || activities.length === 0) return [];
  
  // Map pour compter les occurrences de chaque lieu
  const locationCounts = new Map<string, { count: number, users: Set<string> }>();
  
  // Compter les activités par lieu
  activities.forEach(activity => {
    // Utiliser "location" ou "adresse" selon disponibilité, avec valeur par défaut
    const location = activity.location || activity.adresse || "Non spécifié";
    
    if (!locationCounts.has(location)) {
      locationCounts.set(location, { count: 0, users: new Set() });
    }
    
    const locationData = locationCounts.get(location)!;
    locationData.count++;
    
    // Collecter les utilisateurs uniques pour chaque lieu
    if (activity.userId) {
      locationData.users.add(activity.userId);
    }
  });
  
  // Convertir la Map en tableau pour le graphique
  return Array.from(locationCounts.entries())
    .map(([location, data]) => ({
      location,
      count: data.count,
      uniqueUsers: data.users.size,
      // Ajouter des couleurs en fonction de la fréquence
      color: getColorForFrequency(data.count, Math.max(...Array.from(locationCounts.values()).map(d => d.count)))
    }))
    .sort((a, b) => b.count - a.count); // Trier par ordre décroissant de fréquence
}

/**
 * Génère une couleur basée sur la fréquence relative d'un lieu
 * @param count nombre d'occurrences
 * @param maxCount nombre maximum d'occurrences
 * @returns code couleur hexadécimal
 */
function getColorForFrequency(count: number, maxCount: number): string {
  const colors = [
    "#4C51BF", // Indigo (plus fréquent)
    "#3182CE", // Bleu
    "#38B2AC", // Turquoise
    "#48BB78", // Vert
    "#ED8936", // Orange
    "#E53E3E"  // Rouge (moins fréquent)
  ];
  
  if (maxCount <= 1) return colors[0];
  
  // Calculer l'indice relatif dans le tableau de couleurs
  const ratio = count / maxCount;
  const index = Math.floor((1 - ratio) * (colors.length - 1));
  
  return colors[index];
} 