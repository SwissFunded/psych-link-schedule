
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const handleAuth = async () => {
      // Check for token in URL
      const token = new URLSearchParams(location.search).get('token');
      const email = new URLSearchParams(location.search).get('email');
      
      if (token && email) {
        await login(token, email);
      } else {
        // If no token in URL, redirect to login
        navigate('/');
      }
      setIsLoading(false);
    };
    
    handleAuth();
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-psychPurple/5">
      <div className={`transition-all duration-500 ${isLoading ? 'scale-105 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-psychPurple border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-psychText/50 animate-pulse">Authenticating...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
