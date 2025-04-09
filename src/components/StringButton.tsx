import React from "react";
import { playNote } from "../utils/audioUtils";

interface StringButtonProps {
  stringNumber: number;
  note: string;
  noteName: string;
  position: { top: string; left: string; right?: string };
  side: "left" | "right";
}

const StringButton: React.FC<StringButtonProps> = ({
  stringNumber,
  note,
  noteName,
  position,
  side,
}) => {
  const handleClick = () => {
    playNote(note);
  };

  return (
    <button
      className="string-button absolute flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 text-center transition-transform hover:scale-105 active:scale-95 shadow-lg"
      onClick={handleClick}
      style={{
        top: position.top,
        left: side === "left" ? position.left : undefined,
        right: side === "right" ? position.right : undefined,
      }}
    >
      <div className="text-2xl font-bold text-white">{noteName}</div>
    </button>
  );
};

export default StringButton;
