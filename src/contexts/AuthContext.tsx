
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
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        
        if (token) {
          await login(token);
          
          // Remove token from URL for security
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } else {
          // Check for stored token
          const storedToken = localStorage.getItem('psychcentral_token');
          if (storedToken) {
            await login(storedToken);
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
  
  const login = async (token: string) => {
    try {
      setLoading(true);
      
      // Mock API call to validate token and get user data
      // In a real app, this would verify the token with your backend
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For demo purposes, we'll create a mock user based on token
      const mockPatient = {
        id: "p-" + Math.random().toString(36).substr(2, 9),
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "(555) 123-4567"
      };
      
      // Store token
      localStorage.setItem('psychcentral_token', token);
      
      // Update state
      setPatient(mockPatient);
      setIsAuthenticated(true);
      
      // Navigate to appointments page
      navigate('/appointments');
      
      toast.success("Welcome back, " + mockPatient.name);
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Authentication failed");
      logout();
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    localStorage.removeItem('psychcentral_token');
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
