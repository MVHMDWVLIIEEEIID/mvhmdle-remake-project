import { useEffect } from "react";

export default function SurvivalGuideCustomModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  const visibilityClass = isOpen
    ? "opacity-100 pointer-events-auto backdrop-blur-xl"
    : "opacity-0 pointer-events-none backdrop-blur-none";
  const modalTransform = isOpen ? "animate-modalIn" : "animate-modalOut";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${visibilityClass}`}
    >
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />

      <div
        className={`relative w-full max-w-3xl rounded-3xl bg-[#0a0a0a] border-2 border-gameBlue/50 p-10 transition-colors duration-500 shadow-[0_0_40px_rgba(52,152,219,0.12)] ${modalTransform}`}
      >
        <div className="relative flex items-center justify-center mb-8 h-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase text-center text-gameBlue">
            Beginner Guide
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 bg-white/5 hover:bg-white/10 text-white rounded-full p-2.5 transition-all active:scale-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/90">
          <div className="rounded-2xl border border-gameBlue/20 bg-white/5 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-gameBlue mb-2">
              Colors
            </p>
            <p className="text-sm">
              Green = Correct Spot, Yellow = Present in The Word, Grey = absent.
            </p>
          </div>
          <div className="rounded-2xl border border-gameBlue/20 bg-white/5 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-gameBlue mb-2">
              Hearts
            </p>
            <p className="text-sm">
              You Start With 3 hearts. If Hearts Hit 0, The Run Ends. (Max
              Hearts To Hold is 5)
            </p>
          </div>
          <div className="rounded-2xl border border-gameBlue/20 bg-white/5 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-gameBlue mb-2">
              Goal
            </p>
            <p className="text-sm">
              Guess the 5-Letter Word Before You Run Out of Turns. || And The
              Goal of The Game is To Get 1,000,000 Cash in One Run
            </p>
          </div>
          <div className="rounded-2xl border border-gameBlue/20 bg-white/5 p-4">
            <p className="text-sm font-black uppercase tracking-wider text-gameBlue mb-2">
              Boss Rounds
            </p>
            <p className="text-sm">
              Every 5th Game is 2-Words Boss, Every 10th Game is 4-Words Boss.
              (4-Words Drop a Heart When Beaten{" "}
              <strong>If Full Stacked Hearts You Get 50K</strong>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
