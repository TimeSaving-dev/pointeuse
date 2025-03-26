import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user) {
    return null;
  }
  
  return session.user;
}

// Middleware pour les routes protégées côté serveur
export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  return session.user;
} 