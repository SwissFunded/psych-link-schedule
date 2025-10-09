import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, LogOut, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout, loading, patient } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Add a safety redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && location.pathname !== '/') {
      toast.error("Bitte melden Sie sich an");
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, location.pathname, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-10 h-10 rounded-full border-3 border-psychText/30 border-t-transparent animate-spin mb-4"></div>
          <div className="text-psychText/60 font-gt-pressura">Ihre Informationen werden geladen...</div>
        </motion.div>
      </div>
    );
  }
  
  if (!isAuthenticated && location.pathname !== '/') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-psychPurple/5 to-psychPurple/10 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-md p-8 shadow-md max-w-md w-full"
        >
          <div className="flex justify-center mb-6">
            <Logo variant="full" />
          </div>
          <h2 className="text-xl font-gt-pressura mb-4 text-center">Authentifizierung erforderlich</h2>
          <p className="text-center mb-6 text-psychText/70 font-gt-pressura">Bitte nutzen Sie Ihren Login-Link, um auf Ihre Termine zuzugreifen.</p>
          <Button onClick={() => navigate('/', { replace: true })} className="w-full bg-psychText hover:bg-psychText/90 font-gt-pressura">
            Zurück zum Login
          </Button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Desktop navigation items
  const navItems = [
    { name: "Termine", path: "/termine", icon: <Calendar size={18} className="mr-1.5" /> },
    { name: "Buchen", path: "/buchen", icon: <Clock size={18} className="mr-1.5" /> },
    { name: "Profil", path: "/profil", icon: <UserCircle size={18} className="mr-1.5" /> }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && (
        <header 
          className="bg-white/95 backdrop-blur-lg border-b border-psychText/5 py-3 px-4 sm:px-6 sticky top-0 z-10 shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/termine" className="flex items-center group">
                <div className="overflow-hidden">
                  <Logo />
                </div>
              </Link>
              
              <div className="hidden md:block">
                <NavigationMenu>
                  <NavigationMenuList className="space-x-1">
                    {navItems.map((item) => (
                      <NavigationMenuItem key={item.path}>
                        <Link
                          to={item.path}
                          className={cn(
                            "inline-flex items-center rounded-md px-3 py-2 text-sm font-gt-pressura transition-colors",
                            location.pathname === item.path 
                            ? "bg-psychText/5 text-psychText" 
                            : "text-psychText/70 hover:bg-psychText/5 hover:text-psychText"
                          )}
                        >
                          {item.icon}
                          {item.name}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
            
            <div className="flex items-center">
              <Menubar className="border-none bg-transparent">
                  <MenubarMenu>
                    <MenubarTrigger className="flex items-center space-x-2 rounded-md border border-psychText/10 px-3 py-1.5 hover:bg-psychText/5 data-[state=open]:bg-psychText/5">
                      <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-sm font-gt-pressura">{patient?.name}</span>
                        <span className="text-xs text-psychText/60">{patient?.email}</span>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient?.name}`} alt={patient?.name} />
                        <AvatarFallback className="bg-psychText text-white">
                          {patient?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </MenubarTrigger>
                    <MenubarContent className="min-w-[180px] mr-2 mt-1">
                      <div className="md:hidden px-2 py-1.5 mb-2">
                        <div className="font-gt-pressura text-sm">{patient?.name}</div>
                        <div className="text-xs text-psychText/70 truncate">{patient?.email}</div>
                      </div>
                      <MenubarItem className="flex items-center cursor-pointer font-gt-pressura" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Abmelden</span>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </div>
          </div>
        </header>
      )}
      
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 bg-gradient-to-br from-psychPurple/5 to-psychBeige/50 pb-20 md:pb-0"
        style={{
          paddingBottom: 'max(5rem, env(safe-area-inset-bottom))',
        }}
      >
        <PageTransition>{children}</PageTransition>
      </motion.main>
      
      {isAuthenticated && (
        <nav 
          className="bg-white/95 backdrop-blur-lg border-t border-psychText/5 py-3 md:hidden fixed bottom-0 left-0 right-0 z-10 shadow-[0_-1px_5px_rgba(0,0,0,0.05)]"
          style={{
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={`transition-all duration-300 ${location.pathname === '/termine' ? 'text-psychText bg-psychText/5 rounded-md' : 'text-psychText/60'}`}
              >
                <Link to="/termine">
                  <Calendar size={20} />
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={`transition-all duration-300 ${location.pathname === '/buchen' ? 'text-psychText bg-psychText/5 rounded-md' : 'text-psychText/60'}`}
              >
                <Link to="/buchen">
                  <Clock size={20} />
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={`transition-all duration-300 ${location.pathname === '/profil' ? 'text-psychText bg-psychText/5 rounded-md' : 'text-psychText/60'}`}
              >
                <Link to="/profil">
                  <UserCircle size={20} />
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
