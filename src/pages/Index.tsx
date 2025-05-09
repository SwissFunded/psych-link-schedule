
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const handleAuth = async () => {
      // Check for token in URL
      const token = new URLSearchParams(location.search).get('token');
      const email = new URLSearchParams(location.search).get('email');
      
      if (token && email) {
        await login(token, email);
      } else {
        // If no token in URL, redirect to login
        navigate('/');
      }
      setIsLoading(false);
    };
    
    handleAuth();
  }, [location, login, navigate]);

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
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-psychPurple to-psychPurple-dark flex items-center justify-center mb-6 shadow-lg shadow-psychPurple/20">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
            <div className="text-4xl font-bold text-psychPurple">PsychCentral</div>
            <div className="text-xl text-psychText/50 text-center mt-2">Authenticating your session</div>
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
            Please wait while we set up your session
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Index;
