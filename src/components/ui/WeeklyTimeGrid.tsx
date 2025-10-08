import React from 'react';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TimeSlot } from '@/services/appointmentService';

interface WeeklyTimeGridProps {
  availableSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onLoadMore: () => void;
  loading?: boolean;
}

export default function WeeklyTimeGrid({ 
  availableSlots, 
  selectedSlot,
  onSelectSlot, 
  onLoadMore,
  loading 
}: WeeklyTimeGridProps) {
  // Group slots by day
  const slotsByDay = availableSlots.reduce((acc, slot) => {
    const dayKey = startOfDay(parseISO(slot.date)).toISOString();
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Get sorted days
  const days = Object.keys(slotsByDay).sort();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {days.map((dayKey) => {
          const daySlots = slotsByDay[dayKey];
          const date = parseISO(dayKey);
          
          return (
            <div key={dayKey} className="space-y-2">
              <div className="text-center pb-2 border-b border-gray-200">
                <p className="text-xs font-medium text-psychText/60">
                  {format(date, 'EEE', { locale: de })}
                </p>
                <p className="text-sm font-semibold text-psychText">
                  {format(date, 'dd. MMM', { locale: de })}
                </p>
              </div>
              <div className="space-y-1">
                {daySlots
                  .filter(slot => slot.available)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((slot) => {
                    const isSelected = selectedSlot?.date === slot.date;
                    return (
                      <Button
                        key={slot.date}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full text-xs py-1.5",
                          isSelected 
                            ? "bg-psychPurple text-white border-psychPurple hover:bg-psychPurple/90" 
                            : "border-psychPurple/20 text-psychText hover:border-psychPurple hover:bg-psychPurple/5"
                        )}
                        onClick={() => onSelectSlot(slot)}
                      >
                        {format(parseISO(slot.date), 'HH:mm', { locale: de })}
                      </Button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center pt-4">
        <Button 
          variant="ghost" 
          onClick={onLoadMore}
          disabled={loading}
          className="text-psychPurple hover:text-psychPurple/80 hover:bg-psychPurple/5"
        >
          MEHR TERMINE ANZEIGEN
        </Button>
      </div>
    </div>
  );
}
