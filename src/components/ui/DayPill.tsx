import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DayPillProps {
  date: Date;
  availableCount: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function DayPill({ date, availableCount, isSelected, onClick }: DayPillProps) {
  const dayAbbr = format(date, 'EEE', { locale: de }).toUpperCase().slice(0, 2);
  const dateStr = format(date, 'd. MMM', { locale: de });
  
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 rounded-xl px-6 py-4 cursor-pointer transition-all duration-200
        min-w-[100px] min-h-[88px]
        ${isSelected 
          ? 'bg-purple-600 text-white shadow-lg scale-105' 
          : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-purple-300 hover:shadow-md'
        }
      `}
      aria-label={`${dateStr}, ${availableCount} verfügbare Termine`}
      aria-pressed={isSelected}
    >
      <p className={`text-xs font-medium mb-1 ${isSelected ? 'text-purple-200' : 'text-gray-500'}`}>
        {dayAbbr}
      </p>
      <p className="text-lg font-bold">{dateStr}</p>
      <p className={`text-xs font-medium mt-1 ${isSelected ? 'text-purple-200' : 'text-green-600'}`}>
        {availableCount} frei
      </p>
    </button>
  );
}

