"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoginSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <Skeleton className="h-8 w-[200px] mx-auto mb-2" />
          <Skeleton className="h-4 w-[250px] mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
          
          <Skeleton className="h-10 w-full mt-2" />
          
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RegisterSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <Skeleton className="h-8 w-[200px] mx-auto mb-2" />
          <Skeleton className="h-4 w-[250px] mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Plusieurs champs de formulaire */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          
          <Skeleton className="h-10 w-full mt-2" />
          
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ConfirmationSkeleton() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <Skeleton className="h-8 w-[250px] mx-auto mb-2" />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex justify-center">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        
        <div className="text-center space-y-3">
          <Skeleton className="h-6 w-[300px] mx-auto" />
          <Skeleton className="h-4 w-[250px] mx-auto" />
        </div>
        
        <div className="pt-4 flex justify-center">
          <Skeleton className="h-10 w-[200px]" />
        </div>
      </CardContent>
    </Card>
  );
} 