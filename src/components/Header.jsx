import CountDown from "./countdown";

export default function Header({ mode, streak, hearts = 0, onModeClick }) {
  const MAX_HEARTS = 5;
  const isDailyMode = mode?.toLowerCase().includes("daily");
  return (
    <header className="flex justify-around items-center px-16 w-full text-2xl dark:bg-gameLight h-full dark:text-gameDark">
      <h1
        className={`font-bold ${onModeClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
        onClick={onModeClick}
      >
        {mode}
      </h1>
      <div className="flex items-center gap-6">
        {isDailyMode ? (
          <div className="flex items-center gap-2">
            <h1>Next Day In: </h1>
            <CountDown />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-xl">Streak : {streak}</div>
            <div className="h-6 w-0.5 bg-black rounded-full" />
            <div className="flex items-center gap-1">
              {[...Array(hearts)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gameRed w-5 h-5"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ))}
              {[...Array(Math.max(0, MAX_HEARTS - hearts))].map((_, i) => (
                <svg
                  key={`lost-${i}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gameDark/30 w-5 h-5"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
