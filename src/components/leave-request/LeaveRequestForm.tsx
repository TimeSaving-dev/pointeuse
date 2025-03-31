"use client";

import React, { useState, useEffect } from 'react';

export default function LeaveRequestForm() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [status] = useState("pending");
  const [dateError, setDateError] = useState("");
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

  // Validation des dates
  const validateDates = (start, end) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (endDate < startDate) {
        setDateError("La date de fin doit être postérieure à la date de début.");
        return false;
      }
    }
    setDateError("");
    return true;
  };

  // Gestionnaire de changement de date de début
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    validateDates(newStartDate, endDate);

    // Si la date de fin est antérieure à la nouvelle date de début, on la réinitialise
    if (endDate && new Date(endDate) < new Date(newStartDate)) {
      setEndDate("");
    }
  };

  // Gestionnaire de changement de date de fin
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    validateDates(startDate, newEndDate);
  };

  // Calcul du nombre de jours
  const calculateDays = () => {
    if (!startDate || !endDate || dateError) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Vérifier que les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    // Calculer la différence en jours
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
    
    return diffDays;
  };

  const dayCount = calculateDays();

  // Gestionnaire de soumission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateDates(startDate, endDate)) {
      return;
    }

    // Ici, on pourrait ajouter la logique pour soumettre la demande
    console.log("Demande soumise:", { startDate, endDate, reason, days: dayCount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="text-xl font-semibold text-gray-900">Demande d'absence</div>
      
      {/* Sélection des dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date de début</label>
          <div className="relative">
            <input 
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
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
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || minDate}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </div>
      
      {/* Message d'erreur pour les dates */}
      {dateError && (
        <div className="text-red-500 text-sm mt-1">
          {dateError}
        </div>
      )}
      
      {/* Compteur de jours */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Nombre de jours</label>
        <div className="w-full md:w-1/4 rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50">
          {dayCount > 0 ? `${dayCount} jour${dayCount > 1 ? 's' : ''}` : 'Sélectionnez les dates'}
        </div>
      </div>
      
      {/* Raison d'absence */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Raison de l'absence</label>
        <select 
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="">Sélectionner une raison</option>
          <option value="maladie">Maladie</option>
          <option value="familiale">Raison familiale</option>
          <option value="medecin">Rendez-vous médical</option>
          <option value="enfant">Enfant malade</option>
          <option value="autre">Autre</option>
        </select>
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
          disabled={!startDate || !endDate || !reason || dateError !== ""}
        >
          Soumettre la demande
        </button>
      </div>
    </form>
  );
} 