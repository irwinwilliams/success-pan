const OUTER_WORDS = [
  "Achievement",
  "Determination",
  "Creativity",
  "Momentum",
  "Innovation",
  "Strategy",
  "Leadership",
  "Perseverance",
  "Success",
  "Teamwork",
  "Purpose",
  "Resilience",
];

const MIDDLE_WORDS = [
  "Vision",
  "Progress",
  "Synergy",
  "Harmony",
  "Triumph",
  "Legacy",
  "Growth",
  "Profit",
  "Execution",
  "Insight",
  "Clarity",
  "Courage",
];

const INNER_WORDS = ["Focus", "Drive", "Unity", "Balance"];
const CENTER_WORD = "Excellence";

const SUCCESS_WORDS = [...OUTER_WORDS, ...MIDDLE_WORDS, ...INNER_WORDS, CENTER_WORD];

const KEY_SEQUENCE = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "-",
  "=",
  "Q",
  "W",
  "E",
  "R",
  "T",
  "Y",
  "U",
  "I",
  "O",
  "P",
  "[",
  "]",
  "A",
  "S",
  "D",
  "F",
  "G",
];

const OUTER_RING = [
  { note: "C#6", position: { x: 50.0, y: 11.91 }, tier: "outer" },
  { note: "F#5", position: { x: 69.04, y: 17.02 }, tier: "outer" },
  { note: "B5", position: { x: 82.98, y: 30.96 }, tier: "outer" },
  { note: "E5", position: { x: 88.09, y: 50.0 }, tier: "outer" },
  { note: "A5", position: { x: 82.98, y: 69.04 }, tier: "outer" },
  { note: "D5", position: { x: 69.04, y: 82.98 }, tier: "outer" },
  { note: "G5", position: { x: 50.0, y: 88.09 }, tier: "outer" },
  { note: "C5", position: { x: 30.96, y: 82.98 }, tier: "outer" },
  { note: "F5", position: { x: 17.02, y: 69.04 }, tier: "outer" },
  { note: "Bb4", position: { x: 11.91, y: 50.0 }, tier: "outer" },
  { note: "Eb5", position: { x: 17.02, y: 30.96 }, tier: "outer" },
  { note: "Ab5", position: { x: 30.96, y: 17.02 }, tier: "outer" },
];

const MIDDLE_RING = [
  { note: "B4", position: { x: 56.82, y: 24.53 }, tier: "middle" },
  { note: "E4", position: { x: 68.64, y: 31.36 }, tier: "middle" },
  { note: "A4", position: { x: 75.47, y: 43.18 }, tier: "middle" },
  { note: "D4", position: { x: 75.47, y: 56.82 }, tier: "middle" },
  { note: "G4", position: { x: 68.64, y: 68.64 }, tier: "middle" },
  { note: "D5", position: { x: 56.82, y: 75.47 }, tier: "middle" },
  { note: "G5", position: { x: 43.18, y: 75.47 }, tier: "middle" },
  { note: "Bb4", position: { x: 31.36, y: 68.64 }, tier: "middle" },
  { note: "Eb4", position: { x: 24.53, y: 56.82 }, tier: "middle" },
  { note: "Ab4", position: { x: 24.53, y: 43.18 }, tier: "middle" },
  { note: "C#5", position: { x: 31.36, y: 31.36 }, tier: "middle" },
  { note: "F#4", position: { x: 43.18, y: 24.53 }, tier: "middle" },
];

const INNER_RING = [
  { note: "C5", position: { x: 50.0, y: 35.35 }, tier: "inner" },
  { note: "E5", position: { x: 64.65, y: 50.0 }, tier: "inner" },
  { note: "G4", position: { x: 50.0, y: 64.65 }, tier: "inner" },
  { note: "D4", position: { x: 35.35, y: 50.0 }, tier: "inner" },
];

const CENTER_NOTE = [{ note: "C4", position: { x: 50.0, y: 50.0 }, tier: "center" }];

const LAYOUT = [...OUTER_RING, ...MIDDLE_RING, ...INNER_RING, ...CENTER_NOTE];

if (LAYOUT.length !== SUCCESS_WORDS.length || LAYOUT.length !== KEY_SEQUENCE.length) {
  throw new Error("Layout, words, and keys must be the same length.");
}

const RAW_NOTES = LAYOUT.map((zone, index) => {
  const noteLabel = zone.note;
  return {
    id: `${noteLabel}_${index}`,
    note: zone.note,
    noteLabel,
    word: SUCCESS_WORDS[index],
    key: KEY_SEQUENCE[index],
    position: zone.position,
    tier: zone.tier,
  };
});

const NOTES = RAW_NOTES.map((entry) => ({
  ...entry,
  frequency: noteNameToFrequency(entry.note),
}));

function noteNameToFrequency(noteName) {
  const match = /^([A-G])([b#]?)(\d)$/.exec(noteName);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }
  const [, letter, accidental, octaveText] = match;
  const OCTAVE_OFFSET = Number(octaveText) - 4;
  const SEMITONE_OFFSETS = {
    C: -9,
    D: -7,
    E: -5,
    F: -4,
    G: -2,
    A: 0,
    B: 2,
  };

  let offset = SEMITONE_OFFSETS[letter];
  if (accidental === "#") {
    offset += 1;
  } else if (accidental === "b") {
    offset -= 1;
  }

  const semitoneDistance = offset + OCTAVE_OFFSET * 12;
  return Number((440 * 2 ** (semitoneDistance / 12)).toFixed(2));
}

const KEY_BINDINGS = new Map();
const WORD_MAP = new Map();
const NOTE_ELEMENTS = new Map();

const state = {
  words: [],
  composition: null,
  playback: {
    isPlaying: false,
    activeNodes: [],
    timeouts: [],
  },
};

let audioCtx;
let masterGain;
let analyser;
let visualizerFrame;
let noiseBuffer;

const panSurface = document.getElementById("panSurface");
const mallet = document.getElementById("mallet");
const scratchpadWords = document.getElementById("scratchpadWords");
const clearButton = document.getElementById("clearWords");
const undoButton = document.getElementById("undoWord");
const generateButton = document.getElementById("generateSong");
const playButton = document.getElementById("playSong");
const tempoSlider = document.getElementById("tempoSlider");
const tempoValue = document.getElementById("tempoValue");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const lyricsOutput = document.getElementById("lyricsOutput");
const statusMessage = document.getElementById("statusMessage");
const keyboardLegend = document.getElementById("keyboardLegend");
const visualizerCanvas = document.getElementById("visualizer");
const visualizerCtx = visualizerCanvas.getContext("2d");
const wordSpotlight = document.getElementById("wordSpotlight");

const activeKeys = new Set();

init();

function init() {
  createPanNotes();
  updateScratchpad();
  renderKeyboardLegend();
  attachEventListeners();
  resizeCanvasToDisplaySize();
  drawVisualizer();
  updateTempoLabel();
  updateVolumeLabel();
  resetWordSpotlight();
}

function createPanNotes() {
  NOTES.forEach((note) => {
    const noteButton = document.createElement("button");
    noteButton.type = "button";
    noteButton.className = "pan-note";
    if (note.tier) {
      noteButton.classList.add(`tier-${note.tier}`);
    }
    noteButton.textContent = note.noteLabel;
    noteButton.dataset.word = note.word;
    noteButton.dataset.key = note.key.toUpperCase();
    noteButton.dataset.note = note.noteLabel;
    noteButton.style.setProperty("--x", `${note.position.x}%`);
    noteButton.style.setProperty("--y", `${note.position.y}%`);
    noteButton.setAttribute("aria-label", `${note.word} - ${note.noteLabel}`);
    noteButton.title = `${note.noteLabel} - ${note.word} (Key ${note.key.toUpperCase()})`;

    noteButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handleUserNoteTrigger(note, noteButton, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    });

    panSurface.appendChild(noteButton);
    NOTE_ELEMENTS.set(note.id, noteButton);
    KEY_BINDINGS.set(note.key.toLowerCase(), note);
    WORD_MAP.set(note.word, note);
  });
}

function attachEventListeners() {
  clearButton.addEventListener("click", () => {
    state.words = [];
    state.composition = null;
    updateScratchpad();
    lyricsOutput.innerHTML = "<em>Scratchpad cleared. Play the pan to add new words.</em>";
    playButton.disabled = true;
    updateStatus("Scratchpad reset. Start a fresh groove!");
  });

  undoButton.addEventListener("click", () => {
    if (!state.words.length) {
      updateStatus("No words to remove. Tap the pan to add inspiration.");
      return;
    }
    const removed = state.words.pop();
    updateScratchpad();
    state.composition = null;
    playButton.disabled = true;
    if (state.words.length) {
      lyricsOutput.innerHTML = "<em>Regenerate to hear the updated story.</em>";
    } else {
      lyricsOutput.innerHTML = "<em>Scratchpad cleared. Play the pan to add new words.</em>";
    }
    updateStatus(`Removed "${removed}".`);
  });

  generateButton.addEventListener("click", () => {
    if (!state.words.length) {
      updateStatus("Add a few words before generating. The crowd awaits your ideas!");
      return;
    }
    const song = buildSongFromWords(state.words);
    if (!song.sequence.length) {
      updateStatus("Could not map the words to notes. Try tapping the pan again.");
      lyricsOutput.innerHTML = "<em>No playable notes detected. Add words from the pan.</em>";
      playButton.disabled = true;
      state.composition = null;
      return;
    }
    ensureAudioContext();
    state.composition = song;
    lyricsOutput.textContent = song.lyrics || "Your melody is ready.";
    playButton.disabled = false;
    playButton.textContent = "Play Song";
    updateStatus("Lyrics and arrangement ready. Hit play when you're set!");
  });

  playButton.addEventListener("click", () => {
    if (!state.composition) {
      updateStatus("Generate a song before playing back.");
      return;
    }
    if (state.playback.isPlaying) {
      stopPlayback();
    } else {
      playComposition(state.composition);
    }
  });

  tempoSlider.addEventListener("input", () => {
    updateTempoLabel();
    if (state.composition) {
      state.composition.tempo = Number(tempoSlider.value);
    }
  });

  volumeSlider.addEventListener("input", () => {
    updateVolumeLabel();
    const volume = Number(volumeSlider.value) / 100;
    if (masterGain) {
      masterGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.02);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }
    const key = event.key.toLowerCase();
    if (!KEY_BINDINGS.has(key)) {
      return;
    }
    event.preventDefault();
    if (activeKeys.has(key)) {
      return;
    }
    activeKeys.add(key);
    const note = KEY_BINDINGS.get(key);
    const element = NOTE_ELEMENTS.get(note.id);
    handleUserNoteTrigger(note, element);
  });

  window.addEventListener("keyup", (event) => {
    activeKeys.delete(event.key.toLowerCase());
  });

  window.addEventListener("resize", resizeCanvasToDisplaySize);
}

function handleUserNoteTrigger(note, element, pointerPosition) {
  ensureAudioContext();
  if (state.playback.isPlaying) {
    stopPlayback();
  }
  flashNote(element);
  animateMallet(element, pointerPosition);
  playSteelpanNote(note, audioCtx.currentTime);
  state.words.push(note.word);
  updateScratchpad();
  state.composition = null;
  playButton.disabled = true;
  lyricsOutput.innerHTML = "<em>Generate a song to hear your new phrase.</em>";
  showWordSpotlight(note);
  updateStatus(`Locked in "${note.word}". Keep the rhythm flowing.`);
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(12);
  }
}

function flashNote(element) {
  element.classList.add("active");
  setTimeout(() => {
    element.classList.remove("active");
  }, 180);
}

function animateMallet(element, pointerPosition) {
  const panRect = panSurface.getBoundingClientRect();
  const noteRect = element.getBoundingClientRect();
  let x = noteRect.left - panRect.left + noteRect.width / 2;
  let y = noteRect.top - panRect.top + noteRect.height / 2;

  if (pointerPosition?.clientX && pointerPosition?.clientY) {
    x = pointerPosition.clientX - panRect.left;
    y = pointerPosition.clientY - panRect.top;
  }

  mallet.style.left = `${x}px`;
  mallet.style.top = `${y}px`;
  mallet.classList.add("visible");
  setTimeout(() => mallet.classList.remove("visible"), 140);
}

function ensureAudioContext() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  analyser = audioCtx.createAnalyser();

  masterGain.gain.value = Number(volumeSlider.value) / 100;
  masterGain.connect(analyser);
  analyser.connect(audioCtx.destination);

  analyser.fftSize = 1024;

  return audioCtx;
}

function playSteelpanNote(note, startTime) {
  const ctx = ensureAudioContext();
  const duration = 0.9;
  const oscPrimary = ctx.createOscillator();
  const oscHarmonic = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const harmonicGain = ctx.createGain();

  oscPrimary.type = "sine";
  oscPrimary.frequency.setValueAtTime(note.frequency, startTime);

  oscHarmonic.type = "triangle";
  oscHarmonic.frequency.setValueAtTime(note.frequency * 1.98, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(0.95, startTime + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  harmonicGain.gain.value = 0.3;

  oscPrimary.connect(gainNode);
  oscHarmonic.connect(harmonicGain);
  harmonicGain.connect(gainNode);
  gainNode.connect(masterGain);

  oscPrimary.start(startTime);
  oscHarmonic.start(startTime);
  oscPrimary.stop(startTime + duration + 0.05);
  oscHarmonic.stop(startTime + duration + 0.05);
}

function updateScratchpad() {
  scratchpadWords.innerHTML = "";
  if (!state.words.length) {
    scratchpadWords.classList.add("empty");
    scratchpadWords.innerHTML = "<span class=\"word-chip\">Tap notes to add words</span>";
    return;
  }

  scratchpadWords.classList.remove("empty");

  state.words.slice(-20).forEach((word) => {
    const chip = document.createElement("span");
    chip.className = "word-chip";
    chip.textContent = word;
    scratchpadWords.appendChild(chip);
  });
}

function renderKeyboardLegend() {
  keyboardLegend.innerHTML = "";
  NOTES.forEach((note) => {
    const item = document.createElement("li");
    item.textContent = `${note.key.toUpperCase()} - ${note.word} (${note.noteLabel})`;
    keyboardLegend.appendChild(item);
  });
}

function buildSongFromWords(words) {
  const tempo = Number(tempoSlider.value);
  const sequence = [];
  const usableWords = [];

  words.forEach((word, index) => {
    const note = WORD_MAP.get(word);
    if (!note) {
      return;
    }
    usableWords.push(note.word);
    sequence.push({
      note,
      length: index % 3 === 0 ? 1.5 : 1,
    });
  });

  return {
    lyrics: generateLyrics(usableWords),
    sequence,
    tempo,
  };
}

function generateLyrics(words) {
  const phrases = distributeWords(words);
  const chorusHook = phrases[2] || phrases[0];
  const bridgeHook = phrases[3] || phrases[1] || phrases[0];

  const lines = [
    "Verse 1:",
    sentenceFromPhrase(phrases[0], "Rhythms of {phrase} guide our hands tonight."),
    sentenceFromPhrase(phrases[1], "Crowds feel {phrase} rising with the band."),
    "",
    "Chorus:",
    sentenceFromPhrase(chorusHook, "Steelpan sings {phrase} under harbor lights."),
    sentenceFromPhrase(phrases[0], "We echo {phrase} together on this stage."),
    "",
    "Bridge:",
    sentenceFromPhrase(bridgeHook, "Let the beat remind us of {phrase}."),
    sentenceFromPhrase(phrases[1], "Forward ever, {phrase} carrying the flame."),
  ];

  return lines.join("\n");
}

function distributeWords(words) {
  if (!words.length) {
    return [];
  }
  const segments = [];
  const segmentSize = Math.max(2, Math.ceil(words.length / 4));
  for (let i = 0; i < words.length; i += segmentSize) {
    segments.push(words.slice(i, i + segmentSize));
  }
  while (segments.length < 4) {
    segments.push(words.slice(0, segmentSize));
    if (!segments[segments.length - 1].length) {
      segments[segments.length - 1] = words;
    }
  }
  return segments;
}

function sentenceFromPhrase(words, template) {
  const phrase = formatPhrase(words);
  return template.replace("{phrase}", phrase.toLowerCase());
}

function formatPhrase(words) {
  if (!words || !words.length) {
    return "";
  }
  if (words.length === 1) {
    return words[0];
  }
  if (words.length === 2) {
    return `${words[0]} and ${words[1].toLowerCase()}`;
  }
  const allButLast = words.slice(0, -1).join(", ");
  const last = words[words.length - 1].toLowerCase();
  return `${allButLast}, and ${last}`;
}

function playComposition(composition) {
  ensureAudioContext();
  stopPlayback(true);
  const { tempo, sequence } = composition;
  const beat = 60 / tempo;
  const ctxStart = audioCtx.currentTime + 0.08;
  const startTimestamp = performance.now() + 80;

  let beatOffset = 0;
  sequence.forEach((entry) => {
    const startTime = ctxStart + beatOffset * beat;
    const duration = beat * entry.length;
    schedulePlaybackHighlight(entry.note, startTimestamp + beatOffset * beat * 1000);
    scheduleSteelpanPlayback(entry.note, startTime, duration);
    schedulePercussion(startTime, duration);
    beatOffset += entry.length;
  });

  const totalBeats = sequence.reduce((sum, entry) => sum + entry.length, 0);
  const totalDurationSeconds = totalBeats * beat + 1.2;

  scheduleAmbientPad(ctxStart, totalDurationSeconds);

  const playbackDuration = totalDurationSeconds * 1000;
  const endTimeout = setTimeout(() => stopPlayback(), playbackDuration + 300);
  state.playback.timeouts.push(endTimeout);

  playButton.textContent = "Stop";
  state.playback.isPlaying = true;
  updateStatus("Performance rolling! Watch the pan dance.");
}

function scheduleSteelpanPlayback(note, startTime, duration) {
  const ctx = ensureAudioContext();
  const primary = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const overtoneGain = ctx.createGain();

  primary.type = "sine";
  primary.frequency.setValueAtTime(note.frequency, startTime);

  overtone.type = "triangle";
  overtone.frequency.setValueAtTime(note.frequency * 1.95, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(0.9, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  overtoneGain.gain.value = 0.25;

  primary.connect(gainNode);
  overtone.connect(overtoneGain);
  overtoneGain.connect(gainNode);
  gainNode.connect(masterGain);

  primary.start(startTime);
  overtone.start(startTime);
  primary.stop(startTime + duration + 0.1);
  overtone.stop(startTime + duration + 0.1);

  state.playback.activeNodes.push(primary, overtone, gainNode, overtoneGain);
}

function schedulePercussion(startTime, duration) {
  const ctx = ensureAudioContext();
  const totalBursts = Math.max(2, Math.round(duration / 0.3));
  const interval = duration / totalBursts;

  for (let i = 0; i < totalBursts; i++) {
    const time = startTime + i * interval;
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer();

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(0.35, time + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    source.connect(envelope);
    envelope.connect(masterGain);

    source.start(time);
    source.stop(time + 0.3);
    state.playback.activeNodes.push(source, envelope);
  }
}

function scheduleAmbientPad(startTime, duration) {
  const ctx = ensureAudioContext();
  const padOsc = ctx.createOscillator();
  const padGain = ctx.createGain();
  padOsc.type = "sine";
  padOsc.frequency.setValueAtTime(110, startTime);

  padGain.gain.setValueAtTime(0.0001, startTime);
  padGain.gain.linearRampToValueAtTime(0.12, startTime + 0.6);
  padGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  padOsc.connect(padGain);
  padGain.connect(masterGain);

  padOsc.start(startTime);
  padOsc.stop(startTime + duration + 0.2);
  state.playback.activeNodes.push(padOsc, padGain);
}

function schedulePlaybackHighlight(note, startTimestamp) {
  const element = NOTE_ELEMENTS.get(note.id);
  const highlightDelay = Math.max(0, startTimestamp - performance.now());
  const timeoutId = setTimeout(() => {
    element.classList.add("playback-active");
    showWordSpotlight(note, "playback");
    animateMallet(element);
    setTimeout(() => {
      element.classList.remove("playback-active");
    }, 200);
  }, highlightDelay);
  state.playback.timeouts.push(timeoutId);
}

function stopPlayback(soft = false) {
  state.playback.timeouts.forEach((id) => clearTimeout(id));
  state.playback.timeouts = [];
  state.playback.activeNodes.forEach((node) => {
    if (typeof node.stop === "function") {
      try {
        node.stop();
      } catch (error) {
        // Node may already be stopped; ignore.
      }
    }
  });
  state.playback.activeNodes = [];

  NOTE_ELEMENTS.forEach((element) => element.classList.remove("playback-active"));

  state.playback.isPlaying = false;
  playButton.textContent = "Play Song";
  if (!soft) {
    updateStatus("Playback ready. Adjust tempo or add new words anytime.");
  }
}

function getNoiseBuffer() {
  if (noiseBuffer) {
    return noiseBuffer;
  }
  const ctx = ensureAudioContext();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

function updateStatus(message) {
  statusMessage.textContent = message;
}

function updateTempoLabel() {
  tempoValue.textContent = `${tempoSlider.value} BPM`;
}

function updateVolumeLabel() {
  volumeValue.textContent = `${volumeSlider.value}%`;
}

function resetWordSpotlight() {
  if (!wordSpotlight) {
    return;
  }
  wordSpotlight.innerHTML = '<span class="placeholder">Tap a note to reveal its success word.</span>';
}

function showWordSpotlight(note, source = "live") {
  if (!wordSpotlight) {
    return;
  }
  const keyLabel = /^[a-z]$/i.test(note.key) ? note.key.toUpperCase() : note.key;
  const fragments = [
    `<span class="spotlight-word">${note.word}</span>`,
    `<span class="spotlight-meta">${note.noteLabel} - key ${keyLabel}</span>`,
  ];
  if (source === "playback") {
    fragments.push('<span class="spotlight-meta subtle">Playback</span>');
  }
  wordSpotlight.innerHTML = fragments.join("");
}

function resizeCanvasToDisplaySize() {
  const ratio = window.devicePixelRatio || 1;
  const width = visualizerCanvas.clientWidth * ratio;
  const height = visualizerCanvas.clientHeight * ratio;
  if (visualizerCanvas.width !== width || visualizerCanvas.height !== height) {
    visualizerCanvas.width = width;
    visualizerCanvas.height = height;
  }
}

function drawVisualizer() {
  if (visualizerFrame) {
    cancelAnimationFrame(visualizerFrame);
  }

  const width = visualizerCanvas.width;
  const height = visualizerCanvas.height;
  const dataArray = new Uint8Array(512);

  const draw = () => {
    visualizerFrame = requestAnimationFrame(draw);
    visualizerCtx.clearRect(0, 0, width, height);

    visualizerCtx.fillStyle = "rgba(5, 12, 30, 0.8)";
    visualizerCtx.fillRect(0, 0, width, height);

    visualizerCtx.lineWidth = 2;
    visualizerCtx.strokeStyle = "rgba(255, 199, 0, 0.8)";
    visualizerCtx.beginPath();

    if (analyser) {
      analyser.getByteTimeDomainData(dataArray);
    } else {
      dataArray.fill(128);
    }

    const sliceWidth = width / dataArray.length;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        visualizerCtx.moveTo(x, y);
      } else {
        visualizerCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    visualizerCtx.lineTo(width, height / 2);
    visualizerCtx.stroke();
  };

  draw();
}
