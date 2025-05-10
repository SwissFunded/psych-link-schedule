
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Fehler: Benutzer hat versucht, eine nicht existierende Route aufzurufen:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-psychBeige/30">
      <div className="text-center max-w-xl px-4">
        <div className="flex justify-center mb-8">
          <Logo variant="default" className="transform scale-75" />
        </div>
        <h1 className="text-4xl font-gt-pressura mb-4 text-psychText">404</h1>
        <p className="text-xl text-psychText mb-4 font-gt-pressura">Hoppla! Seite nicht gefunden</p>
        <p className="text-psychText/70 mb-8">
          Die gesuchte Seite wurde möglicherweise entfernt, umbenannt oder ist vorübergehend nicht verfügbar.
        </p>
        <Button asChild>
          <a href="/" className="bg-psychText hover:bg-psychText/90">
            Zurück zur Startseite
          </a>
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
