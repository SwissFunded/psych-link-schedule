// Vitabyte Calendar Integration Service
// Antoine's calendar: https://api.vitabyte.ch/calendar/?action=getics&cid=0641e7-1d2756-9d1896-9b3206&type=.ics

export interface VitabyteConfig {
  cid: string;
  baseUrl: string;
}

// Antoine's Vitabyte configuration
export const antoineVitabyteConfig: VitabyteConfig = {
  cid: '0641e7-1d2756-9d1896-9b3206',
  baseUrl: 'https://api.vitabyte.ch/calendar/'
};

// Antoine's appointment calendar (shows busy times)
export const antoineAppointmentConfig: VitabyteConfig = {
  cid: '814167-1776ec-851153-724277',
  baseUrl: 'https://api.vitabyte.ch/calendar/'
};

// Antoine's ePat calendar (shows appointments from Google/Apple/3rd-party apps)
export const antoineEpatConfig: VitabyteConfig = {
  cid: '72a22f-c1d1b3-a413f2-6ffb45',
  baseUrl: 'https://api.vitabyte.ch/calendar/'
};

export function getVitabyteCalendarUrl(config: VitabyteConfig): string {
  return `${config.baseUrl}?action=getics&cid=${config.cid}&type=.ics`;
}

export function getVitabyteAppointmentUrl(config: VitabyteConfig, appointmentId?: string): string {
  // This would be used if Vitabyte provides direct appointment booking URLs
  // For now, we use the general calendar feed
  return getVitabyteCalendarUrl(config);
}

// Function to check if a therapist uses Vitabyte
export function isVitabyteTherapist(therapistId: string): boolean {
  // Currently only Antoine uses Vitabyte
  return therapistId === 't1';
}

// Get Vitabyte config for a therapist
export function getTherapistVitabyteConfig(therapistId: string): VitabyteConfig | null {
  if (therapistId === 't1') {
    return antoineVitabyteConfig;
  }
  return null;
}

// Get Vitabyte appointment calendar config for a therapist
export function getTherapistAppointmentConfig(therapistId: string): VitabyteConfig | null {
  if (therapistId === 't1') {
    return antoineAppointmentConfig;
  }
  return null;
}

// Get ePat calendar config for a therapist (3rd-party appointments)
export function getTherapistEpatConfig(therapistId: string): VitabyteConfig | null {
  if (therapistId === 't1') {
    return antoineEpatConfig;
  }
  return null;
}
