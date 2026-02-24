"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";

type LoadingScreenProps = {
  onLoadingComplete?: () => void;
  minDisplayTime?: number;
};

export default function LoadingScreen({
  onLoadingComplete,
  minDisplayTime = 2000,
}: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete?.();
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div className="loading-screen">
      {/* Background effects */}
      <div className="loading-bg-effects">
        <div className="loading-glow loading-glow-1" />
        <div className="loading-glow loading-glow-2" />
        <div className="loading-particles" />
      </div>

      {/* Main content */}
      <div className="loading-content">
        {/* Logo container with shining border */}
        <div className="loading-logo-wrapper">
          {/* Shining border ring */}
          <div className="loading-ring">
            <div className="loading-ring-shine" />
          </div>
          
          {/* Logo with flip animation */}
          <div className="loading-logo-flipper">
            <div className="loading-logo">
              <Logo size="xl" className="h-[140px] w-[140px]" priority />
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="loading-text-container">
          <span className="loading-text">Apfel Park</span>
          <div className="loading-dots">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        </div>

        {/* Tagline */}
        <p className="loading-tagline">Premium Smartphone Repair</p>
      </div>
    </div>
  );
}
