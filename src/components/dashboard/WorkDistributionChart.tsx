"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector
} from "recharts";
import { Button } from "@/components/ui/button";
import { Clock, Users, UserCheck, SortDesc, Percent } from "lucide-react";

interface CollaboratorWorkData {
  id: string;
  name: string;
  workTime: number; // temps de travail en millisecondes
}

interface WorkDistributionChartProps {
  data: CollaboratorWorkData[];
  title: string;
  className?: string;
}

// Palette de couleurs pour les collaborateurs
const COLORS = [
  "#4C51BF", "#3182CE", "#38B2AC", "#48BB78", "#ED8936", 
  "#E53E3E", "#805AD5", "#D53F8C", "#667EEA", "#2B6CB0"
];

export function WorkDistributionChart({ data, title, className }: WorkDistributionChartProps) {
  // État pour gérer les options d'affichage
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<"hours" | "percent">("hours");
  
  // Convertir les données pour l'affichage
  const chartData = data.map((item) => {
    // Convertir les millisecondes en heures (pour l'affichage)
    const hours = item.workTime / (1000 * 60 * 60);
    return {
      id: item.id,
      name: item.name,
      value: parseFloat(hours.toFixed(2)),
      formattedValue: displayMode === "hours" 
        ? `${hours.toFixed(2)}h` 
        : ""  // Sera calculé comme pourcentage dans le diagramme
    };
  }).sort((a, b) => b.value - a.value); // Trier par temps de travail décroissant
  
  // Calculer le temps total pour les pourcentages
  const totalWorkTime = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Limiter le nombre de segments à afficher (pour la lisibilité)
  const maxSegments = 8;
  const displayedData = chartData.slice(0, maxSegments);
  
  // Si nous avons plus de données que ce que nous affichons, ajouter un segment "Autres"
  if (chartData.length > maxSegments) {
    const othersValue = chartData.slice(maxSegments).reduce((sum, item) => sum + item.value, 0);
    displayedData.push({
      id: "others",
      name: "Autres collaborateurs",
      value: parseFloat(othersValue.toFixed(2)),
      formattedValue: displayMode === "hours" ? `${othersValue.toFixed(2)}h` : ""
    });
  }
  
  // Gestionnaire pour les survols sur le diagramme
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  };
  
  // Composant personnalisé pour le segment actif
  const renderActiveShape = (props: any) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, value
    } = props;
    
    const percent = ((value / totalWorkTime) * 100).toFixed(1);
    
    return (
      <g>
        <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill={fill} className="text-lg font-medium">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#666" className="text-sm">
          {`${value}h (${percent}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };
  
  // Composant personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / totalWorkTime) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{data.name}</p>
          <div className="flex items-center gap-1 mt-1 text-blue-600">
            <Clock size={14} />
            <span>{data.value} heures travaillées</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-purple-600">
            <Percent size={14} />
            <span>{percent}% du temps total</span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Légende personnalisée
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 text-xs mt-4">
        {payload.map((entry: any, index: number) => (
          <li 
            key={`item-${index}`} 
            className="flex items-center gap-1"
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
            <span className="text-gray-500 ml-1">
              {((entry.payload.value / totalWorkTime) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    );
  };
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant={displayMode === "hours" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setDisplayMode("hours")}
            className="h-8 px-2 text-xs"
            title="Afficher en heures travaillées"
          >
            <Clock className="mr-1 h-4 w-4" />
            Heures
          </Button>
          <Button 
            variant={displayMode === "percent" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setDisplayMode("percent")}
            className="h-8 px-2 text-xs"
            title="Afficher en pourcentage"
          >
            <Percent className="mr-1 h-4 w-4" />
            Pourcentage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                data={displayedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                labelLine={false}
                label={displayMode === "percent" ? 
                  ({ value }) => `${((value / totalWorkTime) * 100).toFixed(0)}%` : 
                  ({ payload }) => payload.formattedValue
                }
              >
                {displayedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Users size={48} className="mb-2 opacity-30" />
            <p>Aucune donnée disponible pour cette période</p>
            <p className="text-sm mt-1">Sélectionnez une autre période ou vérifiez les données</p>
          </div>
        )}
        {data.length > 0 && (
          <div className="text-xs text-center text-muted-foreground mt-2">
            <span className="flex items-center justify-center gap-1">
              <UserCheck className="h-3 w-3" />
              {data.length} collaborateur{data.length > 1 ? 's' : ''} | 
              Total: {totalWorkTime.toFixed(1)} heures travaillées
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 