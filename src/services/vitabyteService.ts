// Vitabyte Calendar Integration Service
// Antoine's main calendar: https://api.vitabyte.ch/calendar/?action=getics&cid=c5ad79-40dc35-228b71-218c1c&type=.ics
// This calendar includes ALL appointments: therapy sessions, admin time, START blocks, and non-billable appointments
// NOTE: Updated 2025-10-13 with latest CID from user

export interface VitabyteConfig {
  cid: string;
  baseUrl: string;
}

// Antoine's main Vitabyte calendar (comprehensive - includes all appointment types)
export const antoineVitabyteConfig: VitabyteConfig = {
  cid: 'c5ad79-40dc35-228b71-218c1c',
  baseUrl: 'https://api.vitabyte.ch/calendar/'
};

// Antoine's appointment calendar (same as main calendar)
export const antoineAppointmentConfig: VitabyteConfig = {
  cid: 'c5ad79-40dc35-228b71-218c1c',
  baseUrl: 'https://api.vitabyte.ch/calendar/'
};

// Antoine's ePat calendar (same as main calendar - includes all appointments)
export const antoineEpatConfig: VitabyteConfig = {
  cid: 'c5ad79-40dc35-228b71-218c1c',
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
