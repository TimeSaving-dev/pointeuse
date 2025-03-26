"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QRCodeSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-center">
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {/* QR Code placeholder */}
        <Skeleton className="h-48 w-48 rounded-md" />
        
        {/* User information */}
        <div className="w-full space-y-2 mt-4">
          <Skeleton className="h-5 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>

        {/* Button placeholder */}
        <Skeleton className="h-9 w-full max-w-xs mt-2" />
      </CardContent>
    </Card>
  );
}

export function QRCodeGeneratorSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Input field */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* QR Code placeholder */}
      <div className="flex justify-center py-4">
        <Skeleton className="h-[250px] w-[250px] rounded-md" />
      </div>
      
      {/* Download button placeholder */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
} 