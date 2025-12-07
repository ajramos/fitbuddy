"use client";

import { createContext, useContext, ReactNode } from "react";
import { dictionaries, Locale } from "@/lib/i18n/dictionaries";

interface LanguageContextType {
    language: Locale;
    dict: typeof dictionaries['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
    children,
    initialLanguage = 'en'
}: {
    children: ReactNode;
    initialLanguage?: string;
}) {
    // Normalize language to supported locales
    const language = (initialLanguage === 'es' ? 'es' : 'en') as Locale;
    const dict = dictionaries[language];

    return (
        <LanguageContext.Provider value={{ language, dict }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
