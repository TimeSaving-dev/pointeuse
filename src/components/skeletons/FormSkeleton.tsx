"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface FormSkeletonProps {
  fields: number;
  showLabels?: boolean;
  showButton?: boolean;
  buttonWidth?: string;
}

export function FormSkeleton({
  fields = 3,
  showLabels = true,
  showButton = true,
  buttonWidth = "w-full",
}: FormSkeletonProps) {
  // Créer classes séparées pour éviter les interpolations problématiques
  const buttonClasses = `h-10 mt-6 ${buttonWidth}`;

  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {showLabels && <Skeleton className="h-4 w-1/4" />}
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      {showButton && (
        <Skeleton className={buttonClasses} />
      )}
    </div>
  );
}

export function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
      
      <FormSkeleton fields={2} />
      
      <div className="flex justify-between mt-4">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
} 