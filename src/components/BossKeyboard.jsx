export default function BossKeyboard({
  letters,
  lastChanged,
  lineColorsByLetter = {},
}) {
  if (!letters || typeof letters !== "object") return null;

  let lettersRow1 = [];
  let lettersRow2 = [];
  let lettersRow3 = [];

  Object.keys(letters).forEach((letter) => {
    const keyData = letters[letter];
    const color = keyData.color;
    const isTarget = lastChanged?.letter === letter;
    const uniqueKey = isTarget ? `${letter}-${lastChanged.timestamp}` : letter;
    const animationClass = isTarget ? "animate-pop" : "";

    const baseStyle = `center rounded m-0.5 text-gameDark pointer-events-none uppercase transition-all duration-500 ease-in-out ${color} ${animationClass}`;
    const lines = lineColorsByLetter[letter] || [];
    const showLines = lines.length > 0 && /^[a-z]$/i.test(letter);

    const keyContent = (
      <>
        {showLines && (
          <div className="absolute inset-0 flex">
            {lines.map((lineColor, idx) => (
              <div
                key={`${letter}-line-${idx}`}
                className={`flex-1 h-full ${lineColor} ${idx < lines.length - 1 ? "border-r border-black/25" : ""}`}
              />
            ))}
          </div>
        )}
        <span className="relative z-10 text-2xl font-bold leading-none">
          {letter}
        </span>
        {showLines && (
          <span className="absolute inset-0 rounded opacity-10 bg-black" />
        )}
      </>
    );

    if (keyData.row === 1) {
      lettersRow1.push(
        <div
          key={uniqueKey}
          className={`${baseStyle} aspect-square w-14 relative overflow-hidden flex items-center justify-center`}
        >
          {keyContent}
        </div>,
      );
    } else if (keyData.row === 2) {
      lettersRow2.push(
        <div
          key={uniqueKey}
          className={`${baseStyle} aspect-square w-14 relative overflow-hidden flex items-center justify-center`}
        >
          {keyContent}
        </div>,
      );
    } else if (keyData.row === 3) {
      lettersRow3.push(
        <div
          key={uniqueKey}
          className={`${baseStyle} h-14 ${keyData.big ? "flex-1.5 px-4" : "flex-1"} relative overflow-hidden flex items-center justify-center`}
        >
          {keyContent}
        </div>,
      );
    }
  });

  return (
    <div className="flex flex-col items-center">
      <div className="flex">{lettersRow1}</div>
      <div className="flex justify-center">{lettersRow2}</div>
      <div className="flex w-full justify-center">{lettersRow3}</div>
    </div>
  );
}
