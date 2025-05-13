
import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { supabase } from '@/integrations/supabase/client';
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { verifyOtp, isAuthenticated, loading } = useAuth();
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // If authenticated, redirect to appointments
  if (isAuthenticated) {
    return <Navigate to="/appointments" replace />;
  }

  // If no email in query params, redirect to login
  if (!email) {
    return <Navigate to="/" replace />;
  }

  // Handle countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Handle OTP verification
  const handleVerify = async () => {
    if (otp.length !== 4) {
      toast.error("Bitte geben Sie den 4-stelligen Code ein");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await verifyOtp(email, otp);
      if (!success) {
        setOtp('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    
    // Request password reset which will send a new OTP
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/verify-otp?email=' + encodeURIComponent(email)
    });
    
    if (error) {
      toast.error("Fehler beim Senden des neuen Codes");
      setCanResend(true);
      return;
    }
    
    toast.success("Ein neuer Bestätigungscode wurde gesendet");
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-psychPurple/10 via-psychPurple/5 to-white p-4">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-5">
              <Logo variant="default" className="transform scale-75 md:scale-90" />
            </div>
            <p className="text-psychText/60 mt-2 font-light">Terminverwaltung für Ihre Therapie</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="w-full border-none shadow-xl backdrop-blur-sm bg-white/90 rounded-xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-psychText">Bestätigungscode eingeben</CardTitle>
                <CardDescription className="text-psychText/60">
                  Bitte geben Sie den 4-stelligen Code ein, der an <span className="font-medium">{email}</span> gesendet wurde
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  <div className="flex justify-center">
                    <Mail className="h-16 w-16 text-psychPurple opacity-60" />
                  </div>
                  
                  <div className="w-full">
                    <InputOTP 
                      maxLength={4}
                      value={otp} 
                      onChange={(value) => setOtp(value)}
                      disabled={isSubmitting}
                      className="w-full justify-center"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="border-psychPurple/20 focus:border-psychPurple h-14 w-14 text-lg" />
                        <InputOTPSlot index={1} className="border-psychPurple/20 focus:border-psychPurple h-14 w-14 text-lg" />
                        <InputOTPSlot index={2} className="border-psychPurple/20 focus:border-psychPurple h-14 w-14 text-lg" />
                        <InputOTPSlot index={3} className="border-psychPurple/20 focus:border-psychPurple h-14 w-14 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  <Button 
                    onClick={handleVerify}
                    disabled={otp.length !== 4 || isSubmitting}
                    className="w-full bg-gradient-to-r from-psychPurple-dark to-psychPurple hover:from-psychPurple hover:to-psychPurple-dark text-white hover:shadow-lg hover:shadow-psychPurple/20 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                        Verifizierung...
                      </span>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Code bestätigen
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
              
              <CardFooter className="flex-col space-y-4 pt-0">
                <div className="text-center text-sm text-psychText/60">
                  {canResend ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleResend}
                      className="text-psychPurple hover:text-psychPurple-dark hover:bg-psychPurple/5"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Neuen Code senden
                    </Button>
                  ) : (
                    <p>Neuen Code anfordern in {countdown} Sekunden</p>
                  )}
                </div>
                
                <div className="text-center text-xs text-psychText/50">
                  <p>Bitte überprüfen Sie auch Ihren Spam-Ordner</p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 text-center text-psychText/40 text-xs"
          >
            <p>© 2025 PsychCentral. Alle Rechte vorbehalten.</p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
