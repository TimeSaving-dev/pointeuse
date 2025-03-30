"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, Sector
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, Clock, Coffee, Users } from "lucide-react";
import { msToTime } from "@/utils/chartDataHelpers";

interface PauseData {
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  duration: number; // en millisecondes
  formattedStartTime: string;
  hour: number;
}

interface BreaksAnalysisChartProps {
  data: PauseData[];
  title: string;
  className?: string;
}

// Palette de couleurs
const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316"
];

export function BreaksAnalysisChart({ data, title, className }: BreaksAnalysisChartProps) {
  // État pour gérer le type de graphique
  const [chartType, setChartType] = useState<"frequency" | "duration" | "distribution">("frequency");
  
  // Calculer la fréquence des pauses par heure
  const getFrequencyData = () => {
    const hours: { [key: number]: number } = {};
    
    // Initialiser toutes les heures de 8h à 18h
    for (let hour = 8; hour <= 18; hour++) {
      hours[hour] = 0;
    }
    
    // Compter les pauses par heure
    data.forEach(pause => {
      if (pause.hour >= 8 && pause.hour <= 18) {
        hours[pause.hour]++;
      }
    });
    
    // Convertir en tableau pour le graphique
    return Object.entries(hours).map(([hour, count]) => ({
      hour: `${hour}h`,
      count,
      color: getColorForHour(parseInt(hour))
    }));
  };
  
  // Calculer la durée moyenne des pauses par heure
  const getDurationData = () => {
    const hourDurations: { [key: number]: { total: number; count: number } } = {};
    
    // Initialiser toutes les heures de 8h à 18h
    for (let hour = 8; hour <= 18; hour++) {
      hourDurations[hour] = { total: 0, count: 0 };
    }
    
    // Additionner les durées des pauses par heure
    data.forEach(pause => {
      if (pause.hour >= 8 && pause.hour <= 18) {
        hourDurations[pause.hour].total += pause.duration;
        hourDurations[pause.hour].count++;
      }
    });
    
    // Calculer les moyennes et convertir en tableau pour le graphique
    return Object.entries(hourDurations).map(([hour, { total, count }]) => ({
      hour: `${hour}h`,
      // Convertir la durée moyenne de millisecondes en minutes
      averageDuration: count > 0 ? Math.round(total / count / 60000) : 0,
      color: getColorForHour(parseInt(hour))
    }));
  };
  
  // Créer des tranches de durée de pause pour la distribution
  const getDistributionData = () => {
    const ranges = [
      { label: "< 5 min", min: 0, max: 5 * 60 * 1000, count: 0 },
      { label: "5-10 min", min: 5 * 60 * 1000, max: 10 * 60 * 1000, count: 0 },
      { label: "10-15 min", min: 10 * 60 * 1000, max: 15 * 60 * 1000, count: 0 },
      { label: "15-30 min", min: 15 * 60 * 1000, max: 30 * 60 * 1000, count: 0 },
      { label: "> 30 min", min: 30 * 60 * 1000, max: Infinity, count: 0 }
    ];
    
    // Compter les pauses par tranche de durée
    data.forEach(pause => {
      const duration = pause.duration;
      for (const range of ranges) {
        if (duration >= range.min && duration < range.max) {
          range.count++;
          break;
        }
      }
    });
    
    // Convertir en format pour le graphique
    return ranges.map((range, index) => ({
      name: range.label,
      value: range.count,
      color: COLORS[index % COLORS.length]
    }));
  };
  
  // Assigner une couleur en fonction de l'heure
  const getColorForHour = (hour: number) => {
    if (hour < 10) return "#4C51BF"; // Matin
    if (hour < 12) return "#38B2AC"; // Fin de matinée
    if (hour === 12 || hour === 13) return "#ED8936"; // Midi
    if (hour < 16) return "#48BB78"; // Après-midi
    return "#805AD5"; // Fin de journée
  };
  
  // Tooltip personnalisé pour la fréquence
  const FrequencyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{data.hour}</p>
          <div className="flex items-center gap-1 mt-1">
            <Coffee size={14} />
            <span>{data.count} pause(s)</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {(data.count / data.length * 100).toFixed(1)}% des pauses
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Tooltip personnalisé pour la durée
  const DurationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{data.hour}</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock size={14} />
            <span>{data.averageDuration} minutes en moyenne</span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Tooltip personnalisé pour la distribution
  const DistributionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = getDistributionData().reduce((sum, item) => sum + item.value, 0);
      const percent = total > 0 ? (data.value / total * 100).toFixed(1) : "0";
      
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">Durée: {data.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Users size={14} />
            <span>{data.value} pause(s)</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-gray-600">
            <PieChartIcon size={14} />
            <span>{percent}% des pauses</span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Rendu actif pour le graphique en secteurs
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const total = getDistributionData().reduce((sum, item) => sum + item.value, 0);
    const percent = total > 0 ? (value / total * 100).toFixed(1) : "0";
    
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={fill} className="text-base font-medium">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={10} textAnchor="middle" fill="#666" className="text-sm">
          {value} pause(s) ({percent}%)
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };
  
  const frequencyData = getFrequencyData();
  const durationData = getDurationData();
  const distributionData = getDistributionData();
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant={chartType === "frequency" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChartType("frequency")}
            className="h-8 px-2 text-xs"
            title="Fréquence des pauses par heure"
          >
            <BarChart2 className="mr-1 h-4 w-4" />
            Fréquence
          </Button>
          <Button 
            variant={chartType === "duration" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChartType("duration")}
            className="h-8 px-2 text-xs"
            title="Durée moyenne des pauses"
          >
            <LineChartIcon className="mr-1 h-4 w-4" />
            Durée
          </Button>
          <Button 
            variant={chartType === "distribution" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChartType("distribution")}
            className="h-8 px-2 text-xs"
            title="Distribution par durée"
          >
            <PieChartIcon className="mr-1 h-4 w-4" />
            Distribution
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "frequency" && (
              <BarChart
                data={frequencyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  label={{ 
                    value: 'Heure de la journée', 
                    position: 'insideBottom', 
                    offset: -10 
                  }} 
                />
                <YAxis 
                  label={{ 
                    value: 'Nombre de pauses', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10
                  }}
                />
                <Tooltip content={<FrequencyTooltip />} />
                <Bar dataKey="count" name="Nombre de pauses">
                  {frequencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
            
            {chartType === "duration" && (
              <LineChart
                data={durationData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  label={{ 
                    value: 'Heure de la journée', 
                    position: 'insideBottom', 
                    offset: -10 
                  }} 
                />
                <YAxis 
                  label={{ 
                    value: 'Durée moyenne (minutes)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 10
                  }}
                />
                <Tooltip content={<DurationTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="averageDuration" 
                  name="Durée moyenne" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            )}
            
            {chartType === "distribution" && (
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DistributionTooltip />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Coffee size={48} className="mb-2 opacity-30" />
            <p>Aucune donnée de pause disponible pour cette période</p>
            <p className="text-sm mt-1">Sélectionnez une autre période ou vérifiez les données</p>
          </div>
        )}
        {data.length > 0 && (
          <div className="text-xs text-center text-muted-foreground mt-4">
            {chartType === "frequency" && "La fréquence montre à quelles heures les pauses sont le plus souvent prises"}
            {chartType === "duration" && "La durée moyenne des pauses en minutes par heure de la journée"}
            {chartType === "distribution" && "La répartition des pauses par tranches de durée"}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 