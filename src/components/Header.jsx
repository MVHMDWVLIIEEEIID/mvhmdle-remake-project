import CountDown from "./countdown"

export default function Header({ mode }) {


  return (
    <header className="flex justify-around items-center px-16 w-full text-2xl dark:bg-gameLight h-full dark:text-gameDark"><h1>{mode}</h1>
      <div className="flex gap-2">
        <h1>Next Day In: </h1>
        <CountDown /></div>
    </header>
  )
}