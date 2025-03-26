"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeaderSkeleton } from "./HeaderSkeleton";
import { StatisticsRowSkeleton } from "./StatisticsSkeletons";
import { WorkTimeChartSkeleton, ActivityChartSkeleton } from "./ChartSkeleton";
import { ActivityTableSkeleton } from "./ActivityTableSkeleton";

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header avec titre et actions */}
      <DashboardHeaderSkeleton />
      
      {/* Rangée de statistiques */}
      <StatisticsRowSkeleton />
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WorkTimeChartSkeleton />
        <ActivityChartSkeleton />
      </div>
      
      {/* Tableau d'activités récentes */}
      <ActivityTableSkeleton />
    </div>
  );
}

export function UserDashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header avec titre et actions */}
      <DashboardHeaderSkeleton />
      
      {/* QR Code et Informations personnelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </div>
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-[268px] w-full rounded-lg" />
        </div>
      </div>
      
      {/* Activités récentes */}
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  );
} 