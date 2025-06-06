import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

interface Patient {
  id: string;
  name: string;
  surname?: string;
  email: string;
  phone: string;
  birthdate?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  patient: Patient | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string, silent?: boolean) => Promise<void>;
  signup: (email: string, password: string, name: string, surname: string, phone: string, birthdate: string) => Promise<void>;
  logout: () => void;
  verifyOtp: (email: string, token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined fallback users for the app (used only when Supabase data is not available)
const DEFAULT_USERS = {
  'miromw@icloud.com': {
    id: "p-miro123",
    name: "Miró",
    surname: "Waltisberg",
    email: "miromw@icloud.com",
    phone: "(555) 123-4567",
    birthdate: "1985-06-15"
  },
  'elena.pellizzon@psychcentral.ch': {
    id: "p-elena456",
    name: "Elena",
    surname: "Pellizon",
    email: "elena.pellizzon@psychcentral.ch",
    phone: "(555) 987-6543",
    birthdate: "1990-03-22"
  },
  'jane.smith@example.com': {
    id: "p-jane789",
    name: "Jane",
    surname: "Smith",
    email: "jane.smith@example.com",
    phone: "(555) 246-8101",
    birthdate: "1988-11-30"
  }
};

// Function to generate a random 4-digit OTP code
const generateOTPCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setIsAuthenticated(true);
          
          // Create patient object from user data
          const userEmail = currentSession.user.email;
          let patientData: Patient;
          
          // If we have a predefined user, use that data
          if (userEmail && userEmail in DEFAULT_USERS) {
            patientData = DEFAULT_USERS[userEmail as keyof typeof DEFAULT_USERS];
          } else {
            // Otherwise create a new patient object from the user data
            const userData = currentSession.user.user_metadata;
            patientData = {
              id: currentSession.user.id,
              name: userData?.name || userEmail?.split('@')[0] || 'User',
              surname: userData?.surname || '',
              email: userEmail || '',
              phone: userData?.phone || '',
              birthdate: userData?.birthdate || ''
            };
          }
          
          setPatient(patientData);
        } else {
          setIsAuthenticated(false);
          setPatient(null);
        }
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        setIsAuthenticated(true);
        
        // Create patient object from user data
        const userEmail = currentSession.user.email;
        let patientData: Patient;
        
        // If we have a predefined user, use that data
        if (userEmail && userEmail in DEFAULT_USERS) {
          patientData = DEFAULT_USERS[userEmail as keyof typeof DEFAULT_USERS];
        } else {
          // Otherwise create a new patient object from the user data
          const userData = currentSession.user.user_metadata;
          patientData = {
            id: currentSession.user.id,
            name: userData?.name || userEmail?.split('@')[0] || 'User',
            surname: userData?.surname || '',
            email: userEmail || '',
            phone: userData?.phone || '',
            birthdate: userData?.birthdate || ''
          };
        }
        
        setPatient(patientData);
      }
      
      setLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const login = async (email: string, password: string, silent: boolean = false) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // Navigate to appointments page after successful login
      navigate('/appointments');
      
      if (!silent) {
        const displayName = data.user?.email?.split('@')[0] || 'User';
        toast.success(`Welcome back, ${displayName}`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (!silent) {
        toast.error(error.message || "Authentication failed");
      }
      
      setIsAuthenticated(false);
      setPatient(null);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };
  
  const signup = async (email: string, password: string, name: string, surname: string, phone: string, birthdate: string) => {
    try {
      setLoading(true);
      
      // Store registration data in session storage to use after verification
      const userData = {
        email,
        password,
        name,
        surname,
        phone,
        birthdate
      };
      
      sessionStorage.setItem('pendingRegistration', JSON.stringify(userData));
      
      // Sign up the user with Supabase - this will send a verification email
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // We'll use the OTP instead of auto-confirming
          emailRedirectTo: `${window.location.origin}/verify-otp?email=${encodeURIComponent(email)}`,
          data: {
            name,
            surname,
            phone,
            birthdate
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Show success message and redirect to OTP verification page
      toast.success(`Registrierung erfolgreich! Bitte geben Sie den Bestätigungscode ein, der an ${email} gesendet wurde.`);
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const verifyOtp = async (email: string, token: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simple OTP verification flow
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });
      
      if (error) {
        toast.error(error.message || "Ungültiger Code");
        return false;
      }
      
      if (data.session) {
        // If we have a session, the user is now verified and logged in
        toast.success("E-Mail erfolgreich bestätigt! Willkommen!");
        navigate('/appointments');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || "Verifizierung fehlgeschlagen");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setPatient(null);
      setUser(null);
      setSession(null);
      navigate('/');
      toast.info("You've been logged out");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Logout failed");
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      patient, 
      user,
      session,
      loading, 
      login, 
      signup,
      logout,
      verifyOtp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
