"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartSkeletonProps {
  title?: boolean;
  height?: 'sm' | 'md' | 'lg';
  legendItems?: number;
}

export function ChartSkeleton({ 
  title = true,
  height = 'md',
  legendItems = 0
}: ChartSkeletonProps) {
  const heightClasses = {
    sm: 'h-[150px]',
    md: 'h-[250px]',
    lg: 'h-[350px]'
  };

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle><Skeleton className="h-6 w-2/3" /></CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Skeleton className={`w-full rounded-md ${heightClasses[height]}`} />
        
        {legendItems > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {Array.from({ length: legendItems }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkTimeChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full rounded-md" />
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle><Skeleton className="h-6 w-2/3" /></CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full rounded-md" />
        
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 