import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { getCustomerByMail, getTreater, getAppointments, getTherapists, Customer, Treater } from '@/lib/epatApi';

interface Patient {
  id: string;
  name: string;
  surname?: string;
  email: string;
  phone: string;
  birthdate?: string;
}

interface VitabytePatientData {
  patid: number;
  firstname: string;
  lastname: string;
  gender: string;
  dob: string;
  title?: string;
  street?: string;
  zip?: string;
  city?: string;
  mobile?: string;
  mail: string;
  ahv?: string;
  deleted: number;
  assignedTherapist?: {
    providerId: number;
    name: string;
    specialty: string;
  };
  appointmentCount?: number;
  lastSync?: Date;
}

interface AuthContextType {
  isAuthenticated: boolean;
  patient: Patient | null;
  vitabytePatient: VitabytePatientData | null;
  user: User | null;
  session: Session | null;
  loading: boolean;
  vitabyteLoading: boolean;
  login: (email: string, password: string, silent?: boolean) => Promise<void>;
  signup: (email: string, password: string, name: string, surname: string, phone: string, birthdate: string) => Promise<void>;
  logout: () => void;

  refreshVitabyteData: () => Promise<void>;
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



export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitabytePatient, setVitabytePatient] = useState<VitabytePatientData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [vitabyteLoading, setVitabyteLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Function to lookup Vitabyte patient data
  const lookupVitabyteData = async (email: string) => {
    try {
      setVitabyteLoading(true);
      console.log('🔍 Looking up Vitabyte data for:', email);

      // Look up customer in Vitabyte API
      const customers = await getCustomerByMail(email);
      
      if (customers.length === 0) {
        console.log('ℹ️ No Vitabyte patient data found for:', email);
        setVitabytePatient(null);
        
        // Show informative message for users (not an error, just information)
        toast.info(`Patientendaten für ${email} werden noch verknüpft. Termine werden nach der Verknüpfung angezeigt.`, {
          duration: 5000,
        });
        return;
      }

      const vitabyteCustomer = customers[0]; // Use first match
      console.log('✅ Vitabyte patient found:', vitabyteCustomer);

      // Get assigned therapist
      let assignedTherapist = undefined;
      try {
        const treater = await getTreater(vitabyteCustomer.patid);
        if (treater) {
          // Get therapist details
          const therapists = await getTherapists();
          const therapist = therapists.find(t => t.id === treater.provider.toString());
          if (therapist) {
            assignedTherapist = {
              providerId: treater.provider,
              name: therapist.name,
              specialty: therapist.specialty
            };
          }
        }
      } catch (error) {
        console.warn('Could not get treater information:', error);
      }

      // Get appointment count
      let appointmentCount = 0;
      try {
        const appointments = await getAppointments({ patid: vitabyteCustomer.patid });
        if (appointments?.result && Array.isArray(appointments.result)) {
          appointmentCount = appointments.result.length;
        }
      } catch (error) {
        console.warn('Could not get appointment count:', error);
      }

      // Create enhanced Vitabyte patient data
      const vitabyteData: VitabytePatientData = {
        ...vitabyteCustomer,
        assignedTherapist,
        appointmentCount,
        lastSync: new Date()
      };

      setVitabytePatient(vitabyteData);
      console.log('✅ Vitabyte data updated:', vitabyteData);

      // Show success message with patient data found
      const welcomeMessage = assignedTherapist 
        ? `Willkommen zurück! Therapeut: ${assignedTherapist.name}` 
        : `Patientendaten erfolgreich verknüpft!`;
      
      toast.success(welcomeMessage, {
        description: appointmentCount > 0 ? `${appointmentCount} Termine gefunden` : undefined
      });

    } catch (error) {
      console.error('❌ Error looking up Vitabyte data:', error);
      
      // Show error message only for actual API failures
      toast.error("Fehler beim Laden der Patientendaten", {
        description: "Bitte versuchen Sie es später erneut oder kontaktieren Sie die Praxis."
      });
      
      // Set null to indicate failed lookup
      setVitabytePatient(null);
    } finally {
      setVitabyteLoading(false);
    }
  };

  // Auto-lookup Vitabyte data when patient email changes
  useEffect(() => {
    if (patient?.email && isAuthenticated) {
      // Small delay to ensure patient state is fully set
      const timer = setTimeout(() => {
        lookupVitabyteData(patient.email);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setVitabytePatient(null);
    }
  }, [patient?.email, isAuthenticated]);
  
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
          setVitabytePatient(null);
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
        toast.success(`Willkommen zurück, ${displayName}! Ihre Patientendaten werden geladen...`);
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
      
      // Direct signup without email verification/OTP
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Skip email confirmation - auto-confirm the user
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
      
      // If signup is successful, automatically log the user in
      if (data.user) {
        toast.success(`Registrierung erfolgreich! Willkommen, ${name}!`);
        navigate('/appointments');
      } else {
        throw new Error('Registrierung fehlgeschlagen');
      }
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  

  
  const refreshVitabyteData = async () => {
    if (!patient?.email) {
      console.log('No patient email available for Vitabyte lookup');
      return;
    }

    await lookupVitabyteData(patient.email);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setPatient(null);
      setVitabytePatient(null);
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
      vitabytePatient,
      user,
      session,
      loading,
      vitabyteLoading,
      login, 
      signup,
      logout,
      refreshVitabyteData
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
