// Simple ICS parser for browser environment
export interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}

export function parseICSFile(icsContent: string): ICSEvent[] {
  const events: ICSEvent[] = [];
  const lines = icsContent.split(/\r?\n/);
  
  let currentEvent: Partial<ICSEvent> | null = null;
  let inEvent = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuation (lines starting with space or tab)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].substring(1);
      i++;
    }
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      inEvent = false;
      if (currentEvent.uid && currentEvent.start && currentEvent.end) {
        events.push(currentEvent as ICSEvent);
      }
      currentEvent = null;
    } else if (inEvent && currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        
        // Extract the property name (before any parameters)
        const propertyMatch = key.match(/^([A-Z-]+)/);
        if (!propertyMatch) continue;
        
        const property = propertyMatch[1];
        
        switch (property) {
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'SUMMARY':
            currentEvent.summary = value;
            break;
          case 'DESCRIPTION':
            currentEvent.description = value.replace(/\\n/g, '\n');
            break;
          case 'LOCATION':
            currentEvent.location = value;
            break;
          case 'DTSTART':
            // Handle both DTSTART:value and DTSTART;TZID=...:value
            currentEvent.start = parseICSDate(value);
            break;
          case 'DTEND':
            // Handle both DTEND:value and DTEND;TZID=...:value
            currentEvent.end = parseICSDate(value);
            break;
        }
      }
    }
  }
  
  return events;
}

function parseICSDate(dateString: string): Date {
  // Handle different date formats
  // Format: YYYYMMDD (all day event)
  if (dateString.length === 8 && !dateString.includes('T')) {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(dateString.substring(6, 8));
    return new Date(year, month, day);
  }
  
  // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  if (dateString.includes('T')) {
    const datePart = dateString.substring(0, 8);
    const timePart = dateString.substring(9, 15);
    
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1;
    const day = parseInt(datePart.substring(6, 8));
    const hour = parseInt(timePart.substring(0, 2));
    const minute = parseInt(timePart.substring(2, 4));
    const second = parseInt(timePart.substring(4, 6));
    
    if (dateString.endsWith('Z')) {
      // UTC time
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    } else {
      // Local time (assumes Europe/Zurich for TZID cases)
      // Note: For true TZID support, we'd need a timezone library
      // For now, treat as local time which works for single-timezone deployments
      return new Date(year, month, day, hour, minute, second);
    }
  }
  
  // Fallback to Date constructor
  return new Date(dateString);
}

export function isTimeSlotAvailable(slotStart: Date, slotEnd: Date, events: ICSEvent[]): boolean {
  for (const event of events) {
    // Check if the slot overlaps with any existing event
    if (
      (slotStart >= event.start && slotStart < event.end) || // Slot starts during event
      (slotEnd > event.start && slotEnd <= event.end) || // Slot ends during event
      (slotStart <= event.start && slotEnd >= event.end) // Slot encompasses event
    ) {
      return false;
    }
  }
  return true;
}
