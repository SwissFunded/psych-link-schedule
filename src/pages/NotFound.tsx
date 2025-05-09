
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Fehler: Benutzer hat versucht, eine nicht existierende Route aufzurufen:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-psychPurple/5">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-bold mb-4 text-psychPurple">404</h1>
        <p className="text-xl text-psychText mb-4">Hoppla! Seite nicht gefunden</p>
        <p className="text-psychText/70 mb-8">
          Die gesuchte Seite wurde möglicherweise entfernt, umbenannt oder ist vorübergehend nicht verfügbar.
        </p>
        <Button asChild>
          <a href="/" className="bg-psychPurple hover:bg-psychPurple/90">
            Zurück zur Startseite
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
