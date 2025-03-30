"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, Label
} from "recharts";
import { Button } from "@/components/ui/button";
import { Clock, BarChart2, Calendar, Users } from "lucide-react";

interface ArrivalTimeData {
  userId: string;
  userName: string;
  hour: number;
  minute: number;
  timestamp: string;
  formattedTime: string;
}

interface ArrivalTimeChartProps {
  data: ArrivalTimeData[];
  title: string;
  className?: string;
}

// Palette de couleurs pour les barres
const COLORS = [
  "#38B2AC", "#4299E1", "#4C51BF", "#667EEA", "#805AD5",
  "#D53F8C", "#ED8936", "#E53E3E", "#48BB78"
];

export function ArrivalTimeChart({ data, title, className }: ArrivalTimeChartProps) {
  // État pour gérer les options d'affichage
  const [viewType, setViewType] = useState<"scatter" | "histogram">("histogram");
  
  // Préparation des données pour le nuage de points (scatter)
  const scatterData = data.map(item => ({
    x: item.hour + (item.minute / 60), // Convertir en valeur décimale
    y: Math.random() * 10, // Position aléatoire sur l'axe Y pour éviter la superposition
    userId: item.userId,
    userName: item.userName,
    formattedTime: item.formattedTime,
    timestamp: item.timestamp
  }));
  
  // Préparation des données pour l'histogramme
  const getHistogramData = () => {
    // Créer des tranches d'une demi-heure
    const timeSlots: { [key: string]: number } = {};
    
    // Initialiser les créneaux horaires (de 6h à 12h)
    for (let hour = 6; hour <= 12; hour++) {
      timeSlots[`${hour}:00`] = 0;
      timeSlots[`${hour}:30`] = 0;
    }
    
    // Compter les arrivées par créneau horaire
    data.forEach(item => {
      const hour = item.hour;
      const minute = item.minute;
      const slotKey = `${hour}:${minute < 30 ? '00' : '30'}`;
      
      if (timeSlots[slotKey] !== undefined) {
        timeSlots[slotKey]++;
      }
    });
    
    // Convertir en tableau pour le graphique
    return Object.entries(timeSlots).map(([time, count]) => ({
      time,
      count,
      // Ajouter une couleur basée sur l'heure (rouge pour tard, vert pour tôt)
      color: getColorByTime(time)
    }));
  };
  
  // Déterminer la couleur en fonction de l'heure
  const getColorByTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const timeValue = hour + (minute / 60);
    
    if (timeValue < 7.5) return "#48BB78"; // Vert pour tôt
    if (timeValue < 8.5) return "#38B2AC"; // Turquoise pour normal
    if (timeValue < 9.5) return "#ED8936"; // Orange pour légèrement tard
    return "#E53E3E"; // Rouge pour tard
  };
  
  // Tooltip personnalisé pour l'histogramme
  const HistogramTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">Créneau: {data.time}</p>
          <div className="flex items-center gap-1 mt-1">
            <Users size={14} />
            <span>{data.count} arrivée(s)</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.count === 1 ? 
              "1 collaborateur est arrivé dans ce créneau" : 
              `${data.count} collaborateurs sont arrivés dans ce créneau`
            }
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Tooltip personnalisé pour le nuage de points
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{data.userName}</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock size={14} />
            <span>Arrivée à {data.formattedTime}</span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const histogramData = getHistogramData();
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant={viewType === "histogram" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewType("histogram")}
            className="h-8 px-2 text-xs"
            title="Afficher en histogramme"
          >
            <BarChart2 className="mr-1 h-4 w-4" />
            Histogramme
          </Button>
          <Button 
            variant={viewType === "scatter" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewType("scatter")}
            className="h-8 px-2 text-xs"
            title="Afficher en nuage de points"
          >
            <Calendar className="mr-1 h-4 w-4" />
            Détail
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === "histogram" ? (
              <BarChart
                data={histogramData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  label={{ 
                    value: 'Heure d\'arrivée', 
                    position: 'insideBottom', 
                    offset: -10 
                  }}
                />
                <YAxis 
                  label={{ 
                    value: 'Nombre d\'arrivées', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10
                  }}
                />
                <Tooltip content={<HistogramTooltip />} />
                <Bar dataKey="count" name="Arrivées">
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <ScatterChart
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Heure" 
                  domain={[6, 12]}
                  tickFormatter={(value) => {
                    const hour = Math.floor(value);
                    const minute = Math.round((value - hour) * 60);
                    return `${hour}:${minute.toString().padStart(2, '0')}`;
                  }}
                  label={{ 
                    value: 'Heure d\'arrivée', 
                    position: 'insideBottom', 
                    offset: -10 
                  }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Position" 
                  domain={[0, 10]} 
                  tickFormatter={() => ''}
                />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter 
                  name="Arrivées" 
                  data={scatterData} 
                  fill="#8884d8" 
                  shape="circle"
                />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        </div>
        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Clock size={48} className="mb-2 opacity-30" />
            <p>Aucune donnée d'horaire disponible pour cette période</p>
            <p className="text-sm mt-1">Sélectionnez une autre période ou vérifiez les données</p>
          </div>
        )}
        {data.length > 0 && (
          <div className="text-xs text-center text-muted-foreground mt-4">
            {viewType === "histogram" ? 
              "L'histogramme montre la distribution des arrivées par créneau de 30 minutes" :
              "Chaque point représente l'heure d'arrivée d'un collaborateur"
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
} 