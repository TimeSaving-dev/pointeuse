"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";

// Import dynamique du composant QRCodeGenerator (côté client uniquement)
const QRCodeGenerator = dynamic(() => import("@/components/QRCodeGenerator"), {
  ssr: false,
});

export function QRCodeDisplay() {
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // Récupérer l'URL de base à partir du navigateur
    setBaseUrl(window.location.origin);
  }, []);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>QR Codes de Pointage</CardTitle>
        <CardDescription>
          Imprimez et affichez ces QR codes dans vos locaux pour permettre aux employés d&apos;enregistrer leurs entrées et sorties.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
        
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium mb-2 text-blue-800">Comment utiliser ces QR codes</h3>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Imprimez ces QR codes et placez-les à des endroits appropriés (entrée, salle de pause, etc.)</li>
            <li>Les utilisateurs peuvent les scanner avec leur téléphone pour enregistrer leurs heures</li>
            <li>Chaque scan redirige vers une page de confirmation spécifique</li>
            <li>Les données sont automatiquement enregistrées dans le système</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
} 