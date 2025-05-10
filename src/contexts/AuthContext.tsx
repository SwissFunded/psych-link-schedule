
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  patient: Patient | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string, silent?: boolean) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined fallback users for the app (used only when Supabase data is not available)
const DEFAULT_USERS = {
  'miromw@icloud.com': {
    id: "p-miro123",
    name: "Miró Waltisberg",
    email: "miromw@icloud.com",
    phone: "(555) 123-4567"
  },
  'elena.pellizzon@psychcentral.ch': {
    id: "p-elena456",
    name: "Elena Pellizon",
    email: "elena.pellizzon@psychcentral.ch",
    phone: "(555) 987-6543"
  },
  'jane.smith@example.com': {
    id: "p-jane789",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "(555) 246-8101"
  }
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
            patientData = {
              id: currentSession.user.id,
              name: userEmail?.split('@')[0] || 'User',
              email: userEmail || '',
              phone: ''
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
          patientData = {
            id: currentSession.user.id,
            name: userEmail?.split('@')[0] || 'User',
            email: userEmail || '',
            phone: ''
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
  
  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      // Use non-email-verification signup flow
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          },
          emailRedirectTo: window.location.origin // Set redirect URL to current origin
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Auto-login the user if email confirmation is not required or bypassed
      if (data.session) {
        // User is immediately signed in
        toast.success(`Welcome, ${name}!`);
        navigate('/appointments');
      } else {
        // For supabase, users might need to confirm their email
        toast.success("Registration successful! Please check your email for confirmation.");
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || "Registration failed");
      throw error;
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
      logout 
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
