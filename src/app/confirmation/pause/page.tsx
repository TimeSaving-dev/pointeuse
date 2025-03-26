"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

function PauseConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState<string>("Initialisation...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  // États pour la confirmation de retour de pause
  const [isAlreadyOnBreak, setIsAlreadyOnBreak] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [breakDuration, setBreakDuration] = useState<string>("");
  const [pauseStartTime, setPauseStartTime] = useState<string>("");
  
  const isProcessing = useRef(false); // Référence pour suivre si une requête est en cours
  const requestId = useRef(`frontend-pause-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`); // ID unique pour cette instance

  // Effet pour gérer le cycle de vie complet de la page
  useEffect(() => {
    console.log(`[${requestId.current}] INITIALISATION PAUSE FRONTEND - Session status: ${sessionStatus}`);
    
    // 1. Gestion de l'état de chargement de la session
    if (sessionStatus === "loading") {
      setStatus("Vérification de votre session...");
      return; // Sortir de l'effet et attendre que la session soit chargée
    }

    // 2. Si l'utilisateur n'est pas connecté, le rediriger
    if (sessionStatus === "unauthenticated") {
      console.log(`[${requestId.current}] Utilisateur non authentifié, redirection vers login`);
      setStatus("Redirection vers la page de connexion...");
      setError("Vous devez être connecté pour enregistrer une pause");
      
      // Rediriger après un court délai pour que l'utilisateur puisse voir le message
      const redirectTimer = setTimeout(() => {
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      }, 1500);
      
      return () => clearTimeout(redirectTimer);
    }

    // 3. Si l'utilisateur est authentifié, traiter la pause
    if (sessionStatus === "authenticated" && session?.user) {
      // Utiliser l'ID de l'URL uniquement en mode débogage ou en mode admin
      let userId = session.user.id;
      const userIdParam = searchParams.get("userId");
      if (userIdParam && (userIdParam.startsWith("debug-") || session.user.isAdmin)) {
        console.log(`[${requestId.current}] Utilisation de l'ID spécifié dans l'URL: ${userIdParam}`);
        userId = userIdParam;
      } else {
        console.log(`[${requestId.current}] Utilisation de l'ID de session: ${userId}`);
      }
      
      // Déclencher la pause
      handlePause(userId);
    }
  }, [session, sessionStatus, searchParams, router]);

  // Fonction pour envoyer la demande de pause
  async function handlePause(userId: string) {
    // Protection contre les appels multiples
    if (isProcessing.current) {
      console.log(`[${requestId.current}] BLOCAGE - Une requête de pause est déjà en cours de traitement`);
      return;
    }
    
    console.log(`[${requestId.current}] DÉBUT ENVOI PAUSE - ${new Date().toISOString()}`);
    isProcessing.current = true;
    
    try {
      if (!userId) {
        console.log(`[${requestId.current}] Erreur: Identifiant utilisateur manquant`);
        setError("Identifiant utilisateur manquant");
        setIsLoading(false);
        return;
      }

      // S'assurer que c'est un véritable ID d'utilisateur ou "anonymous"
      const effectiveUserId = userId || (session?.user?.id ? session.user.id : "anonymous");

      console.log(`[${requestId.current}] Envoi de la requête pause: userId=${effectiveUserId}, timestamp=${Date.now()}`);

      // D'abord, vérifier si l'utilisateur est déjà en pause
      const checkResponse = await fetch("/api/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": `${requestId.current}-check`, 
        },
        body: JSON.stringify({ 
          userId: effectiveUserId,
          checkForBreak: true
        }),
      });
      
      const checkData = await checkResponse.json();
      console.log(`[${requestId.current}] Vérification de l'état de pause: ${JSON.stringify(checkData)}`);
      
      // Si l'utilisateur est déjà en pause, afficher l'interface de confirmation plutôt que de traiter automatiquement
      if (checkData.userIsOnBreak) {
        console.log(`[${requestId.current}] Utilisateur déjà en pause depuis ${checkData.pauseStartTime}`);
        setIsAlreadyOnBreak(true);
        setPauseStartTime(checkData.pauseStartTime);
        setBreakDuration(checkData.breakDuration);
        setIsLoading(false);
        isProcessing.current = false;
        return;
      }
      
      // L'utilisateur n'est pas en pause, continuer avec la création d'une nouvelle pause
      console.log(`[${requestId.current}] Utilisateur non en pause, création d'une nouvelle pause`);
      
      // Envoyer les données avec l'identifiant utilisateur
      const response = await fetch("/api/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId.current,
        },
        body: JSON.stringify({ 
          userId: effectiveUserId,
          reason: "Pause standard"
        }),
      });

      const data = await response.json();
      console.log(`[${requestId.current}] Réponse reçue, status: ${response.status}, message: ${data.message || data.error}`);

      if (response.ok) {
        setSuccess(true);
        if (data.isReturnFromPause) {
          console.log(`[${requestId.current}] Retour de pause réussi: ${data.checkIn ? `id=${data.checkIn.id}` : 'Détails non disponibles'}`);
          setMessage(data.message || "Vous avez repris votre travail");
        } else {
          console.log(`[${requestId.current}] Pause réussie: ${data.pause ? `id=${data.pause.id}` : 'Détails non disponibles'}`);
          setMessage(data.message || "Pause enregistrée");
        }
      } else {
        // Gestion spécifique pour l'erreur d'utilisateur non trouvé
        if (response.status === 404) {
          console.log(`[${requestId.current}] Erreur 404: Utilisateur non trouvé`);
          setError("Erreur d'identification. Veuillez vous reconnecter.");
          
          // Proposer une redirection vers la page de login après 3 secondes
          setTimeout(() => {
            router.push("/auth/login?redirect=/confirmation/pause");
          }, 3000);
        } else {
          console.log(`[${requestId.current}] Erreur lors de la pause: ${data.error}`);
          setError(data.error || "Une erreur est survenue");
        }
      }
    } catch (error) {
      console.error(`[${requestId.current}] Exception lors de la pause:`, error);
      setError("Une erreur est survenue lors de la communication avec le serveur");
    } finally {
      console.log(`[${requestId.current}] FIN ENVOI PAUSE - ${new Date().toISOString()}`);
      setIsLoading(false);
      // Retarder la réinitialisation du flag processing pour éviter les doublons accidentels
      setTimeout(() => {
        isProcessing.current = false;
      }, 2000);
    }
  }
  
  // Fonction pour demander confirmation du retour de pause
  async function confirmReturnFromBreak() {
    console.log(`[${requestId.current}] Confirmation de retour de pause demandée`);
    setShowConfirmation(true);
  }

  // Fonction pour finaliser le retour de pause après confirmation
  async function finalizeReturnFromBreak() {
    console.log(`[${requestId.current}] Finalisation du retour de pause`);
    
    if (isProcessing.current) {
      return;
    }
    
    isProcessing.current = true;
    
    try {
      const response = await fetch("/api/pause", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId.current,
        },
        body: JSON.stringify({ 
          userId: session?.user?.id,
          returnFromBreak: true
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.isReturnFromPause) {
        console.log(`[${requestId.current}] Retour de pause réussi:`, data);
        setMessage(data.message || "Retour de pause enregistré");
        setSuccess(true);
        setIsAlreadyOnBreak(false);
        setShowConfirmation(false);
      } else {
        console.log(`[${requestId.current}] Erreur lors du retour de pause:`, data.error);
        setError(data.error || "Une erreur est survenue lors du retour de pause");
      }
    } catch (error) {
      console.error(`[${requestId.current}] Exception lors du retour de pause:`, error);
      setError("Une erreur est survenue lors de la communication avec le serveur");
    } finally {
      isProcessing.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {isAlreadyOnBreak && !showConfirmation ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Vous êtes actuellement en pause</h2>
            <p className="mb-4">Votre pause a commencé à {pauseStartTime}</p>
            <p className="mb-6">Durée actuelle: {breakDuration}</p>
            <button 
              onClick={confirmReturnFromBreak}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            >
              Terminer ma pause
            </button>
          </div>
        ) : showConfirmation ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Confirmer le retour de pause</h2>
            <p className="mb-4">Votre pause a duré {breakDuration}</p>
            <p className="mb-6">Voulez-vous confirmer votre retour au travail ?</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={finalizeReturnFromBreak}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
              >
                Oui, terminer la pause
              </button>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">
              {message ? (message.includes("repris") ? "✅ Retour enregistré" : "✅ Pause enregistrée") : error ? "❌ Erreur" : "⏳ Enregistrement en cours..."}
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
          </>
        )}
      </div>
    </div>
  );
}

export default function PauseConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <PauseConfirmationContent />
    </Suspense>
  );
} 