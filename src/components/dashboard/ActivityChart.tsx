"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
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
              <Tooltip />
              <Legend />
              <Bar dataKey="checkIns" name="Arrivées" fill="#4C51BF" />
              <Bar dataKey="pauses" name="Pauses" fill="#ED8936" />
              <Bar dataKey="checkOuts" name="Départs" fill="#38B2AC" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 