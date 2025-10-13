import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2024'; // Change this!

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check if already authenticated in session
    const adminAuth = sessionStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

