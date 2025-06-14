import { useLanguage, type Language } from '../contexts/LanguageContext';

// Simple translation dictionary - you can expand this as needed
const translations: Record<Language, Record<string, string>> = {
  de: {
    // Navigation
    'nav.appointments': 'Termine',
    'nav.book': 'Buchen',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    
    // Common
    'common.loading': 'Ihre Informationen werden geladen...',
    'common.logout': 'Abmelden',
    'common.back_to_login': 'Zurück zum Login',
    
    // Auth
    'auth.required': 'Authentifizierung erforderlich',
    'auth.use_login_link': 'Bitte nutzen Sie Ihren Login-Link, um auf Ihre Termine zuzugreifen.',
    'auth.please_login': 'Bitte melden Sie sich an',
  },
  en: {
    // Navigation
    'nav.appointments': 'Appointments',
    'nav.book': 'Book',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    
    // Common
    'common.loading': 'Loading your information...',
    'common.logout': 'Logout',
    'common.back_to_login': 'Back to Login',
    
    // Auth
    'auth.required': 'Authentication Required',
    'auth.use_login_link': 'Please use your login link to access your appointments.',
    'auth.please_login': 'Please log in',
  },
  it: {
    // Navigation
    'nav.appointments': 'Appuntamenti',
    'nav.book': 'Prenota',
    'nav.profile': 'Profilo',
    'nav.admin': 'Admin',
    
    // Common
    'common.loading': 'Caricamento delle tue informazioni...',
    'common.logout': 'Disconnetti',
    'common.back_to_login': 'Torna al Login',
    
    // Auth
    'auth.required': 'Autenticazione Richiesta',
    'auth.use_login_link': 'Utilizza il tuo link di accesso per accedere ai tuoi appuntamenti.',
    'auth.please_login': 'Effettua il login',
  },
  fr: {
    // Navigation
    'nav.appointments': 'Rendez-vous',
    'nav.book': 'Réserver',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    
    // Common
    'common.loading': 'Chargement de vos informations...',
    'common.logout': 'Déconnexion',
    'common.back_to_login': 'Retour à la connexion',
    
    // Auth
    'auth.required': 'Authentification Requise',
    'auth.use_login_link': 'Veuillez utiliser votre lien de connexion pour accéder à vos rendez-vous.',
    'auth.please_login': 'Veuillez vous connecter',
  },
  es: {
    // Navigation
    'nav.appointments': 'Citas',
    'nav.book': 'Reservar',
    'nav.profile': 'Perfil',
    'nav.admin': 'Admin',
    
    // Common
    'common.loading': 'Cargando tu información...',
    'common.logout': 'Cerrar sesión',
    'common.back_to_login': 'Volver al Login',
    
    // Auth
    'auth.required': 'Autenticación Requerida',
    'auth.use_login_link': 'Por favor, usa tu enlace de acceso para acceder a tus citas.',
    'auth.please_login': 'Por favor, inicia sesión',
  },
};

export const useTranslation = () => {
  const { currentLanguage } = useLanguage();
  
  const t = (key: string, fallback?: string): string => {
    const translation = translations[currentLanguage]?.[key];
    return translation || fallback || key;
  };
  
  return { t, currentLanguage };
}; 