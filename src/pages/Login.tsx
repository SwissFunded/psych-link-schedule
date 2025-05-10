import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import { LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  useEffect(() => {
    // If already authenticated, redirect to appointments
    if (isAuthenticated) {
      navigate('/appointments');
    }
  }, [isAuthenticated, navigate]);

  // Demo accounts for the app
  const demoAccounts = [
    {
      name: 'Miró Waltisberg',
      email: 'miromw@icloud.com',
      password: 'password123'
    },
    {
      name: 'Elena Pellizon',
      email: 'elena.pellizzon@psychcentral.ch',
      password: 'password123'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Bitte geben Sie E-Mail und Passwort ein');
      return;
    }
    
    // Simple validation
    const account = demoAccounts.find(acc => acc.email === email);
    if (!account || account.password !== password) {
      toast.error('Falsche E-Mail oder Passwort');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a mock token for this login
      const token = `demo-token-${Date.now()}`;
      await login(token, email, false);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoAccount: typeof demoAccounts[0]) => {
    setIsLoading(true);
    
    try {
      const token = `demo-token-${Date.now()}`;
      await login(token, demoAccount.email, false);
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10 p-4">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <div className="flex justify-center items-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-psychPurple to-psychPurple-dark flex items-center justify-center shadow-lg shadow-psychPurple/20">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-psychPurple to-psychPurple-dark bg-clip-text text-transparent">PsychCentral</h1>
            <p className="text-psychText/60 mt-2">Terminverwaltung für Ihre Therapie</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="w-full border-psychPurple/10 shadow-xl backdrop-blur-sm bg-white/80">
              <CardHeader>
                <CardTitle className="text-xl">Willkommen</CardTitle>
                <CardDescription>
                  Melden Sie sich an, um Ihre Termine zu verwalten
                </CardDescription>
              </CardHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Anmelden</TabsTrigger>
                  <TabsTrigger value="demo">Demo-Konten</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="m-0">
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="ihre.email@beispiel.de" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Passwort</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-psychPurple hover:bg-psychPurple-dark"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                            Anmelden...
                          </span>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Anmelden
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
                
                <TabsContent value="demo" className="m-0">
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-psychText/70 mb-2">
                        Wählen Sie ein Demo-Konto für einen schnellen Zugang:
                      </p>
                      {demoAccounts.map((account) => (
                        <motion.div
                          key={account.email}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            variant="outline"
                            className="flex items-center justify-between w-full p-3 border-psychPurple/20 hover:border-psychPurple hover:shadow-lg hover:shadow-psychPurple/10 transition-all duration-300"
                            onClick={() => handleQuickLogin(account)}
                            disabled={isLoading}
                          >
                            <div className="flex items-center text-left">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-psychPurple/10 mr-3 flex items-center justify-center">
                                <img 
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${account.name}`} 
                                  alt={account.name} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-xs text-psychText/60">{account.email}</p>
                              </div>
                            </div>
                            <LogIn size={16} className="text-psychPurple opacity-70" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
              
              <CardFooter className="flex-col space-y-2 border-t border-psychPurple/10 pt-4">
                <p className="text-center text-xs text-psychText/50 max-w-[90%] mx-auto">
                  Dies ist eine Demo-Anwendung. Alle Passwörter sind „password123"
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
            <p>© 2025 PsychCentral. Alle Rechte vorbehalten.</p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
