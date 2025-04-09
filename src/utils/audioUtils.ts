// Web Audio API utilities for guitar tuner
const GUITAR_NOTES = {
  e2: 82.41, // E2 (Low E)
  a2: 110.0, // A2
  d3: 146.83, // D3
  g3: 196.0, // G3
  b3: 246.94, // B3
  e4: 329.63, // E4 (High E)
};

const TUNINGS = {
  standard: ["e2", "a2", "d3", "g3", "b3", "e4"],
  dropD: ["d2", "a2", "d3", "g3", "b3", "e4"],
  openG: ["d2", "g2", "d3", "g3", "b3", "d4"],
  openD: ["d2", "a2", "d3", "f#3", "a3", "d4"],
  dadgad: ["d2", "a2", "d3", "g3", "a3", "d4"],
  halfStepDown: ["eb2", "ab2", "db3", "gb3", "bb3", "eb4"],
  fullStepDown: ["d2", "g2", "c3", "f3", "a3", "d4"],
  openE: ["e2", "b2", "e3", "g#3", "b3", "e4"],
  openA: ["e2", "a2", "e3", "a3", "c#4", "e4"],
  dropC: ["c2", "g2", "c3", "f3", "a3", "d4"],
  newStandard: ["c2", "g2", "d3", "a3", "e4", "g4"],
  openC: ["c2", "g2", "c3", "g3", "c4", "e4"],
};

// Note frequencies in Hz for different tunings
const NOTE_FREQUENCIES: Record<string, number> = {
  // Standard
  e2: 82.41,
  a2: 110.0,
  d3: 146.83,
  g3: 196.0,
  b3: 246.94,
  e4: 329.63,

  // For other tunings
  d2: 73.42,
  eb2: 77.78,
  ab2: 103.83,
  db3: 138.59,
  gb3: 185.0,
  bb3: 233.08,
  eb4: 311.13,
  g2: 98.0,
  "f#3": 185.0,
  d4: 293.66,

  // Additional notes for new tunings
  c2: 65.41,
  c3: 130.81,
  f3: 174.61,
  a3: 220.0,
  c4: 261.63,
  "c#4": 277.18,
  "g#3": 207.65,
  e3: 164.81,
  b2: 123.47,
  g4: 392.0,
  f2: 87.31,
  "f#2": 92.5,
  "g#2": 103.83,
  "c#3": 138.59,
  f4: 349.23,
};

// Note display names
const NOTE_NAMES: Record<string, string> = {
  e2: "E",
  a2: "A",
  d3: "D",
  g3: "G",
  b3: "B",
  e4: "E",
  d2: "D",
  eb2: "E♭",
  ab2: "A♭",
  db3: "D♭",
  gb3: "G♭",
  bb3: "B♭",
  eb4: "E♭",
  g2: "G",
  "f#3": "F♯",
  d4: "D",
  c2: "C",
  c3: "C",
  f3: "F",
  a3: "A",
  c4: "C",
  "c#4": "C♯",
  "g#3": "G♯",
  e3: "E",
  b2: "B",
  g4: "G",
  f2: "F",
  "f#2": "F♯",
  "g#2": "G♯",
  "c#3": "C♯",
  f4: "F",
};

// Create audio context safely with browser compatibility
const createAudioContext = (): AudioContext => {
  const AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContext();
};

// Enhanced acoustic guitar string sound synthesis
const playNote = (noteId: string, duration = 3): void => {
  const audioContext = createAudioContext();

  // Create the main oscillator for the fundamental frequency
  const oscillator = audioContext.createOscillator();
  const mainGain = audioContext.createGain();

  // Get frequency or use default
  const frequency = NOTE_FREQUENCIES[noteId] || 440;

  // Use custom periodic wave for more realistic guitar string sound
  const partials = new Float32Array(20);
  const phases = new Float32Array(20);

  // Adjust harmonics strength based on string type (lower = warmer, higher = brighter)
  const isLowString = frequency < 150;

  // Set different harmonic strengths for different strings
  for (let i = 0; i < 20; i++) {
    // Fundamental
    if (i === 0) {
      partials[i] = 1;
    }
    // Even harmonics (characteristic of plucked strings)
    else if (i % 2 === 0) {
      partials[i] = isLowString ? 0.5 / (i * 0.8) : 0.5 / (i * 0.6);
    }
    // Odd harmonics
    else {
      partials[i] = isLowString ? 0.7 / (i * 0.7) : 0.8 / (i * 0.5);
    }
    phases[i] = 0; // All phases start at 0
  }

  // Create a custom wave for more realistic guitar timbre
  try {
    const customWave = audioContext.createPeriodicWave(partials, phases);
    oscillator.setPeriodicWave(customWave);
  } catch (e) {
    // Fallback to triangle wave if custom wave fails
    console.warn(
      "Custom waveform not supported, falling back to triangle wave"
    );
    oscillator.type = "triangle";
  }

  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Create harmonics for richer guitar sound
  const numHarmonics = 6;
  const harmonics = Array.from({ length: numHarmonics }, (_, i) => i + 2);
  const harmonicGains = harmonics.map((_, i) => (1 / (i + 2)) * 0.4);

  const harmonicOscillators = harmonics.map((harmonic, i) => {
    const harmonicOsc = audioContext.createOscillator();
    const harmonicGain = audioContext.createGain();

    harmonicOsc.type = "sine";
    harmonicOsc.frequency.setValueAtTime(
      frequency * harmonic,
      audioContext.currentTime
    );

    // Random slight detuning for more natural sound
    const detune = Math.random() * 6 - 3;
    harmonicOsc.detune.setValueAtTime(detune, audioContext.currentTime);

    harmonicGain.gain.setValueAtTime(
      harmonicGains[i],
      audioContext.currentTime
    );

    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(mainGain);

    return { osc: harmonicOsc, gain: harmonicGain };
  });

  // Add a body resonance filter for acoustic guitar body effect
  const bodyResonance = audioContext.createBiquadFilter();
  bodyResonance.type = "peaking";
  bodyResonance.frequency.setValueAtTime(
    isLowString ? 110 : 220,
    audioContext.currentTime
  );
  bodyResonance.Q.value = 5;
  bodyResonance.gain.setValueAtTime(
    isLowString ? 5 : 3,
    audioContext.currentTime
  );

  // Add subtle chorus effect for width
  const chorusFeedback = audioContext.createGain();
  chorusFeedback.gain.value = 0.35;

  const chorusDelay = audioContext.createDelay();
  chorusDelay.delayTime.value = 0.03;

  // Acoustic guitar pluck envelope
  mainGain.gain.setValueAtTime(0, audioContext.currentTime);
  mainGain.gain.linearRampToValueAtTime(
    isLowString ? 1.0 : 0.8,
    audioContext.currentTime + 0.005
  ); // Fast attack
  mainGain.gain.setValueAtTime(
    isLowString ? 1.0 : 0.8,
    audioContext.currentTime + 0.01
  );
  mainGain.gain.exponentialRampToValueAtTime(
    0.6,
    audioContext.currentTime + 0.2
  ); // Initial decay
  mainGain.gain.exponentialRampToValueAtTime(
    0.4,
    audioContext.currentTime + 0.6
  ); // Body
  mainGain.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration
  ); // Long decay

  // Create a subtle reverb simulation
  const convolver = audioContext.createConvolver();

  // Connect the audio graph
  oscillator.connect(mainGain);
  mainGain.connect(bodyResonance);

  // Create chorus effect
  mainGain.connect(chorusDelay);
  chorusDelay.connect(chorusFeedback);
  chorusFeedback.connect(chorusDelay);
  chorusDelay.connect(bodyResonance);

  bodyResonance.connect(audioContext.destination);

  // Start all oscillators
  oscillator.start();
  harmonicOscillators.forEach(({ osc }) => osc.start());

  // Stop after duration
  setTimeout(() => {
    oscillator.stop();
    harmonicOscillators.forEach(({ osc }) => osc.stop());

    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, 100);
  }, duration * 1000);
};

// Calculate the frequency from audio input using autocorrelation
const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
  // Simple autocorrelation algorithm for pitch detection
  const bufferSize = buffer.length;
  const correlations: number[] = [];

  for (let lag = 0; lag < bufferSize / 2; lag++) {
    let correlation = 0;

    for (let i = 0; i < bufferSize / 2; i++) {
      correlation += buffer[i] * buffer[i + lag];
    }

    correlations.push(correlation);
  }

  // Find the highest correlation peak after the initial drop
  let foundPeak = false;
  let peakIndex = 0;

  for (let i = 1; i < correlations.length; i++) {
    if (!foundPeak && correlations[i] < correlations[i - 1]) {
      foundPeak = true;
    }

    if (
      foundPeak &&
      correlations[i] > correlations[i - 1] &&
      correlations[i] > correlations[peakIndex]
    ) {
      peakIndex = i;
    }
  }

  let frequency = sampleRate / peakIndex;

  // Ensure the frequency is in a reasonable range for a guitar
  if (frequency < 70 || frequency > 700) {
    return 0; // No valid pitch found
  }

  return frequency;
};

// Find the closest note to a given frequency
const findClosestNote = (
  frequency: number,
  tuning: string[]
): {
  note: string;
  noteFrequency: number;
  name: string;
  cents: number;
} => {
  if (frequency <= 0) return { note: "", noteFrequency: 0, name: "", cents: 0 };

  const availableNotes = tuning.map((note) => ({
    note,
    freq: NOTE_FREQUENCIES[note],
    name: NOTE_NAMES[note],
  }));

  let closestNote = availableNotes[0];
  let minDiff = Math.abs(Math.log2(frequency / closestNote.freq));

  for (const note of availableNotes) {
    const diff = Math.abs(Math.log2(frequency / note.freq));
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  // Calculate cents deviation (100 cents = 1 semitone)
  const cents = 1200 * Math.log2(frequency / closestNote.freq);

  return {
    note: closestNote.note,
    noteFrequency: closestNote.freq,
    name: closestNote.name,
    cents,
  };
};

// Function to determine if the note is in tune (within a threshold)
const isInTune = (cents: number, threshold: number = 10): boolean => {
  return Math.abs(cents) <= threshold;
};

export {
  GUITAR_NOTES,
  TUNINGS,
  NOTE_FREQUENCIES,
  NOTE_NAMES,
  createAudioContext,
  playNote,
  detectPitch,
  findClosestNote,
  isInTune,
};
