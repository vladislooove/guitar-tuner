import React, { useEffect, useRef } from "react";
import { isInTune } from "../utils/audioUtils";

interface TuningMeterProps {
  cents: number;
  noteName: string;
  isActive: boolean;
  currentString?: number | null;
}

const TuningMeter: React.FC<TuningMeterProps> = ({
  cents,
  noteName,
  isActive,
  currentString,
}) => {
  const needleRef = useRef<HTMLDivElement>(null);
  const tuneStatusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (needleRef.current) {
      // Limit to reasonable range (-50 to 50 cents)
      const limitedCents = Math.max(-50, Math.min(50, cents));

      // Convert cents to degrees (-50 cents = -45deg, 0 cents = 0deg, 50 cents = 45deg)
      const degrees = (limitedCents / 50) * 45;

      needleRef.current.style.transform = `rotate(${degrees}deg)`;

      // Apply different classes based on tuning accuracy
      if (isInTune(cents, 5)) {
        needleRef.current.classList.add("bg-tuner-green");
        needleRef.current.classList.remove("bg-yellow-500", "bg-tuner-red");
      } else if (isInTune(cents, 15)) {
        needleRef.current.classList.add("bg-yellow-500");
        needleRef.current.classList.remove("bg-tuner-green", "bg-tuner-red");
      } else {
        needleRef.current.classList.add("bg-tuner-red");
        needleRef.current.classList.remove("bg-tuner-green", "bg-yellow-500");
      }
    }

    if (tuneStatusRef.current) {
      if (isInTune(cents, 5)) {
        tuneStatusRef.current.textContent = "In Tune";
        tuneStatusRef.current.className = "text-tuner-green font-bold";
      } else if (cents < 0) {
        tuneStatusRef.current.textContent = "Tune Up";
        tuneStatusRef.current.className = "text-tuner-red";
      } else {
        tuneStatusRef.current.textContent = "Tune Down";
        tuneStatusRef.current.className = "text-tuner-red";
      }
    }
  }, [cents]);

  return (
    <div className="flex flex-col items-center">
      <div className="tuner-meter mx-auto">
        {/* Tuning ranges */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-between px-8 pt-4">
          <div className="text-tuner-red text-xs">♭</div>
          <div className="text-tuner-green text-xs">♮</div>
          <div className="text-tuner-red text-xs">♯</div>
        </div>

        {/* Tuning marks */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between px-2">
          <div className="h-4 w-1 bg-gray-300 opacity-50"></div>
          <div className="h-6 w-1 bg-gray-300 opacity-70"></div>
          <div className="h-8 w-1 bg-gray-300"></div>
          <div className="h-6 w-1 bg-gray-300 opacity-70"></div>
          <div className="h-4 w-1 bg-gray-300 opacity-50"></div>
        </div>

        {/* Needle */}
        <div
          ref={needleRef}
          className={`tuner-needle ${
            isActive ? "" : "opacity-30"
          } transition-transform duration-200 ease-out`}
          style={{ transform: "rotate(0deg)" }}
        ></div>
      </div>

      {/* Note display */}
      <div className="mt-4 text-center">
        <div className="text-5xl font-bold text-tuner-gold">
          {isActive ? noteName || "-" : "-"}
        </div>
        {currentString && isActive && (
          <div className="text-xl font-semibold text-white mt-1">
            String {currentString}
          </div>
        )}
        <div ref={tuneStatusRef} className="text-gray-300 mt-1">
          {isActive
            ? isInTune(cents, 5)
              ? "In Tune"
              : cents < 0
              ? "Tune Up"
              : "Tune Down"
            : "Waiting..."}
        </div>
        {isActive && (
          <div className="text-xs text-gray-400 mt-1">
            {cents.toFixed(1)} cents
          </div>
        )}
      </div>
    </div>
  );
};

export default TuningMeter;
