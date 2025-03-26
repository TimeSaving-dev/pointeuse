"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Vérifier la session toutes les 5 minutes (en secondes)
      refetchInterval={300}
      // Refetch la session quand l'utilisateur revient sur l'onglet
      refetchOnWindowFocus={true}
      // Forcer le refetch lors du premier montage
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
} 