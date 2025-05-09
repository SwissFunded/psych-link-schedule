
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-psychPurple/5">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-bold mb-4 text-psychPurple">404</h1>
        <p className="text-xl text-psychText mb-4">Oops! Page not found</p>
        <p className="text-psychText/70 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button asChild>
          <a href="/" className="bg-psychPurple hover:bg-psychPurple/90">
            Return to Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
