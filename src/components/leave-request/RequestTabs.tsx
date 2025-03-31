"use client";

import { useState } from 'react';
import LeaveRequestForm from './LeaveRequestForm';
import HolidayRequestForm from './HolidayRequestForm';

export default function RequestTabs() {
  const [activeTab, setActiveTab] = useState<'leave' | 'holiday'>('leave');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('leave')}
            className={`
              w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm
              ${activeTab === 'leave'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Demande d'absence
          </button>
          <button
            onClick={() => setActiveTab('holiday')}
            className={`
              w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm
              ${activeTab === 'holiday'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Demande de congés
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'leave' ? (
          <LeaveRequestForm />
        ) : (
          <HolidayRequestForm />
        )}
      </div>
    </div>
  );
} 