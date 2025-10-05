import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { exchangeCodeForTokens } from '@/services/calendarService';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';
import { PageTransition } from '@/components/ui/PageTransition';

export default function GoogleCalendarCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Extract authorization code from URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const errorParam = params.get('error');

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        setStatus('processing');

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);

        if (!tokens.accessToken) {
          throw new Error('Failed to get access token');
        }

        // Store tokens in Supabase user metadata
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Update user metadata with Google Calendar tokens
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            google_calendar_auth: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              expiryDate: tokens.expiryDate,
              connectedAt: new Date().toISOString(),
            }
          }
        });

        if (updateError) {
          throw updateError;
        }

        setStatus('success');
        toast.success('Google Calendar erfolgreich verbunden!');

        // Redirect to profile page after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);

      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err.message || 'Failed to connect Google Calendar');
        toast.error('Fehler beim Verbinden mit Google Calendar');

        // Redirect to profile page after delay
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [location, navigate]);

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center max-w-md p-8"
        >
          <div className="mb-8">
            <Logo variant="default" />
          </div>

          {status === 'processing' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-psychPurple/30 border-t-psychPurple animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-medium text-psychText mb-2">
                Verbinde Google Calendar...
              </h2>
              <p className="text-psychText/60">
                Bitte warten Sie einen Moment
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-medium text-psychText mb-2">
                Erfolgreich verbunden!
              </h2>
              <p className="text-psychText/60">
                Ihre Termine werden automatisch mit Google Calendar synchronisiert
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-xl font-medium text-psychText mb-2">
                Verbindung fehlgeschlagen
              </h2>
              <p className="text-psychText/60 text-sm">
                {error || 'Ein Fehler ist aufgetreten'}
              </p>
              <p className="text-psychText/40 text-xs mt-2">
                Sie werden zum Profil weitergeleitet...
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}

