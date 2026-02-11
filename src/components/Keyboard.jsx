export default function Keyboard({ letters, lastChanged }) {
  // Arrays to hold the JSX elements for each keyboard row
  let lettersRow1 = [];
  let lettersRow2 = [];
  let lettersRow3 = [];

  // Iterate through the letters object to build the keyboard UI
  Object.keys(letters).forEach((letter) => {
    const keyData = letters[letter];
    const color = keyData.color;

    // --- Animation Logic ---
    // Check if this specific letter was the last one modified (e.g., color change)
    const isTarget = lastChanged?.letter === letter;

    // To re-trigger CSS animations, we change the 'key' prop using a timestamp.
    // This forces React to unmount and remount the specific key element.
    const uniqueKey = isTarget ? `${letter}-${lastChanged.timestamp}` : letter;
    const animationClass = isTarget ? "animate-pop" : "";

    // Base classes for Tailwind styling
    const baseStyle = `center rounded m-0.5 text-gameDark pointer-events-none text-2xl font-bold uppercase transition-all duration-500 ease-in-out ${color} ${animationClass}`;

    // --- Row Distribution ---
    // Categorize letters into their respective rows based on the 'row' property
    if (keyData.row === 1) {
      lettersRow1.push(
        <div key={uniqueKey} className={`${baseStyle} aspect-square w-14`}>
          {letter}
        </div>,
      );
    } else if (keyData.row === 2) {
      lettersRow2.push(
        <div key={uniqueKey} className={`${baseStyle} aspect-square w-14`}>
          {letter}
        </div>,
      );
    } else if (keyData.row === 3) {
      lettersRow3.push(
        <div
          key={uniqueKey}
          className={`${baseStyle} h-14 ${keyData.big ? " flex-1.5 px-4" : " flex-1"}`}
        >
          {letter}
        </div>,
      );
    }
  });

  return (
    <div className="flex flex-col items-center">
      {/* Render the rows of keys */}
      <div className="flex">{lettersRow1}</div>
      <div className="flex justify-center">{lettersRow2}</div>
      <div className="flex w-full justify-center">{lettersRow3}</div>
    </div>
  );
}
