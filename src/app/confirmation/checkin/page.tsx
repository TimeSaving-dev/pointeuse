"use client";

import { useState, useEffect, Suspense, useRef } from "react";
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
  const [userIsOnBreak, setUserIsOnBreak] = useState(false);
  const [pauseMessage, setPauseMessage] = useState("");
  const isProcessing = useRef(false); // Référence pour suivre si une requête est en cours
  const requestId = useRef(`frontend-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`); // ID unique pour cette instance

  useEffect(() => {
    console.log(`[${requestId.current}] INITIALISATION FRONTEND - Session status: ${sessionStatus}`);
    
    // Si la session est en cours de chargement, attendre
    if (sessionStatus === "loading") {
      setStatus("Vérification de votre session...");
      return;
    }

    // Vérifier si l'utilisateur est connecté
    if (sessionStatus === "authenticated" && session?.user?.id) {
      // Stocker l'ID de l'utilisateur connecté
      setUserId(session.user.id);
      console.log(`[${requestId.current}] Utilisateur authentifié: ${session.user.name || session.user.email} (ID: ${session.user.id})`);
      
      // Continuer avec la géolocalisation et le check-in
      startGeolocation();
    } else if (sessionStatus === "unauthenticated") {
      // Rediriger automatiquement vers la page de connexion
      console.log(`[${requestId.current}] Utilisateur non authentifié, redirection vers login`);
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
    console.log(`[${requestId.current}] DÉMARRAGE GÉOLOCALISATION`);
    
    // Utiliser l'ID de l'URL uniquement en mode débogage ou en mode admin
    const userIdParam = searchParams.get("userId");
    if (userIdParam && (userIdParam.startsWith("debug-") || session?.user?.isAdmin)) {
      console.log(`[${requestId.current}] Utilisation de l'ID spécifié dans l'URL: ${userIdParam}`);
      setUserId(userIdParam);
    }

    // Vérifier si la géolocalisation est disponible
    if (!navigator.geolocation) {
      console.log(`[${requestId.current}] Géolocalisation non supportée par le navigateur`);
      setStatus("La géolocalisation n'est pas prise en charge par votre navigateur");
      // Continuer sans géolocalisation
      handleCheckin({});
      return;
    }

    function success(position: GeolocationPosition) {
      console.log(`[${requestId.current}] Position obtenue: lat=${position.coords.latitude}, long=${position.coords.longitude}`);
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
      console.log(`[${requestId.current}] Échec d'obtention de la position`);
      setStatus("Impossible d'obtenir votre position");
      // Continuer sans géolocalisation
      handleCheckin({});
    }

    setStatus("Obtention de votre position...");
    navigator.geolocation.getCurrentPosition(success, error);
  };

  // Fonction pour envoyer les données au serveur
  async function handleCheckin(geoData: Partial<GeolocationCoordinates> = {}) {
    // Protection contre les appels multiples
    if (isProcessing.current) {
      console.log(`[${requestId.current}] BLOCAGE - Une requête est déjà en cours de traitement`);
      return;
    }
    
    console.log(`[${requestId.current}] DÉBUT ENVOI CHECK-IN - ${new Date().toISOString()}`);
    isProcessing.current = true;
    
    try {
      // Si l'utilisateur n'est pas connecté, abandonner
      if (sessionStatus === "unauthenticated") {
        console.log(`[${requestId.current}] Abandon car utilisateur non authentifié`);
        setError("Vous devez être connecté pour effectuer un check-in");
        setIsLoading(false);
        return;
      }

      // S'assurer que l'ID utilisateur est disponible
      if (!userId && sessionStatus === "authenticated" && session?.user?.id) {
        console.log(`[${requestId.current}] Récupération de l'ID depuis la session: ${session.user.id}`);
        setUserId(session.user.id);
      }

      // Ajouter l'ID utilisateur aux données
      const requestData = {
        ...geoData,
        userId: userId || (session?.user?.id ? session.user.id : "anonymous"),
      };

      console.log(`[${requestId.current}] Envoi de la requête check-in: userId=${requestData.userId}, timestamp=${Date.now()}`);

      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId.current, // Ajouter l'ID de requête frontend dans les headers
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log(`[${requestId.current}] Réponse reçue, status: ${response.status}, message: ${data.message || data.error}`);

      if (response.ok) {
        console.log(`[${requestId.current}] Check-in réussi: ${data.checkIn ? `id=${data.checkIn.id}` : 'Détails non disponibles'}`);
        setStatus(data.message || "Check-in réussi");
        setSuccess(true);
      } else {
        // Gestion spécifique pour l'erreur d'utilisateur en pause
        if (response.status === 400 && data.userIsOnBreak) {
          console.log(`[${requestId.current}] Utilisateur en pause, check-in refusé`);
          setStatus("Vous êtes actuellement en pause");
          setError(data.message || "Pour reprendre votre travail, veuillez scanner le QR code PAUSE");
          setUserIsOnBreak(true);
          setPauseMessage(data.message || "Pour reprendre votre travail, veuillez scanner le QR code PAUSE");
          
          // Ne pas rediriger automatiquement, l'utilisateur doit scanner le bon QR code
        }
        // Gestion spécifique pour l'erreur d'utilisateur non trouvé
        else if (response.status === 404) {
          console.log(`[${requestId.current}] Erreur 404: Utilisateur non trouvé`);
          setStatus("Erreur d'identification. Veuillez vous reconnecter.");
          setError("Erreur d'identification. Veuillez vous reconnecter.");
          
          // Proposer une redirection vers la page de login après 3 secondes
          setTimeout(() => {
            router.push("/auth/login?redirect=/confirmation/checkin");
          }, 3000);
        } else {
          console.log(`[${requestId.current}] Erreur lors du check-in: ${data.error}`);
          setStatus(data.error || "Erreur lors du check-in");
          setError(data.error || "Erreur lors du check-in");
        }
      }
    } catch (err) {
      console.error(`[${requestId.current}] Exception lors du check-in:`, err);
      setStatus("Erreur lors de la communication avec le serveur");
      setError("Erreur lors de la communication avec le serveur");
    } finally {
      console.log(`[${requestId.current}] FIN ENVOI CHECK-IN - ${new Date().toISOString()}`);
      setIsLoading(false);
      // Retarder la réinitialisation du flag processing pour éviter les doublons accidentels
      setTimeout(() => {
        isProcessing.current = false;
      }, 2000);
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
        
        {/* Message spécial pour les utilisateurs en pause */}
        {userIsOnBreak && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {pauseMessage}
                </p>
                <p className="text-sm text-yellow-700 mt-2 font-semibold">
                  Veuillez utiliser le QR code PAUSE pour finaliser votre retour de pause.
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Link href="/confirmation/pause" className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded">
                Confirmer mon retour de pause
              </Link>
            </div>
          </div>
        )}
        
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