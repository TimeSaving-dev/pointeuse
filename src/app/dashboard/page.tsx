import { requireAuth } from "@/lib/auth";
import DashboardContent from "@/components/DashboardContent";

export default async function DashboardPage() {
  const user = await requireAuth();
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost";

  return (
    <DashboardContent 
      userName={user.name || user.email} 
      userEmail={user.email}
      baseUrl={baseUrl}
    />
  );
} 