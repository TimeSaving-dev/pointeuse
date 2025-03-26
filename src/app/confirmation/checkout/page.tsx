"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("Initialisation...");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Effet pour gérer le cycle de vie complet de la page
  useEffect(() => {
    // 1. Gestion de l'état de chargement de la session
    if (sessionStatus === "loading") {
      setStatus("Vérification de votre session...");
      return; // Sortir de l'effet et attendre que la session soit chargée
    }

    // 2. Si l'utilisateur n'est pas connecté, le rediriger
    if (sessionStatus === "unauthenticated") {
      setStatus("Redirection vers la page de connexion...");
      setError("Vous devez être connecté pour effectuer un check-out");
      
      // Rediriger après un court délai pour que l'utilisateur puisse voir le message
      const redirectTimer = setTimeout(() => {
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }

    // 3. Si l'utilisateur est authentifié, démarrer la géolocalisation
    if (sessionStatus === "authenticated" && session?.user) {
      // Utiliser l'ID de l'URL uniquement en mode débogage ou en mode admin
      let userId = session.user.id;
      const userIdParam = searchParams.get("userId");
      if (userIdParam && (userIdParam.startsWith("debug-") || session.user.isAdmin)) {
        userId = userIdParam;
      }
      
      // Démarrer la géolocalisation
      geoFindMe(userId);
    }
  }, [session, sessionStatus, searchParams, router]);

  function geoFindMe(userId: string) {
    setStatus("Récupération de votre position...");
    
    function success(position: GeolocationPosition) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      setStatus("Position récupérée, enregistrement du check-out...");
      
      // Envoyer les données au serveur
      handleCheckout(userId, {
        latitude,
        longitude,
        accuracy
      });
    }
    
    function error() {
      setStatus("Impossible de récupérer votre position");
      // Continuer sans géolocalisation
      handleCheckout(userId);
    }
    
    if (!navigator.geolocation) {
      setStatus("La géolocalisation n'est pas supportée par votre navigateur");
      handleCheckout(userId);
    } else {
      navigator.geolocation.getCurrentPosition(success, error);
    }
  }

  async function handleCheckout(userId: string, geoData: Partial<GeolocationCoordinates> = {}) {
    try {
      if (!userId) {
        setError("Identifiant utilisateur manquant");
        setIsLoading(false);
        return;
      }

      // S'assurer que c'est un véritable ID d'utilisateur ou "anonymous"
      const effectiveUserId = userId || (session?.user?.id ? session.user.id : "anonymous");

      console.log("Envoi des données de check-out avec userId:", effectiveUserId);

      // Envoyer les données avec l'identifiant utilisateur et les données de géolocalisation
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...geoData,
          userId: effectiveUserId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Check-out enregistré");
      } else {
        // Gestion spécifique pour l'erreur d'utilisateur non trouvé
        if (response.status === 404) {
          setError("Erreur d'identification. Veuillez vous reconnecter.");
          
          // Proposer une redirection vers la page de login après 3 secondes
          setTimeout(() => {
            router.push("/auth/login?redirect=/confirmation/checkout");
          }, 3000);
        } else {
          setError(data.error || "Une erreur est survenue");
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Une erreur est survenue lors de la communication avec le serveur");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {message ? "✅ Check-out réussi" : error ? "❌ Erreur" : "⏳ Check-out en cours..."}
        </h1>
        
        <p className="text-center mb-6">{message || error || status}</p>
        
        <div className="flex justify-center">
          {sessionStatus === "unauthenticated" ? (
            <Link href={`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
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

export default function CheckoutConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <CheckoutContent />
    </Suspense>
  );
} 