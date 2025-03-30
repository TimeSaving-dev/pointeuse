"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Briefcase, Clock, TrendingUp } from "lucide-react";

interface WorkTimeData {
  date: string;
  formattedDate: string;
  averageHours: number;
}

interface WorkTimeChartProps {
  data: WorkTimeData[];
  title: string;
  className?: string;
}

export function WorkTimeChart({ data, title, className }: WorkTimeChartProps) {
  // État pour gérer les options d'affichage
  const [showAverage, setShowAverage] = useState(true);
  const [showTarget, setShowTarget] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  
  // Calcul de la moyenne globale
  const globalAverage = data.length > 0 
    ? data.reduce((sum, item) => sum + (item.averageHours || 0), 0) / data.length 
    : 0;
  
  // Valeur cible (exemple: 7.5 heures par jour)
  const targetValue = 7.5;
  
  // Formater les heures pour l'affichage et ajouter les données dérivées
  const formattedData = data.map((item, index, array) => {
    // Calculer la tendance (moyenne mobile sur 3 jours)
    let trendValue = item.averageHours;
    if (index > 0 && index < array.length - 1) {
      trendValue = (array[index-1].averageHours + item.averageHours + array[index+1].averageHours) / 3;
    }
    
    return {
      ...item,
      averageHours: item.averageHours !== undefined 
        ? Number(item.averageHours.toFixed(2)) 
        : 0,
      trendHours: Number(trendValue?.toFixed(2) || 0)
    };
  });
  
  // Fonction pour le formatage du tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-bold">{data.formattedDate}</p>
          <div className="flex items-center gap-1 text-blue-600">
            <Clock size={14} />
            <span>{payload[0].value} heures travaillées</span>
          </div>
          {showTrend && payload.length > 1 && (
            <div className="flex items-center gap-1 text-purple-600 mt-1">
              <TrendingUp size={14} />
              <span>Tendance: {payload[1].value} heures</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-600 mt-1">
            <Briefcase size={14} />
            <span>
              {payload[0].value > targetValue 
                ? `${(payload[0].value - targetValue).toFixed(2)}h au-dessus de l'objectif` 
                : `${(targetValue - payload[0].value).toFixed(2)}h en dessous de l'objectif`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant={showAverage ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowAverage(!showAverage)}
            className="h-8 px-2 text-xs"
          >
            <BadgeCheck className="mr-1 h-4 w-4" />
            Moyenne
          </Button>
          <Button 
            variant={showTarget ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowTarget(!showTarget)}
            className="h-8 px-2 text-xs"
          >
            <Briefcase className="mr-1 h-4 w-4" />
            Objectif
          </Button>
          <Button 
            variant={showTrend ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowTrend(!showTrend)}
            className="h-8 px-2 text-xs"
          >
            <TrendingUp className="mr-1 h-4 w-4" />
            Tendance
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis unit="h" domain={[0, 'dataMax + 1']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Ligne principale */}
              <Line 
                type="monotone" 
                dataKey="averageHours" 
                name="Temps de travail" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                activeDot={{ r: 8 }} 
              />
              
              {/* Ligne de tendance conditionnelle */}
              {showTrend && (
                <Line 
                  type="monotone" 
                  dataKey="trendHours" 
                  name="Tendance" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              
              {/* Ligne de la moyenne globale conditionnelle */}
              {showAverage && (
                <ReferenceLine 
                  y={globalAverage} 
                  stroke="#059669" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: `Moyenne: ${globalAverage.toFixed(2)}h`, 
                    position: 'insideBottomRight',
                    fill: '#059669',
                    fontSize: 12
                  }} 
                />
              )}
              
              {/* Ligne d'objectif conditionnelle */}
              {showTarget && (
                <ReferenceLine 
                  y={targetValue} 
                  stroke="#DC2626" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: `Objectif: ${targetValue}h`, 
                    position: 'insideTopRight',
                    fill: '#DC2626',
                    fontSize: 12
                  }} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 