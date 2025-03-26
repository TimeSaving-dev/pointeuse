"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CardSkeletonProps {
  headerSize?: 'sm' | 'md' | 'lg'; // Utiliser des tailles prédéfinies
  contentItems?: number;
  className?: string;
}

export function CardSkeleton({
  headerSize = 'md',
  contentItems = 3,
  className,
}: CardSkeletonProps) {
  // Utiliser des classes Tailwind prédéfinies
  const headerClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8'
  };

  // Largeurs prédéfinies pour les éléments de contenu
  const contentWidths = ['w-[60%]', 'w-[70%]', 'w-[80%]', 'w-[90%]', 'w-[65%]', 'w-[75%]', 'w-[85%]'];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <Skeleton className={`w-3/4 ${headerClasses[headerSize]}`} />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: contentItems }).map((_, index) => {
          // Utiliser une valeur de largeur prédéfinie basée sur l'index
          const widthClass = contentWidths[index % contentWidths.length];
          
          return (
            <Skeleton 
              key={index} 
              className={`h-4 ${widthClass}`} 
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-7 w-[80px]" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
} 