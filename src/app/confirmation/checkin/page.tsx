"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

function CheckinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState("Initialisation...");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si la session est en cours de chargement, attendre
    if (sessionStatus === "loading") {
      setStatus("Vérification de votre session...");
      return;
    }

    // Vérifier si l'utilisateur est connecté
    if (sessionStatus === "authenticated" && session?.user?.id) {
      // Stocker l'ID de l'utilisateur connecté
      setUserId(session.user.id);
      console.log("Utilisateur authentifié:", session.user.name || session.user.email);
      
      // Continuer avec la géolocalisation et le check-in
      startGeolocation();
    } else if (sessionStatus === "unauthenticated") {
      // Rediriger automatiquement vers la page de connexion
      setStatus("Redirection vers la page de connexion...");
      setError("Vous devez être connecté pour effectuer un check-in");
      
      // Rediriger après un court délai pour que l'utilisateur puisse voir le message
      setTimeout(() => {
        router.push("/auth/login?redirect=/confirmation/checkin");
      }, 1500);
    }
  }, [session, sessionStatus, searchParams, router]);

  // Fonction pour démarrer la géolocalisation
  const startGeolocation = () => {
    // Utiliser l'ID de l'URL uniquement en mode débogage ou en mode admin
    const userIdParam = searchParams.get("userId");
    if (userIdParam && (userIdParam.startsWith("debug-") || session?.user?.isAdmin)) {
      setUserId(userIdParam);
    }

    // Vérifier si la géolocalisation est disponible
    if (!navigator.geolocation) {
      setStatus("La géolocalisation n'est pas prise en charge par votre navigateur");
      // Continuer sans géolocalisation
      handleCheckin({});
      return;
    }

    function success(position: GeolocationPosition) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const altitude = position.coords.altitude;
      const altitudeAccuracy = position.coords.altitudeAccuracy;
      const heading = position.coords.heading;
      const speed = position.coords.speed;
      const timestamp = position.timestamp;

      setStatus("Position obtenue");

      // Envoyer les données au serveur
      handleCheckin(position.coords);
    }

    function error() {
      setStatus("Impossible d'obtenir votre position");
      // Continuer sans géolocalisation
      handleCheckin({});
    }

    setStatus("Obtention de votre position...");
    navigator.geolocation.getCurrentPosition(success, error);
  };

  // Fonction pour envoyer les données au serveur
  async function handleCheckin(geoData: Partial<GeolocationCoordinates> = {}) {
    try {
      // Si l'utilisateur n'est pas connecté, abandonner
      if (sessionStatus === "unauthenticated") {
        setError("Vous devez être connecté pour effectuer un check-in");
        setIsLoading(false);
        return;
      }

      // S'assurer que l'ID utilisateur est disponible
      if (!userId && sessionStatus === "authenticated" && session?.user?.id) {
        setUserId(session.user.id);
      }

      // Ajouter l'ID utilisateur aux données
      const requestData = {
        ...geoData,
        userId: userId || (session?.user?.id ? session.user.id : "anonymous"),
      };

      console.log("Envoi des données de check-in avec ID utilisateur:", requestData.userId);

      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(data.message || "Check-in réussi");
        setSuccess(true);
      } else {
        // Gestion spécifique pour l'erreur d'utilisateur non trouvé
        if (response.status === 404) {
          setStatus("Erreur d'identification. Veuillez vous reconnecter.");
          setError("Erreur d'identification. Veuillez vous reconnecter.");
          
          // Proposer une redirection vers la page de login après 3 secondes
          setTimeout(() => {
            router.push("/auth/login?redirect=/confirmation/checkin");
          }, 3000);
        } else {
          setStatus(data.error || "Erreur lors du check-in");
          setError(data.error || "Erreur lors du check-in");
        }
      }
    } catch (err) {
      setStatus("Erreur lors de la communication avec le serveur");
      setError("Erreur lors de la communication avec le serveur");
      console.error("Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mt-4 mb-2">
          <h2 className="text-2xl font-bold">
            {success ? "✅ Check-in réussi" : error !== "" ? "❌ Erreur" : "⏳ Check-in en cours"}
          </h2>
        </div>
        
        <p className="text-center mb-6">{status}</p>
        
        <div className="flex justify-center">
          {sessionStatus === "unauthenticated" ? (
            <Link href="/auth/login?redirect=/confirmation/checkin" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
              Se connecter
            </Link>
          ) : (
            <Link href="/" className="text-blue-600 hover:underline">
              Retour à l'accueil
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CheckinContent />
    </Suspense>
  );
} 