
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already authenticated, redirect to appointments
    if (isAuthenticated) {
      navigate('/appointments');
    }
  }, [isAuthenticated, navigate]);

  // Demo links for the different users
  const demoLinks = [
    {
      name: 'Miró Waltisberg',
      email: 'miromw@icloud.com',
      token: 'demo-token-miro'
    },
    {
      name: 'Elena Pellizon',
      email: 'elena.pellizzon@psychcentral.ch',
      token: 'demo-token-elena'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      token: 'demo-token-jane'
    }
  ];
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10 p-4">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <div className="flex justify-center items-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-psychPurple to-psychPurple-dark flex items-center justify-center shadow-lg shadow-psychPurple/20">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-psychPurple to-psychPurple-dark bg-clip-text text-transparent">PsychCentral</h1>
            <p className="text-psychText/60 mt-2">Secure Appointment Access</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="w-full border-psychPurple/10 shadow-xl backdrop-blur-sm bg-white/80">
              <CardHeader>
                <CardTitle className="text-xl">Welcome</CardTitle>
                <CardDescription>
                  In a real application, patients would receive a secure magic link via email.
                  For this demo, please select a user to simulate receiving a link:
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <motion.div 
                  className="space-y-3"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {demoLinks.map((user) => (
                    <motion.div
                      key={user.email}
                      variants={item}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <a 
                        href={`/index?token=${user.token}&email=${user.email}`}
                        className="flex items-center justify-between w-full p-4 bg-white border border-psychPurple/20 rounded-lg hover:border-psychPurple hover:shadow-lg hover:shadow-psychPurple/10 transition-all duration-300"
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-psychPurple/10 mr-3 flex items-center justify-center">
                            <img 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                              alt={user.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-psychText/60">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-psychPurple opacity-70 hover:opacity-100 transition-opacity">
                          <LogIn size={20} />
                        </div>
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
              
              <CardFooter className="flex-col space-y-2 border-t border-psychPurple/10 pt-4">
                <p className="text-center text-sm text-psychText/50 max-w-[90%] mx-auto">
                  In a production app, each patient would receive their unique secure login link via email.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 text-center text-psychText/40 text-xs"
          >
            <p>© 2025 PsychCentral. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
