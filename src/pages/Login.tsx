import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/ui/PageTransition';
import { LogIn, User, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Logo } from '@/components/ui/logo';

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse erforderlich"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein")
});

const registerSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Gültige E-Mail-Adresse erforderlich"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"]
});

export default function Login() {
  const { isAuthenticated, login, signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // If already authenticated, redirect to appointments
    if (isAuthenticated) {
      navigate('/appointments');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (schema: z.ZodType<any>, data: any): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = validateForm(loginSchema, { email, password });
    if (!isValid) return;
    
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = validateForm(registerSchema, { name, email, password, confirmPassword });
    if (!isValid) return;
    
    setIsLoading(true);
    
    try {
      await signup(email, password, name);
      // Reset registration form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Switch to login tab after successful registration
      setActiveTab('login');
    } catch (error) {
      console.error('Registration failed:', error);
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
            transition={{ duration: 0.3, ease: "easeOut" }}
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
            transition={{ duration: 0.3, delay: 0.1 }}
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
                  <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-psychPurple data-[state=active]:shadow-sm">
                    Registrieren
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
                          className={`border-psychPurple/20 focus:border-psychPurple/50 ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
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
                          className={`border-psychPurple/20 focus:border-psychPurple/50 ${errors.password ? 'border-red-500' : ''}`}
                        />
                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
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
                
                <TabsContent value="register" className="m-0">
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-psychText/70">Name</Label>
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="Max Mustermann" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                          className={`border-psychPurple/20 focus:border-psychPurple/50 ${errors.name ? 'border-red-500' : ''}`}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-sm font-medium text-psychText/70">E-Mail</Label>
                        <Input 
                          id="register-email" 
                          type="email" 
                          placeholder="ihre.email@beispiel.de" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className={`border-psychPurple/20 focus:border-psychPurple/50 ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-sm font-medium text-psychText/70">Passwort</Label>
                        <Input 
                          id="register-password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          className={`border-psychPurple/20 focus:border-psychPurple/50 ${errors.password ? 'border-red-500' : ''}`}
                        />
                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-sm font-medium text-psychText/70">Passwort bestätigen</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          placeholder="••••••••" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                          className={`border-psychPurple/20 focus:border-psychPurple/50 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        />
                        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-psychPurple-dark to-psychPurple hover:from-psychPurple hover:to-psychPurple-dark text-white hover:shadow-lg hover:shadow-psychPurple/20 transition-all duration-300 mt-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                            Registrieren...
                          </span>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Registrieren
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mt-8 text-center text-psychText/40 text-xs"
          >
            <p>© 2025 PsychCentral. Alle Rechte vorbehalten.</p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
