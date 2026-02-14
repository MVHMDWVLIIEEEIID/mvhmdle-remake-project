import { Link } from "react-router";

export default function Menu() {

  const tabsArray = ['Daily', 'Survival', 'Setting']
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-5 h-0 center items-end-safe gameFont uppercase text-8xl">
        Mvmhdle
      </div>
      <div className="flex-7 h-0 center">
        <div className=" flex flex-col w-1/2 lg:w-1/3 gap-3.5">
          {
            tabsArray.map((tab) => {
              return <Link to={`/${tab.toLowerCase()}`} className="text-center text-3xl py-4 rounded-2xl border-2 border-gameLight hover:bg-gameLight/95 hover:text-gameDark transition-all duration-200 uppercase m-auto w-full active:bg-gameLight">{tab}</Link>
            })
          }
        </div>
      </div>
    </div>
  );
}