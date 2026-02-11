export default function Modal({ isOpen, onClose, title, children }) {
  // visibilityClass handles the master fade and blur toggle
  const visibilityClass = isOpen
    ? "opacity-100 pointer-events-auto backdrop-blur-md"
    : "opacity-0 pointer-events-none backdrop-blur-none";

  // modalTransform handles the spring/shrink animation
  const modalTransform = isOpen ? "animate-modalIn" : "animate-modalOut";

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-all duration-300 ease-out ${visibilityClass}`}
    >
      {/* Backdrop - darker overlay that fades with the blur */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-md rounded-2xl bg-gameDark border border-gameLight/30 p-8 shadow-2xl ${modalTransform}`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gameLight/20 rounded-full p-2 transition-colors"
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

        <div className="text-gray-300 text-lg mb-8 leading-relaxed">
          {children}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gameGreen hover:bg-opacity-90 text-gameDark font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-gameGreen/10"
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
