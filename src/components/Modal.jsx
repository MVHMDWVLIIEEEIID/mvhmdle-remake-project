export default function Modal({
  isOpen,
  onClose,
  onShare,
  onNext,
  title,
  children,
  footer, // New prop to override default buttons
}) {
  const visibilityClass = isOpen
    ? "opacity-100 pointer-events-auto backdrop-blur-md"
    : "opacity-0 pointer-events-none backdrop-blur-none";

  const modalTransform = isOpen ? "animate-modalIn" : "animate-modalOut";

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-all duration-300 ease-out ${visibilityClass}`}
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      <div
        className={`relative w-full max-w-md rounded-2xl bg-gameLight border border-gameLight/30 p-8 shadow-2xl ${modalTransform}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold text-gameDark tracking-tight uppercase text-center w-full pl-6">
            {title}
          </h2>
          {/* Close button (X) */}
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gameDark hover:bg-gameDark/20 rounded-full p-2 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="text-gray-700 mb-8 leading-relaxed min-h-[15vh] center flex-col">
          {children}
        </div>

        {/* Conditionally render custom footer OR default Share/Next buttons */}
        {footer ? (
          <div className="flex gap-4">{footer}</div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={(e) => {
                const element = e.target;
                onShare();
                element.innerHTML = "Copied !";
                setTimeout(() => {
                  element.innerHTML = "Share";
                }, 1500);
              }}
              className="w-full bg-gameBlue hover:bg-opacity-90 text-gameDark font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-gameGreen/10 uppercase"
            >
              Share
            </button>
            <button
              onClick={onNext}
              className="w-full bg-gameGreen hover:bg-opacity-90 text-gameDark font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-gameGreen/10 uppercase"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
