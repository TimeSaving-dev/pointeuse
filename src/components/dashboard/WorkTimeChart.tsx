"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  // Formater les heures pour l'affichage et s'assurer que averageHours existe
  const formattedData = data.map(item => ({
    ...item,
    averageHours: item.averageHours !== undefined 
      ? Number(item.averageHours.toFixed(2)) 
      : 0 // Valeur par défaut si averageHours n'existe pas
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
              <Tooltip 
                formatter={(value) => [`${value} heures`, "Temps moyen"]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageHours" 
                name="Temps moyen de travail" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 