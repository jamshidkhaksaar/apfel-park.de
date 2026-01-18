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
    
    // Start entrance animation - sequence layers
    requestAnimationFrame(() => {
      setShowContent(true);
    });

    // Wait for animation to cover screen (longer for elegance)
    await new Promise(r => setTimeout(r, 1000));
    
    // Update cookie and navigate
    document.cookie = `apfel-lang=${newLocale}; path=/; max-age=31536000`;
    router.push(newPath);
  };

  useEffect(() => {
    if (isSwitching) {
      // Navigation happened
      const timer = setTimeout(() => {
        setShowContent(false);
        // Wait for exit animation to finish
        setTimeout(() => setIsSwitching(false), 1000);
      }, 600);
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
      
      {/* Transition Overlay Container */}
      <div className="fixed inset-0 z-[10000] pointer-events-none flex flex-col justify-end">
        
        {/* Layer 1: Dark Bronze (Background) */}
        <div 
          className={`absolute inset-0 bg-neutral-900 transition-transform duration-[800ms] ease-[cubic-bezier(0.65,0,0.35,1)]
            ${showContent ? "translate-y-0" : "translate-y-full"}
          `}
          style={{ zIndex: 10001 }}
        />

        {/* Layer 2: Deep Gold (Middle) */}
        <div 
          className={`absolute inset-0 bg-[#b45309] transition-transform duration-[800ms] delay-[50ms] ease-[cubic-bezier(0.65,0,0.35,1)]
            ${showContent ? "translate-y-0" : "translate-y-full"}
          `}
          style={{ zIndex: 10002 }}
        />

        {/* Layer 3: Bright Gold (Foreground) */}
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-[#f59e0b] transition-transform duration-[800ms] delay-[100ms] ease-[cubic-bezier(0.65,0,0.35,1)]
            ${showContent ? "translate-y-0" : "translate-y-full"}
          `}
          style={{ zIndex: 10003 }}
        >
          {/* Decorative Pattern on Top Layer */}
          <div className="absolute inset-0 opacity-10" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 2px, transparent 2px)', 
                 backgroundSize: '40px 40px' 
               }} 
          />
          
          {/* Center Content */}
          <div 
            className={`relative flex flex-col items-center gap-6 transition-all duration-500 delay-300
              ${showContent ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10"}
            `}
          >
            {/* Logo Container */}
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-black/10 p-5 shadow-2xl backdrop-blur-sm ring-1 ring-white/20">
               <Image
                  src="/branding/logo.jpg"
                  alt="Apfel Park"
                  width={96}
                  height={96}
                  className="h-full w-full object-contain drop-shadow-lg"
               />
               
               {/* Shining Sheen Animation */}
               <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>

            {/* Elegant Text */}
            <div className="text-center">
              <p className="font-display text-2xl font-bold tracking-widest text-white drop-shadow-sm">
                APFEL PARK
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="h-0.5 w-8 rounded-full bg-white/50" />
                <span className="text-xs font-medium uppercase tracking-widest text-white/80">Loading</span>
                <span className="h-0.5 w-8 rounded-full bg-white/50" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </LanguageContext.Provider>
  );
}
