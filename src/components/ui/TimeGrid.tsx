import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { TimeSlot } from '@/services/appointmentService';
import { Clock } from 'lucide-react';
import { hapticFeedback } from '@/utils/haptics';

interface TimeGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export default function TimeGrid({ slots, selectedSlot, onSelectSlot }: TimeGridProps) {
  // Group slots by time of day
  const { morningSlots, afternoonSlots } = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    
    slots.forEach(slot => {
      const hour = parseISO(slot.date).getHours();
      if (hour < 12) {
        morning.push(slot);
      } else {
        afternoon.push(slot);
      }
    });
    
    return {
      morningSlots: morning,
      afternoonSlots: afternoon
    };
  }, [slots]);

  const renderTimeButton = (slot: TimeSlot) => {
    const time = format(parseISO(slot.date), 'HH:mm');
    const isSelected = selectedSlot?.date === slot.date;
    const isDisabled = !slot.available;
    
    return (
      <button
        key={slot.date}
        onClick={() => {
          if (!isDisabled) {
            hapticFeedback.light(); // Mobile haptic feedback
            onSelectSlot(slot);
          }
        }}
        disabled={isDisabled}
        className={`
          py-4 px-4 rounded-xl font-semibold text-lg transition-all duration-200
          min-h-[56px] w-full
          ${isSelected 
            ? 'bg-purple-600 text-white shadow-md scale-105' 
            : isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-50 border-2 border-purple-200 text-purple-700 hover:bg-purple-100 hover:scale-105 hover:shadow-md'
          }
        `}
        aria-label={`${time} ${isDisabled ? 'nicht verfügbar' : 'verfügbar'}`}
      >
        {time}
      </button>
    );
  };

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Keine Termine an diesem Tag verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Morning Slots */}
      {morningSlots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <p className="text-sm font-medium text-gray-600">Vormittag</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {morningSlots.map(renderTimeButton)}
          </div>
        </div>
      )}
      
      {/* Afternoon Slots */}
      {afternoonSlots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-medium text-gray-600">Nachmittag</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {afternoonSlots.map(renderTimeButton)}
          </div>
        </div>
      )}
    </div>
  );
}

