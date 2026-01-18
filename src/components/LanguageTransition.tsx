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
    
    // Start wave animation
    requestAnimationFrame(() => {
      setShowContent(true);
    });

    // Wait for waves to cover screen (1.2s for slow fluid feel)
    await new Promise(r => setTimeout(r, 1200));
    
    // Update cookie and navigate
    document.cookie = `apfel-lang=${newLocale}; path=/; max-age=31536000`;
    router.push(newPath);
  };

  useEffect(() => {
    if (isSwitching) {
      // Navigation happened
      const timer = setTimeout(() => {
        setShowContent(false);
        // Wait for exit animation
        setTimeout(() => setIsSwitching(false), 1200);
      }, 500);
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
      
      {/* Wave Transition Container */}
      <div className="fixed inset-0 z-[10000] pointer-events-none flex flex-col justify-end overflow-hidden">
        
        {/* Wave 1: Deep Gold (Back) */}
        <div 
          className={`absolute inset-0 z-10 transition-transform duration-[1200ms] ease-in-out
            ${showContent ? "translate-y-[-10%]" : "translate-y-[110%]"}
            ${!isSwitching && !showContent ? "translate-y-[-200%]" : ""} 
          `}
          // On exit (showContent false), we want it to continue moving UP? 
          // Actually with translate-y-[110%] it goes back down.
          // To make it go UP and away, we'd need a different class.
          // For now, let's just make it go back down (tide recedes).
        >
          {/* Wave Shape SVG */}
          <div className="absolute -top-[120px] left-0 w-full h-[150px] rotate-180">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full fill-[#b45309]">
              <path fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="h-full w-full bg-[#b45309]" />
        </div>

        {/* Wave 2: Bright Gold (Middle) */}
        <div 
          className={`absolute inset-0 z-20 transition-transform duration-[1200ms] delay-[100ms] ease-in-out
            ${showContent ? "translate-y-0" : "translate-y-[110%]"}
          `}
        >
           <div className="absolute -top-[120px] left-0 w-full h-[150px] rotate-180">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full fill-[#f59e0b]">
              <path fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="h-full w-full bg-[#f59e0b]" />
        </div>

        {/* Wave 3: Black (Front/Main) */}
        <div 
          className={`absolute inset-0 z-30 transition-transform duration-[1200ms] delay-[200ms] ease-in-out
            ${showContent ? "translate-y-0" : "translate-y-[110%]"}
          `}
        >
           <div className="absolute -top-[120px] left-0 w-full h-[150px] rotate-180">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full fill-[#050505]">
              <path fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="h-full w-full bg-[#050505] flex flex-col items-center justify-center relative">
            
            {/* Content on Black Background */}
            <div 
              className={`flex flex-col items-center gap-6 transition-all duration-700 delay-500
                ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}
              `}
            >
              {/* Logo with Gold Ring */}
              <div className="relative h-28 w-28 rounded-full border-4 border-[#f59e0b] bg-black p-4 shadow-[0_0_50px_rgba(245,158,11,0.4)]">
                <Image
                  src="/branding/logo.jpg"
                  alt="Loading"
                  width={100}
                  height={100}
                  className="h-full w-full rounded-full object-cover opacity-90"
                />
                <div className="absolute -inset-1 animate-spin rounded-full border-2 border-transparent border-t-[#f59e0b]" />
              </div>

              {/* Text */}
              <h2 className="text-3xl font-bold tracking-widest text-[#f59e0b] drop-shadow-md">
                APFEL PARK
              </h2>
            </div>
          </div>
        </div>

      </div>
    </LanguageContext.Provider>
  );
}
