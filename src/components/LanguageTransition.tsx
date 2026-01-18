"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

type LanguageContextType = {
  switchLanguage: (newPath: string, newLocale: string) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguageSwitch = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguageSwitch must be used within LanguageTransitionProvider");
  return context;
};

export default function LanguageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = async (newPath: string, newLocale: string) => {
    setIsSwitching(true);
    
    // Start entrance animation
    setTimeout(() => setShowContent(true), 50);

    // Wait for full coverage
    await new Promise(r => setTimeout(r, 800));
    
    // Update cookie and navigate
    document.cookie = `apfel-lang=${newLocale}; path=/; max-age=31536000`;
    router.push(newPath);
  };

  useEffect(() => {
    if (isSwitching) {
      // Navigation happened, wait a bit then exit
      const timer = setTimeout(() => {
        setShowContent(false);
        // Wait for exit animation to finish before removing from DOM
        setTimeout(() => setIsSwitching(false), 800);
      }, 500); // Keep showing for 500ms after nav
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!isSwitching && !showContent) {
    return (
      <LanguageContext.Provider value={{ switchLanguage }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ switchLanguage }}>
      {children}
      
      {/* Transition Overlay */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        {/* Backdrop 1: Glass blur */}
        <div 
          className={`absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity duration-500 ease-out
            ${showContent ? "opacity-100" : "opacity-0"}
          `}
        />
        
        {/* Backdrop 2: Gold Wipe */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-gold via-amber to-bronze transition-transform duration-700 ease-in-out
            ${showContent ? "translate-y-0" : "translate-y-full"}
          `}
        />

        {/* Content */}
        <div 
          className={`relative z-10 flex flex-col items-center gap-4 text-white transition-all duration-500 delay-300
            ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"}
          `}
        >
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white/10 p-4 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
             <Image
                src="/branding/logo.jpg"
                alt="Switching..."
                width={80}
                height={80}
                className="h-full w-full object-contain"
             />
             {/* Spinner ring */}
             <div className="absolute inset-0 animate-spin rounded-2xl border-2 border-white/30 border-t-white" />
          </div>
          <p className="font-display text-xl font-bold tracking-widest uppercase text-white drop-shadow-md">
            Switching Language
          </p>
        </div>
      </div>
    </LanguageContext.Provider>
  );
}
