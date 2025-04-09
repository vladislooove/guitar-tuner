import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mic, Play, Volume2, Plus, Settings, Guitar } from "lucide-react";
import TuningMeter from "./TuningMeter";
import GuitarNeck from "./GuitarNeck";
import { Input } from "@/components/ui/input";
import {
  TUNINGS,
  NOTE_NAMES,
  NOTE_FREQUENCIES,
  createAudioContext,
  detectPitch,
  findClosestNote,
} from "../utils/audioUtils";

const GuitarTuner: React.FC = () => {
  const [selectedTuning, setSelectedTuning] = useState<string>("standard");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<string>("");
  const [currentNoteName, setCurrentNoteName] = useState<string>("");
  const [cents, setCents] = useState<number>(0);
  const [isDetectingNote, setIsDetectingNote] = useState<boolean>(false);
  const [useMicTuning, setUseMicTuning] = useState<boolean>(false);
  const [isCustomTuning, setIsCustomTuning] = useState<boolean>(false);
  const [customTuning, setCustomTuning] = useState<string[]>([
    "e2",
    "a2",
    "d3",
    "g3",
    "b3",
    "e4",
  ]);
  const [currentStringNumber, setCurrentStringNumber] = useState<number | null>(
    null
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const availableNotes = Object.keys(NOTE_FREQUENCIES);

  const toggleMicrophone = async () => {
    if (isListening) {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
      setIsListening(false);
      setIsDetectingNote(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        micStreamRef.current = stream;

        const audioContext = createAudioContext();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        setIsListening(true);
        setUseMicTuning(true);

        detectNote();
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check your permissions.");
      }
    }
  };

  const handleTuningChange = (value: string) => {
    setSelectedTuning(value);
    setIsCustomTuning(value === "custom");
  };

  const handleCustomNoteChange = (index: number, value: string) => {
    const newCustomTuning = [...customTuning];
    newCustomTuning[index] = value;
    setCustomTuning(newCustomTuning);
  };

  const getCurrentStrings = () => {
    if (isCustomTuning) {
      return customTuning;
    }
    return TUNINGS[selectedTuning as keyof typeof TUNINGS] || TUNINGS.standard;
  };

  const detectNote = () => {
    if (!isListening || !analyserRef.current || !audioContextRef.current)
      return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const detectPitchAndUpdate = () => {
      analyser.getFloatTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += Math.abs(dataArray[i]);
      }
      const average = sum / bufferLength;

      if (average > 0.01) {
        const frequency = detectPitch(
          dataArray,
          audioContextRef.current!.sampleRate
        );

        if (frequency > 0) {
          const tuning = getCurrentStrings();
          const noteInfo = findClosestNote(frequency, tuning);

          setCurrentNote(noteInfo.note);
          setCurrentNoteName(noteInfo.name);
          setCents(noteInfo.cents);
          setIsDetectingNote(true);

          const stringIndex = tuning.findIndex((note) => {
            const noteFreq = NOTE_FREQUENCIES[note];
            const detectedFreq = frequency;
            return Math.abs(Math.log2(detectedFreq / noteFreq)) < 0.07;
          });

          if (stringIndex !== -1) {
            setCurrentStringNumber(6 - stringIndex);
          } else {
            setCurrentStringNumber(null);
          }
        } else {
          setIsDetectingNote(false);
          setCurrentStringNumber(null);
        }
      } else {
        setIsDetectingNote(false);
        setCurrentStringNumber(null);
      }

      if (isListening) {
        requestAnimationFrame(detectPitchAndUpdate);
      }
    };

    detectPitchAndUpdate();
  };

  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      detectNote();
    }
  }, [isListening]);

  const getTuningDisplayName = (tuningKey: string) => {
    if (tuningKey === "custom") return "Custom";

    const tuningNotes = TUNINGS[tuningKey as keyof typeof TUNINGS];
    if (!tuningNotes) return tuningKey;

    const notesDisplay = tuningNotes.map((note) => NOTE_NAMES[note]).join("");

    const tuningNames: { [key: string]: string } = {
      standard: "Standard",
      dropD: "Drop D",
      openG: "Open G",
      openD: "Open D",
      dadgad: "DADGAD",
      halfStepDown: "Half Step Down",
      fullStepDown: "Full Step Down",
      openE: "Open E",
      openA: "Open A",
      dropC: "Drop C",
      newStandard: "New Standard",
      openC: "Open C",
    };

    return `${tuningNames[tuningKey] || tuningKey} (${notesDisplay})`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-200">Guitar Tuner</h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="text-gray-400" size={18} />
            <span className="text-sm text-gray-300">Tune by ear</span>
            <Switch
              checked={useMicTuning}
              onCheckedChange={(checked) => {
                setUseMicTuning(checked);
                if (checked && !isListening) {
                  toggleMicrophone();
                } else if (!checked && isListening) {
                  toggleMicrophone();
                }
              }}
            />
            <span className="text-sm text-gray-300">Use mic</span>
            <Mic className="text-gray-400" size={18} />
          </div>

          <Select value={selectedTuning} onValueChange={handleTuningChange}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
              <SelectValue placeholder="Standard (EADGBE)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">
                {getTuningDisplayName("standard")}
              </SelectItem>
              <SelectItem value="dropD">
                {getTuningDisplayName("dropD")}
              </SelectItem>
              <SelectItem value="openG">
                {getTuningDisplayName("openG")}
              </SelectItem>
              <SelectItem value="openD">
                {getTuningDisplayName("openD")}
              </SelectItem>
              <SelectItem value="dadgad">
                {getTuningDisplayName("dadgad")}
              </SelectItem>
              <SelectItem value="halfStepDown">
                {getTuningDisplayName("halfStepDown")}
              </SelectItem>
              <SelectItem value="fullStepDown">
                {getTuningDisplayName("fullStepDown")}
              </SelectItem>
              <SelectItem value="openE">
                {getTuningDisplayName("openE")}
              </SelectItem>
              <SelectItem value="openA">
                {getTuningDisplayName("openA")}
              </SelectItem>
              <SelectItem value="dropC">
                {getTuningDisplayName("dropC")}
              </SelectItem>
              <SelectItem value="newStandard">
                {getTuningDisplayName("newStandard")}
              </SelectItem>
              <SelectItem value="openC">
                {getTuningDisplayName("openC")}
              </SelectItem>
              <SelectItem value="custom">Custom Tuning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className={`p-6 rounded-lg ${
          useMicTuning ? "bg-gray-800" : "bg-opacity-50 bg-gray-900"
        } border border-gray-700 shadow-xl`}
      >
        {useMicTuning ? (
          <>
            <TuningMeter
              cents={cents}
              noteName={currentNoteName}
              isActive={isDetectingNote}
              currentString={currentStringNumber}
            />

            {!isListening && (
              <div className="mt-6 text-center">
                <Button
                  className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold"
                  onClick={toggleMicrophone}
                >
                  <Mic className="mr-2" size={18} />
                  Enable Microphone
                </Button>
                <p className="text-gray-400 text-sm mt-2">
                  Click to allow microphone access for tuning
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Tune by Ear
            </h2>
            <p className="text-gray-300 mb-6">
              Click on a string to play its note
            </p>

            {isCustomTuning && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-300 mb-3">
                  Custom Tuning
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {customTuning.map((note, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <span className="text-sm text-gray-400 mb-1">
                        String {6 - index}
                      </span>
                      <Select
                        value={note}
                        onValueChange={(value) =>
                          handleCustomNoteChange(index, value)
                        }
                      >
                        <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                          <SelectValue>{NOTE_NAMES[note]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableNotes.map((noteOption) => (
                            <SelectItem key={noteOption} value={noteOption}>
                              {NOTE_NAMES[noteOption]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <GuitarNeck tuning={isCustomTuning ? "custom" : selectedTuning} />

            <div className="flex justify-center mt-4">
              <Button
                className="bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold"
                onClick={() => setUseMicTuning(true)}
              >
                <Mic className="mr-2" size={18} />
                Switch to Microphone Tuning
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>
          Select your desired tuning from the dropdown menu or create a custom
          tuning.
        </p>
        <p className="mt-1">
          You can tune by ear or use your microphone for automatic note
          detection.
        </p>
      </div>
    </div>
  );
};

export default GuitarTuner;
