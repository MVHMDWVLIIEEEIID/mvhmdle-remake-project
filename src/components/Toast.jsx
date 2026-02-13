import React from "react";

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-lifecycle-bottom {
          0% {
            opacity: 0;
            transform: translateY(100%) scale(0.9);
          }
          10% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          85% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100%) scale(0.9);
          }
        }
        .animate-toast-lifecycle {
          animation: toast-lifecycle-bottom 2.5s ease-in-out forwards;
        }
      `}</style>

      {/* Changed to toast-bottom and toast-end for Bottom Right positioning */}
      <div className="toast toast-bottom toast-end z-9999 flex flex-col items-end gap-2 mb-4 mr-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              alert shadow-lg flex flex-row items-center gap-2 p-3 rounded-lg 
              animate-toast-lifecycle pointer-events-auto min-w-60
              ${t.type === "success" ? "alert-success bg-green-500/95 text-white border-none" : ""}
              ${t.type === "error" ? "alert-error bg-red-500/95 text-white border-none" : ""}
              ${t.type === "info" ? "alert-info bg-blue-500/95 text-white border-none" : ""}
            `}
          >
            {t.type === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {t.type === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {t.type === "info" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            )}
            <span className="font-bold text-sm uppercase tracking-wide">
              {t.msg}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
