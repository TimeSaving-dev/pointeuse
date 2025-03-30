"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { Button } from "@/components/ui/button";
import { MapPin, BarChart2, PieChart as PieChartIcon, Users, Building } from "lucide-react";

interface LocationData {
  location: string;
  count: number;
  uniqueUsers: number;
  color: string;
}

interface LocationAnalysisChartProps {
  data: LocationData[];
  title: string;
  className?: string;
}

export function LocationAnalysisChart({ data, title, className }: LocationAnalysisChartProps) {
  // État pour gérer le type de graphique
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [activeIndex, setActiveIndex] = useState(-1);
  
  // Vérifier si nous avons des données
  const hasData = data && data.length > 0;
  
  // Limiter le nombre de lieux affichés pour les grands ensembles de données
  const displayLimit = 8;
  let chartData = [...data];
  
  // Si nous avons plus de lieux que la limite, regrouper les moins fréquents
  if (hasData && data.length > displayLimit) {
    const mainLocations = data.slice(0, displayLimit - 1);
    const otherLocations = data.slice(displayLimit - 1);
    
    const otherCount = otherLocations.reduce((sum, item) => sum + item.count, 0);
    const otherUniqueUsers = new Set(
      otherLocations.flatMap(item => Array(item.uniqueUsers).fill(item.location))
    ).size;
    
    chartData = [
      ...mainLocations,
      {
        location: "Autres lieux",
        count: otherCount,
        uniqueUsers: otherUniqueUsers,
        color: "#718096" // Gris pour "Autres"
      }
    ];
  }
  
  // Définir les marges pour le graphique en barres
  const chartMargins = {
    top: 20,
    right: 30,
    left: hasData && data.some(item => item.location.length > 15) ? 120 : 50, // Ajuster la marge gauche pour les noms longs
    bottom: 20
  };
  
  // Tooltip personnalisé pour le graphique en barres
  const BarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{data.location}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={14} />
            <span>{data.count} présence(s)</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users size={14} />
            <span>{data.uniqueUsers} collaborateur(s) différent(s)</span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Tooltip personnalisé pour le graphique en camembert
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{data.location}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={14} />
            <span>{data.count} présence(s)</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Users size={14} />
            <span>{data.uniqueUsers} collaborateur(s)</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {((data.count / data.reduce((sum: number, item: any) => sum + item.count, 0)) * 100).toFixed(1)}% des présences
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Gestionnaire pour les interactions avec le graphique en camembert
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(-1);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant={chartType === "bar" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChartType("bar")}
            className="h-8 px-2 text-xs"
            title="Afficher en barres"
          >
            <BarChart2 className="mr-1 h-4 w-4" />
            Barres
          </Button>
          <Button 
            variant={chartType === "pie" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChartType("pie")}
            className="h-8 px-2 text-xs"
            title="Afficher en camembert"
          >
            <PieChartIcon className="mr-1 h-4 w-4" />
            Camembert
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={chartMargins}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="location" 
                  type="category" 
                  width={chartMargins.left} 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="Nombre de présences"
                  background={{ fill: "#f3f4f6" }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={(props) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
                    return (
                      <g>
                        <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
                          {payload.location}
                        </text>
                        <text x={cx} y={cy + 10} textAnchor="middle" fill="#666" className="text-xs">
                          {value} présence(s)
                        </text>
                        <text x={cx} y={cy + 30} textAnchor="middle" fill="#666" className="text-xs">
                          {payload.uniqueUsers} collaborateur(s)
                        </text>
                        <text x={cx} y={cy + 50} textAnchor="middle" fill="#666" className="text-xs">
                          {((value / chartData.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%
                        </text>
                        <g>
                          <circle cx={cx - 60} cy={cy - 40} r={8} fill={fill} />
                          <text x={cx - 45} y={cy - 36} className="text-xs">{payload.location}</text>
                        </g>
                        <g>
                          <circle cx={cx - 60} cy={cy - 20} r={8} fill="#718096" />
                          <text x={cx - 45} y={cy - 16} className="text-xs">Présences</text>
                        </g>
                        <g>
                          <circle cx={cx - 60} cy={cy} r={8} fill="#4A5568" />
                          <text x={cx - 45} y={cy + 4} className="text-xs">Collaborateurs</text>
                        </g>
                        <g>
                          <circle cx={cx - 60} cy={cy + 20} r={8} fill="#2D3748" />
                          <text x={cx - 45} y={cy + 24} className="text-xs">Pourcentage</text>
                        </g>
                      </g>
                    );
                  }}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="count"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  labelLine={false}
                  label={({ location, count }) => {
                    // Tronquer les noms de lieu trop longs pour l'affichage
                    const displayName = location.length > 10 ? `${location.substring(0, 8)}...` : location;
                    return `${displayName} (${count})`;
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
        {!hasData && (
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Building size={48} className="mb-2 opacity-30" />
            <p>Aucune donnée de localisation disponible pour cette période</p>
            <p className="text-sm mt-1">Sélectionnez une autre période ou vérifiez les données</p>
          </div>
        )}
        {hasData && (
          <div className="text-xs text-center text-muted-foreground mt-4">
            {chartType === "bar" ? 
              "Répartition des lieux de travail en nombre de présences" : 
              "Proportion des présences par lieu de travail"
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
} 