import { format, parseISO } from 'date-fns';

interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: string) => {
    const d = parseISO(date);
    return format(d, "yyyyMMdd'T'HHmmss");
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PsychCentral//Appointment//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@psychcentral.ch
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT72H
ACTION:DISPLAY
DESCRIPTION:SMS-Erinnerung: ${event.title}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Letzte Stornierungsmöglichkeit: ${event.title}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Terminerinnerung: ${event.title}
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

export function downloadICSFile(event: CalendarEvent, filename: string) {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
