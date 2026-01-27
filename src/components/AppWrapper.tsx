"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";
import WhatsAppFloat from "./WhatsAppFloat";
import OceanBackground from "./OceanBackground";

type AppWrapperProps = {
  children: React.ReactNode;
  lang: "de" | "en";
};

export default function AppWrapper({ children, lang }: AppWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasLoaded = sessionStorage.getItem("apfel-loaded");
    
    if (hasLoaded) {
      setIsLoading(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    sessionStorage.setItem("apfel-loaded", "true");
  };

  return (
    <>
      {/* Ocean background effects (only visible on ocean theme) */}
      <OceanBackground />
      
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} minDisplayTime={2500} />}
      <div
        className={`relative z-10 transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
      <WhatsAppFloat lang={lang} />
    </>
  );
}
