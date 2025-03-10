"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  title: string;
  description: string;
}

export default function QRCodeGenerator({
  url,
  size = 200,
  title,
  description,
}: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error("Erreur lors de la génération du QR code:", error);
      }
    };

    generateQRCode();
  }, [url, size]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        <div className="mt-4 p-4 border border-gray-200 rounded-md flex items-center justify-center">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt={`QR Code pour ${title}`}
              width={size}
              height={size}
            />
          ) : (
            <div
              className="bg-gray-100 flex items-center justify-center"
              style={{ width: size, height: size }}
            >
              <p className="text-gray-400">Chargement...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 