"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

type AppWrapperProps = {
  children: React.ReactNode;
};

export default function AppWrapper({ children }: AppWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasLoaded = sessionStorage.getItem("apfel-loaded");
    
    if (hasLoaded) {
      setIsLoading(false);
      setShowContent(true);
    } else {
      // First visit - show loading screen
      setShowContent(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    sessionStorage.setItem("apfel-loaded", "true");
  };

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} minDisplayTime={2500} />}
      <div
        className={`transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        {showContent && children}
      </div>
    </>
  );
}
