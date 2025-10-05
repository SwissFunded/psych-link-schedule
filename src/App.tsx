
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

// Lazy load components to reduce initial bundle size
const Appointments = lazy(() => import("./pages/Appointments"));
const Book = lazy(() => import("./pages/Book"));
const Reschedule = lazy(() => import("./pages/Reschedule"));
const Profile = lazy(() => import("./pages/Profile"));
const GoogleCalendarCallback = lazy(() => import("./pages/GoogleCalendarCallback"));

// Create a fallback loading component
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-3 border-psychText/30 border-t-transparent animate-spin"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
        <Route path="/appointments" element={
          <Suspense fallback={<PageLoading />}>
            <Appointments />
          </Suspense>
        } />
        <Route path="/termine" element={<Navigate to="/appointments" replace />} />
        <Route path="/book" element={
          <Suspense fallback={<PageLoading />}>
            <Book />
          </Suspense>
        } />
        <Route path="/buchen" element={<Navigate to="/book" replace />} />
        <Route path="/reschedule/:appointmentId" element={
          <Suspense fallback={<PageLoading />}>
            <Reschedule />
          </Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={<PageLoading />}>
            <Profile />
          </Suspense>
        } />
        <Route path="/profil" element={<Navigate to="/profile" replace />} />
        <Route path="/oauth/google/callback" element={
          <Suspense fallback={<PageLoading />}>
            <GoogleCalendarCallback />
          </Suspense>
        } />
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
