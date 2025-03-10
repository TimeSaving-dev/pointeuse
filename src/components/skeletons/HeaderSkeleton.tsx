"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo et Navigation */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="hidden md:flex items-center space-x-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-20" />
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center mb-6 py-4">
      <div className="space-y-1">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      <div className="flex items-center space-x-3">
        <Skeleton className="h-9 w-[100px]" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
} 