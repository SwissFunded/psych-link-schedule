import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  patient: Patient | null;
  loading: boolean;
  login: (token: string, email?: string, silent?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined users for the app
const USERS = {
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
  'jane.smith@example.com': {  // Keep the default user
    id: "p-jane789",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "(555) 246-8101"
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for token in URL on initial load
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Mock token verification
        const token = new URLSearchParams(location.search).get('token');
        const email = new URLSearchParams(location.search).get('email');
        
        if (token) {
          // Login silently (no toast message) during initial check
          await login(token, email || undefined, true);
          
          // Remove token from URL for security
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } else {
          // Check for stored token
          const storedToken = localStorage.getItem('psychcentral_token');
          const storedEmail = localStorage.getItem('psychcentral_email');
          if (storedToken) {
            // Login silently (no toast message) during initial check
            await login(storedToken, storedEmail || undefined, true);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        logout();
      }
    };
    
    checkToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const login = async (token: string, email?: string, silent: boolean = false) => {
    try {
      setLoading(true);
      
      // Store token
      localStorage.setItem('psychcentral_token', token);
      
      let userToLogin: Patient;
      
      if (email && email in USERS) {
        // If email is provided and exists in our predefined users
        userToLogin = USERS[email as keyof typeof USERS];
        localStorage.setItem('psychcentral_email', email);
      } else {
        // Default to Jane Smith if no email is provided or email doesn't match
        userToLogin = USERS['jane.smith@example.com'];
        localStorage.setItem('psychcentral_email', 'jane.smith@example.com');
      }
      
      // Update state
      setPatient(userToLogin);
      setIsAuthenticated(true);
      
      // Navigate to appointments page
      navigate('/appointments');
      
      // Only show welcome toast when not in silent mode
      if (!silent) {
        toast.success("Welcome back, " + userToLogin.name);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Only show error toast when not in silent mode
      if (!silent) {
        toast.error("Authentication failed");
      }
      logout();
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('psychcentral_token');
    localStorage.removeItem('psychcentral_email');
    setIsAuthenticated(false);
    setPatient(null);
    setLoading(false);
    navigate('/');
    toast.info("You've been logged out");
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, patient, loading, login, logout }}>
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
