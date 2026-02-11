import CountDown from "./countdown";

export default function Header({ mode, streak }) {
  return (
    <header className="flex justify-around items-center px-16 w-full text-2xl dark:bg-gameLight h-full dark:text-gameDark">
      <h1 className="font-bold">{mode}</h1>
      <div className="flex gap-2">
        {mode.toLowerCase() === "daily mode" ? (
          <>
            <h1>Next Day In: </h1> <CountDown />
          </>
        ) : (
          `Streak : ${streak}`
        )}
      </div>
    </header>
  );
}
