"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "./CardSkeleton";
import { TableSkeleton } from "./TableSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton className="h-5 w-1/3 mb-6" />
          <div className="h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton className="h-5 w-1/3 mb-6" />
          <div className="h-64">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-5 w-1/4" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-36" />
          </div>
        </div>
        <TableSkeleton columns={5} rows={5} />
      </div>
    </div>
  );
} 