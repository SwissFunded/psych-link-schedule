
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the login page
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-psychPurple/5">
      <div className="animate-pulse">
        <p className="text-psychText/50">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
