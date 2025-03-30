"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, 
  AreaChart, Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, LogIn, Pause, LogOut, PieChart as PieChartIcon } from "lucide-react";

interface ActivityData {
  day: string;
  date: string;
  checkIns: number;
  pauses: number;
  checkOuts: number;
}

interface ActivityChartProps {
  data: ActivityData[];
  title: string;
  className?: string;
}

export function ActivityChart({ data, title, className }: ActivityChartProps) {
  // États pour gérer les options d'affichage
  const [chartType, setChartType] = useState<"bar" | "stacked" | "pie">("bar");
  const [selectedMetric, setSelectedMetric] = useState<"all" | "checkIns" | "pauses" | "checkOuts">("all");
  
  // Couleurs pour les différents types d'activités
  const COLORS = {
    checkIns: "#4C51BF",
    pauses: "#ED8936",
    checkOuts: "#38B2AC"
  };
  
  // Calculer les totaux pour le graphique en camembert
  const pieData = [
    { name: "Arrivées", value: data.reduce((sum, item) => sum + item.checkIns, 0), color: COLORS.checkIns },
    { name: "Pauses", value: data.reduce((sum, item) => sum + item.pauses, 0), color: COLORS.pauses },
    { name: "Départs", value: data.reduce((sum, item) => sum + item.checkOuts, 0), color: COLORS.checkOuts }
  ];
  
  // Tooltip personnalisé pour afficher plus de détails
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateInfo = data.find(item => item.day === label);
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{label} {dateInfo?.date ? `(${dateInfo.date})` : ''}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center gap-1 mt-1" style={{ color: entry.color }}>
              {entry.name === "Arrivées" && <LogIn size={14} />}
              {entry.name === "Pauses" && <Pause size={14} />}
              {entry.name === "Départs" && <LogOut size={14} />}
              <span>{entry.name}: {entry.value}</span>
            </div>
          ))}
          <div className="text-xs text-gray-500 mt-2">
            Cliquez sur la légende pour filtrer
          </div>
        </div>
      );
    }
    return null;
  };

  // Fonction pour filtrer les données en fonction du metric sélectionné
  const getFilteredData = () => {
    if (selectedMetric === "all") return data;
    
    return data.map(item => ({
      ...item,
      checkIns: selectedMetric === "checkIns" ? item.checkIns : 0,
      pauses: selectedMetric === "pauses" ? item.pauses : 0,
      checkOuts: selectedMetric === "checkOuts" ? item.checkOuts : 0
    }));
  };

  // Gestionnaire d'événements pour les clics sur la légende
  const handleLegendClick = (entry: any) => {
    const metric = entry.dataKey as "checkIns" | "pauses" | "checkOuts";
    setSelectedMetric(selectedMetric === metric ? "all" : metric);
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
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button 
            variant={chartType === "stacked" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChartType("stacked")}
            className="h-8 px-2 text-xs"
            title="Afficher en aires empilées"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button 
            variant={chartType === "pie" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setChartType("pie")}
            className="h-8 px-2 text-xs"
            title="Afficher en camembert"
          >
            <PieChartIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" && (
              <BarChart
                data={getFilteredData()}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend onClick={handleLegendClick} />
                <Bar 
                  dataKey="checkIns" 
                  name="Arrivées" 
                  fill={COLORS.checkIns}
                  fillOpacity={selectedMetric === "all" || selectedMetric === "checkIns" ? 1 : 0.3}
                />
                <Bar 
                  dataKey="pauses" 
                  name="Pauses" 
                  fill={COLORS.pauses}
                  fillOpacity={selectedMetric === "all" || selectedMetric === "pauses" ? 1 : 0.3} 
                />
                <Bar 
                  dataKey="checkOuts" 
                  name="Départs" 
                  fill={COLORS.checkOuts} 
                  fillOpacity={selectedMetric === "all" || selectedMetric === "checkOuts" ? 1 : 0.3}
                />
              </BarChart>
            )}
            
            {chartType === "stacked" && (
              <AreaChart
                data={getFilteredData()}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend onClick={handleLegendClick} />
                <Area 
                  type="monotone" 
                  dataKey="checkIns" 
                  stackId="1" 
                  name="Arrivées" 
                  fill={COLORS.checkIns} 
                  stroke={COLORS.checkIns}
                  fillOpacity={selectedMetric === "all" || selectedMetric === "checkIns" ? 0.6 : 0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="pauses" 
                  stackId="1" 
                  name="Pauses" 
                  fill={COLORS.pauses} 
                  stroke={COLORS.pauses}
                  fillOpacity={selectedMetric === "all" || selectedMetric === "pauses" ? 0.6 : 0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="checkOuts" 
                  stackId="1" 
                  name="Départs" 
                  fill={COLORS.checkOuts} 
                  stroke={COLORS.checkOuts}
                  fillOpacity={selectedMetric === "all" || selectedMetric === "checkOuts" ? 0.6 : 0.2}
                />
              </AreaChart>
            )}
            
            {chartType === "pie" && (
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center text-xs text-muted-foreground">
          {chartType === "bar" && "Cliquez sur les éléments de la légende pour filtrer les données"}
          {chartType === "stacked" && "Visualisation des données en aires empilées pour voir la répartition globale"}
          {chartType === "pie" && "Répartition des types d'activités sur l'ensemble de la période"}
        </div>
      </CardContent>
    </Card>
  );
} 