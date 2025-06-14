import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Calendar, Clock, LogOut, UserCircle, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { Logo } from '@/components/ui/logo';
import { MobileNav } from '@/components/ui/mobile-nav';
import { LanguageDropdown } from '@/components/ui/LanguageDropdown';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout, loading, patient } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Add a safety redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && location.pathname !== '/') {
      toast.error(t('auth.please_login'));
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, location.pathname, navigate, t]);
  
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
          <div className="text-psychText/60 font-gt-pressura">{t('common.loading')}</div>
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
          <h2 className="text-xl font-gt-pressura mb-4 text-center">{t('auth.required')}</h2>
          <p className="text-center mb-6 text-psychText/70 font-gt-pressura">{t('auth.use_login_link')}</p>
          <Button 
            onClick={() => navigate('/')} 
            className="w-full bg-psychText hover:bg-psychText/90 font-gt-pressura"
          >
            {t('common.back_to_login')}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Animation variants
  const navItemVariants = {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 }
  };

  // Navigation items for both desktop and mobile
  const navItems = [
    { name: t('nav.appointments'), url: "/appointments", icon: Calendar },
    { name: t('nav.book'), url: "/book", icon: Clock },
    { name: t('nav.profile'), url: "/profile", icon: UserCircle },
  ];

  // Add admin navigation for authorized user
  const isAdmin = patient?.email === 'miromw@icloud.com';
  if (isAdmin) {
    navItems.push({ name: t('nav.admin'), url: "/admin/appointments", icon: Code });
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && (
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.19, 1.0, 0.22, 1.0] }}
          className="bg-white/95 backdrop-blur-lg border-b border-psychText/5 py-3 px-4 sm:px-6 sticky top-0 z-40 shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/appointments" className="flex items-center group">
                <motion.div 
                  initial={{ x: -10, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="overflow-hidden"
                >
                  <Logo />
                </motion.div>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <NavigationMenu>
                  <NavigationMenuList className="space-x-1">
                    {navItems.map((item) => (
                      <motion.div
                        key={item.url}
                        initial="initial"
                        animate="animate"
                        variants={navItemVariants}
                      >
                        <NavigationMenuItem>
                          <Link
                            to={item.url}
                            className={cn(
                              "inline-flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200",
                              location.pathname === item.url 
                              ? "bg-psychPurple/10 text-psychPurple shadow-sm" 
                              : "text-psychText/70 hover:bg-psychPurple/5 hover:text-psychPurple"
                            )}
                          >
                            <item.icon size={18} className="mr-2" />
                            {item.name}
                          </Link>
                        </NavigationMenuItem>
                      </motion.div>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
            
            {/* Language Dropdown and User Menu */}
            <AnimatePresence>
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <LanguageDropdown />
                <Menubar className="border-none bg-transparent">
                  <MenubarMenu>
                    <MenubarTrigger className="flex items-center space-x-2 rounded-lg border border-psychText/10 px-3 py-2 hover:bg-psychPurple/5 data-[state=open]:bg-psychPurple/5 transition-all duration-200">
                      <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-sm font-medium">{patient?.name}</span>
                        <span className="text-xs text-psychText/60">{patient?.email}</span>
                      </div>
                      <Avatar className="h-8 w-8 ring-2 ring-psychPurple/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient?.name}`} alt={patient?.name} />
                        <AvatarFallback className="bg-psychPurple text-white text-sm font-medium">
                          {patient?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </MenubarTrigger>
                    <MenubarContent className="min-w-[200px] mr-2 mt-2 rounded-lg border border-psychText/10 shadow-lg">
                      <div className="sm:hidden px-3 py-2 mb-2 border-b border-psychText/10">
                        <div className="font-medium text-sm">{patient?.name}</div>
                        <div className="text-xs text-psychText/70 truncate">{patient?.email}</div>
                      </div>
                      <MenubarItem 
                        className="flex items-center cursor-pointer font-medium px-3 py-2 hover:bg-psychPurple/5 rounded-md mx-1 transition-colors" 
                        onClick={logout}
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>{t('common.logout')}</span>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.header>
      )}
      
      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "flex-1 bg-gradient-to-br from-psychPurple/5 to-psychBeige/50",
          // Add bottom padding on mobile to account for floating nav
          isAuthenticated && "pb-24 md:pb-0"
        )}
      >
        <PageTransition>{children}</PageTransition>
      </motion.main>
      
      {/* Mobile Navigation */}
      {isAuthenticated && (
        <MobileNav items={navItems} />
      )}
    </div>
  );
}
