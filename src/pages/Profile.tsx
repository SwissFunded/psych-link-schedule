
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { getGoogleAuthUrl, isGoogleCalendarConnected, GoogleCalendarAuth } from '@/services/calendarService';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function Profile() {
  const { patient, logout } = useAuth();
  const [googleCalendarAuth, setGoogleCalendarAuth] = useState<GoogleCalendarAuth | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Load Google Calendar auth status
  useEffect(() => {
    const loadCalendarAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.google_calendar_auth) {
          setGoogleCalendarAuth(user.user_metadata.google_calendar_auth);
        }
      } catch (error) {
        console.error('Error loading calendar auth:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    
    loadCalendarAuth();
  }, []);
  
  const handleConnectGoogleCalendar = () => {
    const authUrl = getGoogleAuthUrl();
    // Open Google OAuth in same window (will redirect back)
    window.location.href = authUrl;
  };
  
  const handleDisconnectGoogleCalendar = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          google_calendar_auth: null
        }
      });
      
      if (error) throw error;
      
      setGoogleCalendarAuth(null);
      toast.success('Google Calendar getrennt');
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Fehler beim Trennen von Google Calendar');
    }
  };
  
  if (!patient) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <div className="text-center">Profil wird geladen...</div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold mb-6">Ihr Profil</h1>
        
        <Card className="border-psychPurple/10 card-shadow mb-6">
          <CardHeader>
            <CardTitle>Persönliche Informationen</CardTitle>
            <CardDescription>Ihre Kontodaten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-psychText/70">Name</p>
                <p>{patient.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">E-Mail</p>
                <p>{patient.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-psychText/70">Telefon</p>
                <p>{patient.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* TODO: Google Calendar sync - needs server-side implementation */}
        {/* <Card className="border-psychPurple/10 card-shadow mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-psychPurple" />
                  Google Calendar Sync
                </CardTitle>
                <CardDescription className="mt-1">
                  Termine automatisch mit Google Calendar synchronisieren
                </CardDescription>
              </div>
              {!isLoadingAuth && isGoogleCalendarConnected(googleCalendarAuth) && (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAuth ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-psychPurple border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : isGoogleCalendarConnected(googleCalendarAuth) ? (
              <div className="space-y-3">
                <div className="flex items-center text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Verbunden - Ihre Termine werden automatisch synchronisiert</span>
                </div>
                <p className="text-sm text-psychText/70">
                  Alle gebuchten, verschobenen und stornierten Termine werden automatisch mit Ihrem Google Calendar synchronisiert.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={handleDisconnectGoogleCalendar}
                >
                  Verbindung trennen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-psychText/70">
                  Verbinden Sie Ihr Google Calendar Konto, um Termine automatisch zu synchronisieren. Sie erhalten Erinnerungen und haben alle Termine in Ihrem gewohnten Kalender.
                </p>
                <div className="bg-psychPurple/5 p-3 rounded-md">
                  <p className="text-xs text-psychText/60">
                    <strong>Vorteile:</strong>
                  </p>
                  <ul className="text-xs text-psychText/60 list-disc list-inside mt-1 space-y-1">
                    <li>Automatische Synchronisation aller Termine</li>
                    <li>Erinnerungen 24h und 1h vor dem Termin</li>
                    <li>Änderungen werden automatisch aktualisiert</li>
                    <li>Keine manuelle Eingabe mehr nötig</li>
                  </ul>
                </div>
                <Button
                  className="bg-psychPurple hover:bg-psychPurple/90 w-full"
                  onClick={handleConnectGoogleCalendar}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Mit Google Calendar verbinden
                </Button>
              </div>
            )}
          </CardContent>
        </Card> */}
        
        <Card className="border-psychPurple/10 card-shadow">
          <CardHeader>
            <CardTitle>Kontoeinstellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-psychText/70">
              Möchten Sie Ihre Kontaktinformationen aktualisieren? Bitte wenden Sie sich direkt an die Praxis Ihres Therapeuten.
            </p>
          </CardContent>
          <Separator className="my-2" />
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              Abmelden
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
