"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await signOut({ redirect: false });
      // Rediriger vers la page de connexion après déconnexion
      router.push("/auth/login");
    };

    performLogout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p className="text-sm font-medium text-gray-500">Déconnexion en cours...</p>
      </div>
    </div>
  );
} 