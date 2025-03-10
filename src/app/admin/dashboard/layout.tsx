import { Header } from "@/components/dashboard/Header";

// Définir le type Metadata localement
type Metadata = {
  title: string;
  description: string;
};

export const metadata: Metadata = {
  title: "Administration | QR Code Pointeuse",
  description: "Tableau de bord administrateur",
};

export default function AdminDashboardLayout({
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