import { parseICSFile, isTimeSlotAvailable, ICSEvent } from '@/utils/icsParser';
import { TimeSlot } from './appointmentService';
import { parseISO, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// Cache for calendar data
interface CalendarCache {
  data: ICSEvent[];
  timestamp: number;
}

const calendarCache: Record<string, CalendarCache> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchCalendarViaEdgeFunction(
  therapistId: string, 
  feedType: 'appointment' | 'epat'
): Promise<ICSEvent[]> {
  try {
    console.log(`[Calendar] Fetching ${feedType} for ${therapistId} via Edge Function`);
    
    const { data, error } = await supabase.functions.invoke('fetch-calendar', {
      body: { therapistId, feedType }
    });

    if (error) {
      console.error(`[Calendar] Edge Function error for ${feedType}:`, error);
      return [];
    }

    if (!data || !data.icsData) {
      console.error(`[Calendar] No ICS data returned for ${feedType}`);
      return [];
    }

    if (data.stale) {
      console.warn(`[Calendar] Using stale cache for ${feedType} (age: ${Date.now() - data.timestamp}ms)`);
    } else if (data.cached) {
      console.log(`[Calendar] Cache hit for ${feedType}`);
    } else {
      console.log(`[Calendar] Fresh fetch for ${feedType}`);
    }

    const events = parseICSFile(data.icsData);
    console.log(`[Calendar] Parsed ${events.length} events for ${feedType}`);
    
    return events;
  } catch (error: any) {
    console.error(`[Calendar] Failed to fetch ${feedType}:`, error.message);
    return [];
  }
}

export async function fetchTherapistCalendar(therapistId: string): Promise<ICSEvent[]> {
  // Check cache first
  const cached = calendarCache[therapistId];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Calendar] Client cache hit for appointment-${therapistId}`);
    return cached.data;
  }

  const events = await fetchCalendarViaEdgeFunction(therapistId, 'appointment');
  
  // Update cache
  calendarCache[therapistId] = {
    data: events,
    timestamp: Date.now()
  };

  return events;
}

// Fetch ePat calendar (3rd-party appointments from Google/Apple)
export async function fetchEpatCalendar(therapistId: string): Promise<ICSEvent[]> {
  const cacheKey = `epat-${therapistId}`;
  const cached = calendarCache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Calendar] Client cache hit for ${cacheKey}`);
    return cached.data;
  }

  const events = await fetchCalendarViaEdgeFunction(therapistId, 'epat');
  
  // Update cache
  calendarCache[cacheKey] = {
    data: events,
    timestamp: Date.now()
  };

  return events;
}

// Fetch and merge both busy calendars
export async function fetchMergedBusyEvents(therapistId: string): Promise<ICSEvent[]> {
  const [vitabyteEvents, epatEvents] = await Promise.all([
    fetchTherapistCalendar(therapistId),
    fetchEpatCalendar(therapistId)
  ]);

  // Merge and deduplicate events
  const eventMap = new Map<string, ICSEvent>();
  
  for (const event of [...vitabyteEvents, ...epatEvents]) {
    // Use UID as primary key, fallback to time-based key
    const key = event.uid || `${event.start.getTime()}-${event.end.getTime()}-${event.summary}`;
    
    if (!eventMap.has(key)) {
      eventMap.set(key, event);
    }
  }

  return Array.from(eventMap.values());
}

export async function checkTimeSlotAvailability(
  therapistId: string,
  slots: TimeSlot[]
): Promise<TimeSlot[]> {
  // Fetch merged busy events from both calendars
  const events = await fetchMergedBusyEvents(therapistId);
  
  return slots.map(slot => {
    const slotStart = parseISO(slot.date);
    const slotEnd = addMinutes(slotStart, slot.duration); // Always 30 minutes
    
    // Check if this 30-minute slot is available
    const available = isTimeSlotAvailable(slotStart, slotEnd, events);
    
    return {
      ...slot,
      available: slot.available && available // Keep existing availability logic and add calendar check
    };
  });
}

// Recheck a single time slot (for pre-booking validation)
export async function recheckTimeSlot(
  therapistId: string,
  slotDate: string,
  duration: number
): Promise<boolean> {
  // Clear cache to force fresh fetch
  clearTherapistCalendarCache(therapistId);
  
  const events = await fetchMergedBusyEvents(therapistId);
  const slotStart = parseISO(slotDate);
  const slotEnd = addMinutes(slotStart, duration);
  
  return isTimeSlotAvailable(slotStart, slotEnd, events);
}

// Clear cache for a specific therapist
export function clearTherapistCalendarCache(therapistId: string) {
  delete calendarCache[therapistId];
}

// Clear all calendar cache
export function clearAllCalendarCache() {
  Object.keys(calendarCache).forEach(key => delete calendarCache[key]);
}
