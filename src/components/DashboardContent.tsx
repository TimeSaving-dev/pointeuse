"use client";

import dynamic from "next/dynamic";

// Import dynamique du composant QRCodeGenerator (côté client uniquement)
const QRCodeGenerator = dynamic(() => import("@/components/QRCodeGenerator"), {
  ssr: false,
});

interface DashboardContentProps {
  userName: string;
  userEmail: string;
  baseUrl: string;
}

export default function DashboardContent({ 
  userName, 
  userEmail, 
  baseUrl 
}: DashboardContentProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Bienvenue, {userName || userEmail}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <QRCodeGenerator
            url={`${baseUrl}/confirmation/checkin`}
            title="Check-in"
            description="Scannez ce QR code pour enregistrer votre arrivée ou retour de pause"
          />

          <QRCodeGenerator
            url={`${baseUrl}/confirmation/pause`}
            title="Pause"
            description="Scannez ce QR code pour enregistrer une pause"
          />

          <QRCodeGenerator
            url={`${baseUrl}/confirmation/checkout`}
            title="Check-out"
            description="Scannez ce QR code pour enregistrer votre départ"
          />
        </div>
      </div>
    </div>
  );
} 