
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Calendar, Clock, LogOut, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout, loading, patient } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full border-4 border-psychPurple border-t-transparent animate-spin mb-4"></div>
          <div className="text-psychText/50 animate-pulse">Loading your information...</div>
        </motion.div>
      </div>
    );
  }
  
  if (!isAuthenticated && location.pathname !== '/') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-xl max-w-md w-full"
        >
          <h2 className="text-2xl font-semibold mb-4 text-center">Authentication Required</h2>
          <p className="text-center mb-6 text-psychText/70">Please use your login link to access your appointments.</p>
          <Button onClick={() => window.location.href = '/'} className="w-full bg-psychPurple hover:bg-psychPurple-dark">
            Return to Login
          </Button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Animation variants
  const navItemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && (
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.19, 1.0, 0.22, 1.0] }}
          className="bg-white/90 backdrop-blur-md border-b border-psychPurple/10 py-4 px-4 sm:px-6 sticky top-0 z-10"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/appointments" className="flex items-center group">
              <motion.div 
                initial={{ x: -20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-psychPurple to-psychPurple-dark bg-clip-text text-transparent font-medium text-xl"
              >
                PsychCentral
              </motion.div>
            </Link>
            
            <AnimatePresence>
              <motion.div 
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.div 
                  variants={navItemVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="hidden md:flex mr-6"
                >
                  <div className="text-right">
                    <p className="font-medium text-sm">{patient?.name}</p>
                    <p className="text-xs text-psychText/70">{patient?.email}</p>
                  </div>
                </motion.div>
                
                <motion.div
                  variants={navItemVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={logout} 
                    title="Logout"
                    className="text-psychText/70 hover:text-psychText hover:bg-psychPurple/5 transition-all duration-300"
                  >
                    <LogOut size={18} />
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.header>
      )}
      
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 bg-gradient-to-br from-psychPurple/5 to-psychBeige/50"
      >
        <PageTransition>{children}</PageTransition>
      </motion.main>
      
      {isAuthenticated && (
        <motion.nav 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white/90 backdrop-blur-md border-t border-psychPurple/10 py-3 md:hidden fixed bottom-0 left-0 right-0 z-10"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={`transition-all duration-300 ${location.pathname === '/appointments' ? 'text-psychPurple bg-psychPurple/10 rounded-lg' : 'text-psychText/60'}`}
              >
                <Link to="/appointments">
                  <Calendar size={20} />
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={`transition-all duration-300 ${location.pathname === '/book' ? 'text-psychPurple bg-psychPurple/10 rounded-lg' : 'text-psychText/60'}`}
              >
                <Link to="/book">
                  <Clock size={20} />
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={`transition-all duration-300 ${location.pathname === '/profile' ? 'text-psychPurple bg-psychPurple/10 rounded-lg' : 'text-psychText/60'}`}
              >
                <Link to="/profile">
                  <UserCircle size={20} />
                </Link>
              </Button>
            </div>
          </div>
        </motion.nav>
      )}
    </div>
  );
}
