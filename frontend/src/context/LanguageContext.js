import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import en from "../translations/en.json";
import gu from "../translations/gu.json";
import bilingual from "../translations/bilingual.json";

const LanguageContext = createContext();

const translations = {
  en,
  gu,
  bilingual
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("pos_language") || "en";
  });

  const changeLanguage = useCallback((newLang) => {
    if (translations[newLang]) {
      setLanguageState(newLang);
      localStorage.setItem("pos_language", newLang);
    }
  }, []);

  const t = useCallback((key) => {
    const dict = translations[language] || translations["en"];
    return dict[key] || translations["en"][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
