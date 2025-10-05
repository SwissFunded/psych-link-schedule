// TODO: googleapis is a Node.js package and cannot run in the browser
// This entire service needs to be moved to server-side (Supabase Edge Functions)
// import { google } from 'googleapis';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

// Google Calendar OAuth configuration
// These need to be set up in Google Cloud Console and added to environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin + '/oauth/google/callback' : '');

// OAuth scopes needed for calendar access
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export interface GoogleCalendarAuth {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
}

/**
 * Get Google OAuth authorization URL
 */
export function getGoogleAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleCalendarAuth> {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date,
  };
}

/**
 * Create OAuth client with tokens
 */
function createOAuthClient(auth: GoogleCalendarAuth) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: auth.accessToken,
    refresh_token: auth.refreshToken,
    expiry_date: auth.expiryDate,
  });

  return oauth2Client;
}

/**
 * Add event to Google Calendar
 */
export async function addToGoogleCalendar(
  event: CalendarEvent,
  auth: GoogleCalendarAuth
): Promise<string | null> {
  try {
    const oauth2Client = createOAuthClient(auth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDate = parseISO(event.start);
    const endDate = parseISO(event.end);

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start,
          timeZone: 'Europe/Berlin', // German timezone
        },
        end: {
          dateTime: event.end,
          timeZone: 'Europe/Berlin',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      },
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    return null;
  }
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  event: CalendarEvent,
  auth: GoogleCalendarAuth
): Promise<boolean> {
  try {
    const oauth2Client = createOAuthClient(auth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start,
          timeZone: 'Europe/Berlin',
        },
        end: {
          dateTime: event.end,
          timeZone: 'Europe/Berlin',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
}

/**
 * Delete event from Google Calendar
 */
export async function deleteFromGoogleCalendar(
  eventId: string,
  auth: GoogleCalendarAuth
): Promise<boolean> {
  try {
    const oauth2Client = createOAuthClient(auth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}

/**
 * Check if user has Google Calendar connected
 */
export function isGoogleCalendarConnected(auth: GoogleCalendarAuth | null): boolean {
  return !!(auth?.accessToken);
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(auth: GoogleCalendarAuth): Promise<GoogleCalendarAuth | null> {
  try {
    if (!auth.refreshToken) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: auth.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || auth.refreshToken,
      expiryDate: credentials.expiry_date,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

/**
 * Format appointment for Google Calendar
 */
export function formatAppointmentForCalendar(
  appointment: any,
  therapistName: string
): CalendarEvent {
  const startDate = parseISO(appointment.date);
  const endDate = new Date(startDate.getTime() + appointment.duration * 60000); // Add duration in ms

  return {
    summary: `Therapie-Termin mit ${therapistName}`,
    description: `${appointment.type === 'video' ? 'Online-Sitzung (Video)' : 'Persönliche Sitzung'}\n\nDauer: ${appointment.duration} Minuten\n\nBei Fragen kontaktieren Sie bitte die Praxis.`,
    location: appointment.type === 'video' ? 'Online (Link wird per E-Mail versendet)' : 'PsychCentral Praxis',
    start: appointment.date,
    end: endDate.toISOString(),
  };
}

