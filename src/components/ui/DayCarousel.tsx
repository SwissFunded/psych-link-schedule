import React, { useMemo, useRef, useEffect } from 'react';
import { format, parseISO, isSameDay, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TimeSlot } from '@/services/appointmentService';
import DayPill from './DayPill';
import TimeGrid from './TimeGrid';

interface DayCarouselProps {
  availableSlots: TimeSlot[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onSelectSlot: (slot: TimeSlot) => void;
  selectedSlot: TimeSlot | null;
  loading?: boolean;
  onLoadMore?: () => void;
}

export default function DayCarousel({
  availableSlots,
  selectedDate,
  onSelectDate,
  onSelectSlot,
  selectedSlot,
  loading = false,
  onLoadMore
}: DayCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Group slots by day and count availability
  const dayGroups = useMemo(() => {
    const groups = new Map<string, { date: Date; slots: TimeSlot[]; availableCount: number }>();
    
    availableSlots.forEach(slot => {
      const slotDate = parseISO(slot.date);
      const dayKey = format(slotDate, 'yyyy-MM-dd');
      
      if (!groups.has(dayKey)) {
        groups.set(dayKey, {
          date: startOfDay(slotDate),
          slots: [],
          availableCount: 0
        });
      }
      
      const group = groups.get(dayKey)!;
      group.slots.push(slot);
      if (slot.available) {
        group.availableCount++;
      }
    });
    
    // Convert to array and sort by date
    return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [availableSlots]);

  // Get slots for selected day
  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const group = dayGroups.find(g => isSameDay(g.date, selectedDate));
    return group?.slots || [];
  }, [selectedDate, dayGroups]);

  // Scroll functions
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll selected day into view
  useEffect(() => {
    if (carouselRef.current && selectedDate) {
      const selectedIndex = dayGroups.findIndex(g => isSameDay(g.date, selectedDate));
      if (selectedIndex !== -1) {
        const pillWidth = 116; // min-w-[100px] + padding + gap
        const scrollPosition = selectedIndex * pillWidth - (carouselRef.current.clientWidth / 2) + (pillWidth / 2);
        carouselRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedDate, dayGroups]);

  if (dayGroups.length === 0 && !loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-lg">
        <p className="text-gray-500">Keine verfügbaren Termine gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Carousel */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center gap-2">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 hidden sm:block"
            aria-label="Vorherige Tage"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Scrollable Day Pills */}
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto pb-2 flex-1 scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {dayGroups.map((group) => (
              <DayPill
                key={format(group.date, 'yyyy-MM-dd')}
                date={group.date}
                availableCount={group.availableCount}
                isSelected={selectedDate ? isSameDay(group.date, selectedDate) : false}
                onClick={() => onSelectDate(group.date)}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 hidden sm:block"
            aria-label="Nächste Tage"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Load More Button */}
        {onLoadMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Lädt...' : 'MEHR TERMINE ANZEIGEN'}
          </button>
        )}
      </div>

      {/* Selected Day Info + Time Grid */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6">
            {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
          </h3>
          
          <TimeGrid
            slots={slotsForSelectedDay}
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
          />
        </div>
      )}
    </div>
  );
}

