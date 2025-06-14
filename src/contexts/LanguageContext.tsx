import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'de' | 'en' | 'it' | 'fr' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  getCurrentLanguageOption: () => LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('de'); // Default to German

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    // Store in localStorage for persistence
    localStorage.setItem('selectedLanguage', language);
  };

  const getCurrentLanguageOption = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  // Load saved language on mount
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language;
    if (savedLanguage && languages.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      getCurrentLanguageOption,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}; 