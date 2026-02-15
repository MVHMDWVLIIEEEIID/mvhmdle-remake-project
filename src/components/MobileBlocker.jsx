import React, { useState, useEffect } from "react";

export default function MobileBlocker({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // Check for width < 1024px (Tablets/Mobile) OR height < 600px (Landscape Mobile)
      const isSmallScreen =
        window.innerWidth < 1024 || window.innerHeight < 600;
      setIsMobile(isSmallScreen);
    };

    // Initial check
    checkScreenSize();

    // Listener
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-9999 bg-gameDark flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="mb-6 animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 text-gameRed"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-gameRed mb-4">
          Desktop Only
        </h1>
        <p className="text-white/60 max-w-md text-sm font-mono leading-relaxed">
          This experience is designed for larger screens. <br />
          Please open this application on your PC or Laptop for the best
          gameplay.
        </p>
        <div className="mt-8 px-4 py-2 bg-white/5 rounded-lg border-2 border-gameRed">
          <span className="text-xs uppercase font-bold text-gameRed/80 tracking-widest">
            GET A PC U STUPID NIGGER
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
