
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Calendar, Clock, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout, loading, patient } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-psychPurple/5">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-psychPurple/20 mb-4"></div>
          <div className="h-4 w-48 bg-psychPurple/20 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated && location.pathname !== '/') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-psychPurple/5 p-4">
        <h2 className="text-2xl font-semibold mb-4 text-center">Authentication Required</h2>
        <p className="text-center mb-6 text-psychText/70">Please use your login link to access your appointments.</p>
        <Button onClick={() => window.location.href = '/'}>
          Return to Login
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && (
        <header className="bg-white border-b border-psychPurple/10 py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <div className="font-medium text-lg text-psychPurple hidden sm:block">PsychCentral</div>
            </div>
            
            <div className="flex items-center">
              <div className="hidden md:flex mr-6">
                <div className="text-right">
                  <p className="font-medium text-sm">{patient?.name}</p>
                  <p className="text-xs text-psychText/70">{patient?.email}</p>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={logout} 
                title="Logout"
                className="text-psychText/70 hover:text-psychText hover:bg-psychPurple/5"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </header>
      )}
      
      <main className="flex-1 bg-psychPurple/5">
        {children}
      </main>
      
      {isAuthenticated && (
        <nav className="bg-white border-t border-psychPurple/10 py-2 md:hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={location.pathname === '/appointments' ? 'text-psychPurple' : 'text-psychText/70'}
              >
                <a href="/appointments">
                  <Calendar size={20} />
                </a>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={location.pathname === '/book' ? 'text-psychPurple' : 'text-psychText/70'}
              >
                <a href="/book">
                  <Clock size={20} />
                </a>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={location.pathname === '/profile' ? 'text-psychPurple' : 'text-psychText/70'}
              >
                <a href="/profile">
                  <User size={20} />
                </a>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
