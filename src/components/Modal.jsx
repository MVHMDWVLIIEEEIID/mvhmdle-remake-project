import { useEffect } from "react";

export default function Modal({
  isOpen,
  onClose,
  onShare,
  onNext,
  title,
  children,
  footer,
  status, // "success", "error", or "warning"
}) {
  // --- Handle Keyboard Shortcuts ---
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        if (e.repeat) return;
        e.preventDefault();
        e.stopPropagation();
        if (onNext) onNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (onClose) onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onNext, onClose]);

  const visibilityClass = isOpen
    ? "opacity-100 pointer-events-auto backdrop-blur-xl"
    : "opacity-0 pointer-events-none backdrop-blur-none";

  const modalTransform = isOpen ? "animate-modalIn" : "animate-modalOut";

  // --- Dynamic Styling based on Status ---
  let statusColor = "text-gameRed";
  let statusBorder = "border-gameRed/50 shadow-[0_0_40px_rgba(255,50,50,0.1)]";

  if (status === "success") {
    statusColor = "text-gameGreen";
    statusBorder = "border-gameGreen/50 shadow-[0_0_40px_rgba(0,255,100,0.1)]";
  } else if (status === "warning") {
    // Yellow Styling for "Lost Heart"
    statusColor = "text-gameYellow";
    statusBorder =
      "border-gameYellow/50 shadow-[0_0_40px_rgba(250,204,21,0.1)]";
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${visibilityClass}`}
    >
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />

      <div
        className={`relative w-full max-w-md rounded-3xl bg-[#0a0a0a] border-2 p-8 transition-colors duration-500 ${statusBorder} ${modalTransform}`}
      >
        {/* Header with Centered Title */}
        <div className="relative flex items-center justify-center mb-10 h-10">
          <h2
            className={`text-3xl font-black tracking-tighter uppercase text-center ${statusColor}`}
          >
            {title}
          </h2>

          {/* Circular Close Button at Top Right */}
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

        {/* Content Area */}
        <div className="text-white mb-10">{children}</div>

        {/* Footer */}
        {footer ? (
          <div className="flex gap-4">{footer}</div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={onShare}
              className="w-full bg-gameDark border-2 border-gameGreen text-gameGreen font-black py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg uppercase text-sm tracking-widest"
            >
              Share
            </button>
            <button
              onClick={onNext}
              className={`w-full text-gameDark font-black py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg uppercase text-sm tracking-widest ${
                status === "success"
                  ? "bg-gameGreen shadow-gameGreen/20"
                  : status === "warning"
                    ? "bg-gameYellow shadow-gameYellow/20"
                    : "bg-gameRed shadow-gameRed/20"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
