
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import { LogIn, User } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-psychPurple/10 via-psychPurple/5 to-white p-4">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <div className="flex justify-center items-center mb-5">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-psychPurple to-psychPurple-dark flex items-center justify-center shadow-lg shadow-psychPurple/30 transform rotate-6 hover:rotate-0 transition-all duration-300">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-psychPurple-dark via-psychPurple to-psychPurple-light bg-clip-text text-transparent">PsychCentral</h1>
            <p className="text-psychText/60 mt-2 font-light">Terminverwaltung für Ihre Therapie</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="w-full border-none shadow-xl backdrop-blur-sm bg-white/90 rounded-xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-medium text-psychText">Willkommen zurück</CardTitle>
                <CardDescription className="text-psychText/60">
                  Melden Sie sich an, um Ihre Termine zu verwalten
                </CardDescription>
              </CardHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-psychPurple/5">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-psychPurple data-[state=active]:shadow-sm">
                    Anmelden
                  </TabsTrigger>
                  <TabsTrigger value="demo" className="data-[state=active]:bg-white data-[state=active]:text-psychPurple data-[state=active]:shadow-sm">
                    Demo-Konten
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="m-0">
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-psychText/70">E-Mail</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="ihre.email@beispiel.de" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="border-psychPurple/20 focus:border-psychPurple/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-psychText/70">Passwort</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          className="border-psychPurple/20 focus:border-psychPurple/50"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-psychPurple-dark to-psychPurple hover:from-psychPurple hover:to-psychPurple-dark text-white hover:shadow-lg hover:shadow-psychPurple/20 transition-all duration-300 mt-2"
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
                      <p className="text-sm text-psychText/70 mb-3">
                        Wählen Sie ein Demo-Konto für einen schnellen Zugang:
                      </p>
                      {demoAccounts.map((account, index) => (
                        <motion.div
                          key={account.email}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            variant="outline"
                            className="flex items-center justify-between w-full p-3 border-psychPurple/10 hover:border-psychPurple hover:bg-psychPurple/5 hover:shadow-md transition-all duration-300"
                            onClick={() => handleQuickLogin(account)}
                            disabled={isLoading}
                          >
                            <div className="flex items-center text-left">
                              <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-psychPurple/20 to-psychPurple/5 mr-3 flex items-center justify-center shadow-inner">
                                <User size={18} className="text-psychPurple opacity-70" />
                              </div>
                              <div>
                                <p className="font-medium text-psychText">{account.name}</p>
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
              
              <CardFooter className="flex-col space-y-2 border-t border-psychPurple/10 pt-4 bg-gradient-to-b from-transparent to-psychPurple/5">
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
