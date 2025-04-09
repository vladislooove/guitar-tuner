import React from "react";
import StringButton from "./StringButton";
import { TUNINGS, NOTE_NAMES } from "../utils/audioUtils";

interface GuitarNeckProps {
  tuning: string;
}

const GuitarNeck: React.FC<GuitarNeckProps> = ({ tuning }) => {
  // Calculate string positions based on the current tuning
  const getStringPositions = (tuningType: string) => {
    const strings =
      TUNINGS[tuningType as keyof typeof TUNINGS] || TUNINGS.standard;

    // Create an array of strings with their positions
    return strings.map((note, index) => {
      // Calculate vertical position based on string index
      // These will position the strings along the guitar head vertically
      const top = `${4 + index * 16}%`;

      return {
        note,
        noteName: NOTE_NAMES[note],
        stringNumber: 6 - index, // Convert to 6-1 notation
        position: {
          top: top,
          left: "5%", // Position for left buttons
          right: "5%", // Position for right buttons
        },
        side: index % 2 === 0 ? "left" : "right", // Alternate sides for buttons
      };
    });
  };

  const stringPositions = getStringPositions(tuning);

  return (
    <div className="guitar-head relative w-full max-w-md mx-auto h-[450px] rounded-lg overflow-hidden mb-6">
      {/* Background guitar head image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/lovable-uploads/435fa2bc-8386-4b6b-815c-a83bc185baa6.png')",
        }}
      />

      {/* Guitar tuning pegs and strings */}
      {stringPositions.map((string, idx) => (
        <React.Fragment key={idx}>
          {/* Left side buttons */}
          <StringButton
            stringNumber={string.stringNumber}
            note={string.note}
            noteName={string.noteName}
            position={string.position}
            side="left"
          />

          {/* Right side buttons */}
          <StringButton
            stringNumber={string.stringNumber}
            note={string.note}
            noteName={string.noteName}
            position={string.position}
            side="right"
          />

          {/* Tuning peg (silver circle) */}
          <div
            className="absolute w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full border border-gray-300 shadow-md transform -translate-y-1/2"
            style={{
              top: string.position.top,
              left:
                string.side === "left"
                  ? "calc(22% - 12px)"
                  : "calc(78% - 12px)",
              right: string.side === "right" ? "22%" : undefined,
            }}
          ></div>

          {/* Tuning peg line (connecting to headstock) */}
          <div
            className="absolute h-[2px] bg-gray-300 transform -translate-y-1/2"
            style={{
              top: string.position.top,
              left: string.side === "left" ? "22%" : "50%",
              right: string.side === "right" ? "22%" : undefined,
              width: "28%",
            }}
          ></div>
        </React.Fragment>
      ))}

      {/* Add subtle overlay to enhance visibility of the buttons */}
      <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"></div>
    </div>
  );
};

export default GuitarNeck;
