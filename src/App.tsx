import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AnimatePresence } from "framer-motion";

import Login from "./pages/Login";
import Appointments from "./pages/Appointments";
import Book from "./pages/Book";
import Reschedule from "./pages/Reschedule";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// AnimationRoutes component to handle route transitions
const AnimationRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login />} />
        <Route path="/index" element={<Index />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/termine" element={<Navigate to="/appointments" replace />} />
        <Route path="/book" element={<Book />} />
        <Route path="/buchen" element={<Navigate to="/book" replace />} />
        <Route path="/reschedule/:appointmentId" element={<Reschedule />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profil" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" closeButton className="sonner-premium" />
      <BrowserRouter>
        <AuthProvider>
          <AnimationRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
