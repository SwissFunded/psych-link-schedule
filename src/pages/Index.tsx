import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/ui/logo';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = location.hash;
        
        // Check if this is a Supabase auth redirect
        if (hash && hash.includes('access_token')) {
          // Let Supabase handle the hash URL
          const { data, error } = await supabase.auth.getUser();
          
          if (error) {
            throw error;
          }
          
          if (data.user) {
            // Successfully authenticated
            setIsLoading(false);
            toast.success(`Welcome back, ${data.user.email?.split('@')[0] || 'User'}`);
            navigate('/appointments', { replace: true });
            return;
          }
        }
        
        // Check if there are query params in the URL (for password reset, etc.)
        const query = new URLSearchParams(location.search);
        if (query.get('type') === 'recovery' || query.get('type') === 'signup') {
          // Let the page load and Supabase will handle this automatically
          setIsLoading(false);
          return;
        }
        
        // If no auth-specific params are found, redirect to login
        if (!hasRedirected) {
          setHasRedirected(true);
          navigate('/', { replace: true });
        } else {
          // If we've already tried to redirect, stop loading
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        toast.error('Authentifizierung fehlgeschlagen');
        setIsLoading(false);
        
        // Wait a short delay before redirecting to avoid potential loops
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }
    };
    
    handleAuth();
  }, [location, login, navigate, hasRedirected]);

  // Animation variants
  const loadingContainerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const loadingDotVariants = {
    initial: { y: 0, opacity: 0 },
    animate: { 
      y: [0, -15, 0],
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 1,
      }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={loadingContainerVariants}
          className="flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="mb-6">
              <Logo variant="default" />
            </div>
            <div className="text-xl text-psychText/50 text-center mt-2">Authentifiziere Ihre Sitzung</div>
          </motion.div>
          
          <div className="flex space-x-3 mb-6">
            {[1, 2, 3].map((dot) => (
              <motion.div
                key={dot}
                variants={loadingDotVariants}
                className="w-4 h-4 rounded-full bg-gradient-to-br from-psychPurple to-psychPurple-dark"
                style={{ originY: 0.5 }}
              />
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm text-psychText/50"
          >
            Bitte warten Sie, während wir Ihre Sitzung einrichten
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Index;
