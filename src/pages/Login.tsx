
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';

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
  
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-psychPurple/5 p-4">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold text-psychPurple">PsychCentral</h1>
            <p className="text-psychText/60 mt-2">Appointment Scheduler</p>
          </motion.div>
          
          <Card className="w-full border-psychPurple/10 card-shadow">
            <CardHeader>
              <CardTitle className="text-xl">Welcome</CardTitle>
              <CardDescription>
                In a real application, patients would receive a secure magic link via email.
                For this demo, please select a user to simulate receiving a link:
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {demoLinks.map((user, index) => (
                  <motion.div
                    key={user.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <a 
                      href={`/index?token=${user.token}&email=${user.email}`}
                      className="block w-full p-3 bg-white border border-psychPurple/20 rounded-md hover:border-psychPurple hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-psychText/60">{user.email}</p>
                        </div>
                        <div className="text-psychPurple">→</div>
                      </div>
                    </a>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="flex-col space-y-2">
              <p className="text-center text-sm text-psychText/50">
                In a production app, each patient would receive their unique secure login link via email.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
