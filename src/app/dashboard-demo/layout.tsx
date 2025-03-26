import { Metadata } from "next";
import { Header } from "@/components/dashboard/Header";

export const metadata: Metadata = {
  title: "Tableau de bord | QR Code Pointeuse",
  description: "Tableau de bord utilisateur",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
    </div>
  );
} 