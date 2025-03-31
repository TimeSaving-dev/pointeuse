"use client";

import React, { useState, useEffect } from 'react';

interface DatePeriod {
  id: string;
  startDate: string;
  endDate: string;
  error?: string;
}

export default function HolidayRequestForm() {
  const [periods, setPeriods] = useState<DatePeriod[]>([
    { id: '1', startDate: '', endDate: '' }
  ]);
  const [status] = useState("pending");
  const [globalError, setGlobalError] = useState("");
  const [minDate, setMinDate] = useState("");

  // Initialiser la date minimum (aujourd'hui) au format YYYY-MM-DD
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setMinDate(formattedDate);
  }, []);

  // Statut de la demande - styles
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  const statusDotStyles = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500"
  };

  const statusLabels = {
    pending: "En attente d'approbation",
    approved: "Approuvé",
    rejected: "Refusé"
  };

  // Vérifier le chevauchement des périodes
  const checkOverlap = (periods: DatePeriod[]): boolean => {
    let hasOverlap = false;
    
    // Créer des périodes avec des dates valides uniquement
    const validPeriods = periods
      .filter(p => p.startDate && p.endDate)
      .map(p => ({
        ...p,
        startObj: new Date(p.startDate),
        endObj: new Date(p.endDate)
      }));
    
    // Vérifier les chevauchements
    for (let i = 0; i < validPeriods.length; i++) {
      for (let j = i + 1; j < validPeriods.length; j++) {
        const a = validPeriods[i];
        const b = validPeriods[j];
        
        // Vérifier si les périodes se chevauchent
        if (
          (a.startObj <= b.endObj && a.endObj >= b.startObj) ||
          (b.startObj <= a.endObj && b.endObj >= a.startObj)
        ) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) break;
    }
    
    return hasOverlap;
  };

  // Valider toutes les périodes
  const validateAllPeriods = () => {
    let isValid = true;
    const updatedPeriods = periods.map(period => {
      const { startDate, endDate } = period;
      let error = '';
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
          error = "La date de fin doit être postérieure à la date de début";
          isValid = false;
        }
      }
      
      return { ...period, error };
    });
    
    // Vérifier les chevauchements
    if (isValid && checkOverlap(updatedPeriods)) {
      setGlobalError("Attention: certaines périodes se chevauchent!");
      isValid = false;
    } else {
      setGlobalError("");
    }
    
    setPeriods(updatedPeriods);
    return isValid;
  };

  // Calcul du nombre de jours pour une période
  const calculateDays = (startDate: string, endDate: string, error?: string) => {
    if (!startDate || !endDate || error) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Vérifier que les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    // Calculer la différence en jours
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
    
    return diffDays;
  };

  // Ajouter une nouvelle période
  const addPeriod = () => {
    setPeriods([
      ...periods, 
      { id: `${periods.length + 1}`, startDate: '', endDate: '' }
    ]);
  };

  // Supprimer une période
  const removePeriod = (id: string) => {
    if (periods.length <= 1) return; // Garder au moins une période
    setPeriods(periods.filter(period => period.id !== id));
    
    // Recalculer les erreurs après suppression
    setTimeout(validateAllPeriods, 0);
  };

  // Mettre à jour une période et valider
  const updatePeriod = (id: string, field: 'startDate' | 'endDate', value: string) => {
    setPeriods(periods.map(period => {
      if (period.id === id) {
        // Si on change la date de début et qu'elle est postérieure à la date de fin
        // on réinitialise la date de fin
        if (field === 'startDate' && period.endDate && new Date(value) > new Date(period.endDate)) {
          return { ...period, [field]: value, endDate: '' };
        }
        return { ...period, [field]: value };
      }
      return period;
    }));
    
    // Valider après mise à jour
    setTimeout(validateAllPeriods, 0);
  };

  // Calculer le total des jours
  const totalDays = periods.reduce((sum, period) => {
    return sum + calculateDays(period.startDate, period.endDate, period.error);
  }, 0);

  // Gestionnaire de soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAllPeriods()) {
      return;
    }

    // Ici, on pourrait ajouter la logique pour soumettre la demande
    console.log("Demande de congés soumise:", { periods, totalDays });
  };

  // Vérifier si le formulaire est valide pour la soumission
  const isFormValid = (): boolean => {
    // Vérifier si toutes les périodes ont des dates valides
    const allPeriodsValid = periods.every(period => 
      period.startDate && 
      period.endDate && 
      !period.error
    );
    
    return allPeriodsValid && !globalError;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="text-xl font-semibold text-gray-900">Demande de congés</div>
      
      {/* Message d'erreur global */}
      {globalError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{globalError}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Périodes de congés */}
      <div className="space-y-6">
        {periods.map((period) => (
          <div key={period.id} className={`p-4 border rounded-md ${period.error ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium text-gray-700">Période {period.id}</h3>
              <button 
                onClick={() => removePeriod(period.id)}
                className="text-gray-400 hover:text-gray-500"
                type="button"
              >
                <span className="sr-only">Supprimer</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date de début</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={period.startDate}
                    onChange={(e) => updatePeriod(period.id, 'startDate', e.target.value)}
                    min={minDate}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date de fin</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={period.endDate}
                    onChange={(e) => updatePeriod(period.id, 'endDate', e.target.value)}
                    min={period.startDate || minDate}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Message d'erreur pour la période */}
            {period.error && (
              <div className="text-red-500 text-sm mt-2">
                {period.error}
              </div>
            )}
            
            <div className="mt-3">
              <span className="text-sm text-gray-500">
                {calculateDays(period.startDate, period.endDate, period.error) > 0 
                  ? `${calculateDays(period.startDate, period.endDate, period.error)} jour${calculateDays(period.startDate, period.endDate, period.error) > 1 ? 's' : ''}` 
                  : 'Sélectionnez les dates'}
              </span>
            </div>
          </div>
        ))}
        
        {/* Bouton d'ajout de période */}
        <button 
          onClick={addPeriod}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          type="button"
        >
          <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Ajouter une période
        </button>
      </div>
      
      {/* Total jours */}
      <div className="p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total des jours de congés</span>
          <span className="font-medium text-gray-900">{totalDays} jour{totalDays > 1 ? 's' : ''}</span>
        </div>
      </div>
      
      {/* Statut de la demande */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Statut de la demande</label>
        <div className="flex items-center">
          <span className={`inline-flex items-center rounded-full ${statusStyles[status]} px-3 py-1 text-sm font-medium`}>
            <span className={`mr-1.5 h-2 w-2 rounded-full ${statusDotStyles[status]}`}></span>
            {statusLabels[status]}
          </span>
        </div>
      </div>
      
      {/* Bouton de soumission */}
      <div className="pt-4">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={!isFormValid()}
        >
          Soumettre la demande de congés
        </button>
      </div>
    </form>
  );
} 