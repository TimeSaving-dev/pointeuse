"use client";

import React, { useState } from 'react';

// Types pour les demandes
interface RequestBase {
  id: string;
  type: 'absence' | 'congés';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  updatedAt?: string;
}

interface AbsenceRequest extends RequestBase {
  type: 'absence';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

interface HolidayRequest extends RequestBase {
  type: 'congés';
  periods: {
    startDate: string;
    endDate: string;
    days: number;
  }[];
  totalDays: number;
}

type Request = AbsenceRequest | HolidayRequest;

// Exemple de données (à remplacer par des données réelles plus tard)
const SAMPLE_REQUESTS: Request[] = [
  {
    id: '1',
    type: 'absence',
    status: 'pending',
    submittedAt: '2023-04-15T10:30:00Z',
    startDate: '2023-05-10',
    endDate: '2023-05-12',
    days: 3,
    reason: 'maladie'
  },
  {
    id: '2',
    type: 'absence',
    status: 'approved',
    submittedAt: '2023-04-01T09:15:00Z',
    updatedAt: '2023-04-02T14:20:00Z',
    startDate: '2023-04-20',
    endDate: '2023-04-20',
    days: 1,
    reason: 'médecin'
  },
  {
    id: '3',
    type: 'congés',
    status: 'rejected',
    submittedAt: '2023-03-25T11:45:00Z',
    updatedAt: '2023-03-27T16:30:00Z',
    periods: [
      {
        startDate: '2023-07-10',
        endDate: '2023-07-20',
        days: 11
      },
      {
        startDate: '2023-08-05',
        endDate: '2023-08-10',
        days: 6
      }
    ],
    totalDays: 17
  },
  {
    id: '4',
    type: 'congés',
    status: 'approved',
    submittedAt: '2023-04-10T08:00:00Z',
    updatedAt: '2023-04-12T10:15:00Z',
    periods: [
      {
        startDate: '2023-06-15',
        endDate: '2023-06-30',
        days: 16
      }
    ],
    totalDays: 16
  }
];

export default function RequestsTable() {
  const [requests] = useState<Request[]>(SAMPLE_REQUESTS);
  const [filter, setFilter] = useState<'all' | 'absence' | 'congés'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Filtrer les demandes
  const filteredRequests = requests.filter(request => {
    const typeMatch = filter === 'all' || request.type === filter;
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    return typeMatch && statusMatch;
  });

  // Utilitaires de formatage
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const reasonLabels: Record<string, string> = {
    'maladie': 'Maladie',
    'familiale': 'Raison familiale',
    'medecin': 'Rendez-vous médical',
    'enfant': 'Enfant malade',
    'autre': 'Autre'
  };

  // Styles pour les badges de statut
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  const statusLabels = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Refusé"
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-900">Mes demandes</div>
      
      {/* Filtres */}
      <div className="flex flex-wrap gap-4 pb-4">
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            id="type-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">Tous les types</option>
            <option value="absence">Absences</option>
            <option value="congés">Congés</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Refusés</option>
          </select>
        </div>
      </div>
      
      {/* Tableau des demandes */}
      <div className="mt-4 overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Détails
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jours
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Soumission
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune demande trouvée
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.type === 'absence' ? 'Absence' : 'Congés'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.type === 'absence' ? (
                      <>
                        Du {formatDate(request.startDate)} au {formatDate(request.endDate)}
                      </>
                    ) : (
                      <div className="space-y-1">
                        {request.periods.map((period, index) => (
                          <div key={index}>
                            Du {formatDate(period.startDate)} au {formatDate(period.endDate)}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.type === 'absence' && (
                      <>{reasonLabels[request.reason] || request.reason}</>
                    )}
                    {request.type === 'congés' && (
                      <>{request.periods.length} période{request.periods.length > 1 ? 's' : ''}</>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.type === 'absence' ? request.days : request.totalDays} jour{(request.type === 'absence' ? request.days : request.totalDays) > 1 ? 's' : ''}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Soumis le {formatDateTime(request.submittedAt)}</div>
                    {request.updatedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        Mise à jour le {formatDateTime(request.updatedAt)}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 