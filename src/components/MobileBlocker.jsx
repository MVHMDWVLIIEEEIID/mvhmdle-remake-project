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
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="w-16 h-16 text-red-600"
          >
            <path
              d="M12 2L1 21H23L12 2Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
            <path
              d="M12 9V14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
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
