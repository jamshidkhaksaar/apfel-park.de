"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "./ThemeProvider";
import { shouldBypassImageOptimization, useBranding } from "./BrandingProvider";

type LanguageContextType = {
  switchLanguage: (newPath: string, newLocale: string) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguageSwitch = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguageSwitch must be used within LanguageTransitionProvider");
  return context;
};

// Theme-specific colors
const themeColors = {
  dark: {
    wave1: "#b88744",
    wave2: "#ebc378",
    wave3: "#0b0b0e",
    accent: "#ebc378",
    accentGlow: "rgba(235, 195, 120, 0.35)",
  },
  mono: {
    wave1: "#3a3a3c",
    wave2: "#e0e0e3",
    wave3: "#fcfbf9",
    accent: "#d6a95e",
    accentGlow: "rgba(214, 169, 94, 0.25)",
  },
};

export default function LanguageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const pendingPathRef = useRef<string | null>(null);
  const timersRef = useRef<number[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const branding = useBranding();
  
  // Get theme colors
  const colors = themeColors[theme];
  const logoSrc = theme === "dark" ? branding.logoWhite : branding.logo;

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const switchLanguage = (newPath: string, newLocale: string) => {
    if (isSwitching) return;

    clearTimers();
    pendingPathRef.current = newPath;
    setIsSwitching(true);
    
    // Start wave animation
    requestAnimationFrame(() => {
      setShowContent(true);
    });

    document.cookie = `apfel-lang=${newLocale}; path=/; max-age=31536000`;
    timersRef.current.push(window.setTimeout(() => router.push(newPath), 700));

    // Never leave the overlay active if navigation fails or is interrupted.
    timersRef.current.push(window.setTimeout(() => {
      pendingPathRef.current = null;
      setShowContent(false);
      setIsSwitching(false);
    }, 5000));
  };

  useEffect(() => {
    if (!isSwitching || pathname !== pendingPathRef.current) return;

    clearTimers();
    timersRef.current.push(window.setTimeout(() => setShowContent(false), 250));
    timersRef.current.push(window.setTimeout(() => {
      pendingPathRef.current = null;
      setIsSwitching(false);
    }, 1450));
  }, [pathname, isSwitching]);

  useEffect(() => () => clearTimers(), []);

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
      
      {/* Wave Transition Container */}
      <div className="fixed inset-0 z-[2147483647] pointer-events-none flex flex-col justify-end overflow-hidden">
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-0 transition-opacity duration-200 ${showContent ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundColor: colors.wave3 }}
        />
        
        {/* Wave 1: Deep Color (Back) */}
        <div 
          className={`absolute inset-0 z-10 transition-transform duration-[1200ms] ease-in-out
            ${showContent ? "translate-y-[-10%]" : "translate-y-[110%]"}
            ${!isSwitching && !showContent ? "translate-y-[-200%]" : ""} 
          `}
        >
          {/* Wave Shape SVG */}
          <div className="absolute -top-[120px] left-0 w-full h-[150px] rotate-180">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full" style={{ fill: colors.wave1 }}>
              <path fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="h-full w-full" style={{ backgroundColor: colors.wave1 }} />
        </div>

        {/* Wave 2: Bright Color (Middle) */}
        <div 
          className={`absolute inset-0 z-20 transition-transform duration-[1200ms] delay-[100ms] ease-in-out
            ${showContent ? "translate-y-0" : "translate-y-[110%]"}
          `}
        >
           <div className="absolute -top-[120px] left-0 w-full h-[150px] rotate-180">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full" style={{ fill: colors.wave2 }}>
              <path fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="h-full w-full" style={{ backgroundColor: colors.wave2 }} />
        </div>

        {/* Wave 3: Main Background Color (Front/Main) */}
        <div 
          className={`absolute inset-0 z-30 transition-transform duration-[1200ms] delay-[200ms] ease-in-out
            ${showContent ? "translate-y-0" : "translate-y-[110%]"}
          `}
        >
           <div className="absolute -top-[120px] left-0 w-full h-[150px] rotate-180">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full" style={{ fill: colors.wave3 }}>
              <path fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div 
            className="h-full w-full flex flex-col items-center justify-center relative"
            style={{ backgroundColor: colors.wave3 }}
          >
            
            {/* Content on Background */}
            <div 
              className={`flex flex-col items-center gap-6 transition-all duration-700 delay-500
                ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}
              `}
            >
              {/* Logo with Accent Ring */}
              <div 
                className="relative h-28 w-28 rounded-full p-4"
                style={{ 
                  borderWidth: '4px',
                  borderStyle: 'solid',
                  borderColor: colors.accent,
                  backgroundColor: colors.wave3,
                  boxShadow: `0 0 50px ${colors.accentGlow}`,
                }}
              >
                <Image
                  src={logoSrc}
                  alt="Loading"
                  width={100}
                  height={100}
                  className="h-full w-full rounded-full object-cover opacity-90"
                  unoptimized={shouldBypassImageOptimization(logoSrc)}
                />
                <div 
                  className="absolute -inset-1 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: colors.accent }}
                />
              </div>

              {/* Text */}
              <h2 
                className="text-3xl font-bold tracking-widest drop-shadow-md"
                style={{ color: colors.accent }}
              >
                APFEL PARK
              </h2>
            </div>
          </div>
        </div>

      </div>
    </LanguageContext.Provider>
  );
}
