import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";

// ──────────────────────────────────────────────
// Track definitions — royalty-free CC-licensed electronic music
// Synthwave | Electro | Retro Electronica | Chillwave
// Sourced from Archive.org (CC BY / CC BY-NC)
// ──────────────────────────────────────────────
export const TRACKS = [
  // ── Synthwave ────────────────────────────────
  { id: "hyperdrive",        title: "HyperDrive",           artist: "DJ Ten",               url: "/audio/02-djten-hyperdrive.mp3" },
  { id: "bodyguard",         title: "BodyGuard",            artist: "Protector 101",         url: "/audio/05-protector101-bodyguard.mp3" },
  { id: "saywhat",           title: "Say What You Need",    artist: "Let Em Riot",           url: "/audio/08-letemriot-say-what.mp3" },
  { id: "heartoflight",      title: "Heart Of Light",       artist: "Rain Sword",            url: "/audio/13-rainsword-heart-of-light.mp3" },

  // ── Electro House ─────────────────────────────
  { id: "tagliagole",        title: "Tagliagole",           artist: "Corvallis",             url: "/audio/01-corvallis-tagliagole.mp3" },
  { id: "lastemperor",       title: "The Last Emperor",     artist: "Bourgeoisie",           url: "/audio/03-bourgeoisie-last-emperor.mp3" },
  { id: "pantherforce",      title: "PantherForce V",       artist: "GrooveWorthy",          url: "/audio/04-grooveworthy-pantherforce.mp3" },
  { id: "crystaldreams",     title: "Crystal Dreams",       artist: "Arcade High",           url: "/audio/09-arcadehigh-crystal-dreams.mp3" },

  // ── Retro Electronica ─────────────────────────
  { id: "ghosts",            title: "Ghosts",               artist: "STARCAT",               url: "/audio/07-starcat-ghosts.mp3" },
  { id: "spacetraveler",     title: "Space Traveler",       artist: "Hot Hot Hawk",          url: "/audio/10-hothothawk-space-traveler.mp3" },
  { id: "foggysplume",       title: "Foggy's Plume",       artist: "Apollo Zapp",           url: "/audio/12-apollozapp-foggys-plume.mp3" },
  { id: "nightcall",         title: "Nightcall",            artist: "A Space Love Adventure", url: "/audio/14-synthwave-nightcall.mp3" },

  // ── Chillwave ─────────────────────────────────
  { id: "beyondstars",       title: "Beyond The Stars",     artist: "Tommy",                 url: "/audio/06-tommy-beyond-the-stars.mp3" },
  { id: "synchronize",       title: "Synchronize",          artist: "HOME",                  url: "/audio/16-home-synchronize.mp3" },
  { id: "overflow",          title: "Overflow",             artist: "HOME",                  url: "/audio/15-home-overflow.mp3" },
  { id: "kosmonight",        title: "Night",                artist: "Kosmorider",            url: "/audio/17-kosmorider-night.mp3" },
];

// ──────────────────────────────────────────────
// Web Audio API ambient synth engine
// ──────────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.nodes = [];
  }

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.22;
    this.masterGain.connect(this.ctx.destination);
  }

  stop() {
    this.nodes.forEach((n) => {
      try { n.stop?.(); } catch {}
      try { n.disconnect?.(); } catch {}
    });
    this.nodes = [];
  }

  play(trackId) {
    this.stop();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const presets = {
      lofi:    { base: [130.81, 196.00, 261.63], wave: "triangle",  detune: [0, 7, 0],   gain: 0.06, lfoRate: 0.08, noise: 0.04, noiseFreq: 600 },
      focus:   { base: [174.61, 220.00, 261.63], wave: "sine",      detune: [0, 0, 12],  gain: 0.07, lfoRate: 0.12, noise: 0.02, noiseFreq: 800 },
      ambient: { base: [146.83, 220.00, 293.66], wave: "sawtooth",  detune: [0, -10, 5],  gain: 0.04, lfoRate: 0.06, noise: 0,    noiseFreq: 0 },
      jazz:    { base: [130.81, 164.81, 196.00], wave: "triangle",  detune: [0, 4, 7],    gain: 0.05, lfoRate: 0.15, noise: 0,    noiseFreq: 0 },
      classical:{ base: [196.00, 246.94, 293.66], wave: "sine",      detune: [0, 0, 0],   gain: 0.06, lfoRate: 0.20, noise: 0,    noiseFreq: 0 },
    };

    const cfg = presets[trackId] || presets.ambient;

    cfg.base.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = cfg.wave;
      osc.frequency.value = freq;
      osc.detune.value = cfg.detune[i] || 0;

      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = cfg.lfoRate + Math.random() * 0.05;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start(now);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(cfg.gain, now + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = trackId === "ambient" ? 500 : 2000;
      filter.Q.value = 0.5;

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(now);

      this.nodes.push(osc, lfo, lfoGain, oscGain, filter);
    });

    // Filtered noise layer for lofi / focus
    if (cfg.noise > 0) {
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.06;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.value = cfg.noiseFreq;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(cfg.noise, now + 1.2);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);

      this.nodes.push(noise, noiseFilter, noiseGain);
    }
  }

  setVolume(v) {
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.masterGain.context.currentTime);
      this.masterGain.gain.setValueAtTime(v, 0);
    }
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// ──────────────────────────────────────────────
// React context
// ──────────────────────────────────────────────
const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const engineRef = useRef(null);
  const audioRef = useRef(null);
  const nextTrackRef = useRef(null);

  const currentTrack = TRACKS.find((t) => t.id === currentTrackId) || null;

  useEffect(() => {
    engineRef.current = new AudioEngine();
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  const initEngine = useCallback(async () => {
    await engineRef.current?.init();
  }, []);

  const stopAll = useCallback(() => {
    engineRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, []);

  const playFile = useCallback((track) => {
    if (!audioRef.current || !track.url) return false;
    const audio = audioRef.current;
    audio.src = track.url;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    return true;
  }, []);

  const playSynth = useCallback((trackId) => {
    engineRef.current?.play(trackId);
    setIsPlaying(true);
  }, []);

  const play = useCallback(
    async (trackId) => {
      const id = trackId || currentTrackId || TRACKS[0].id;
      const track = TRACKS.find((t) => t.id === id);
      if (!track) return;

      setCurrentTrackId(id);
      stopAll();

      await initEngine();

      if (track.url) {
        playFile(track);
      } else {
        playSynth(id);
      }
    },
    [currentTrackId, stopAll, initEngine, playFile, playSynth],
  );

  const pause = useCallback(() => {
    engineRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (currentTrackId) {
      play(currentTrackId);
    } else {
      play(TRACKS[0].id);
    }
  }, [isPlaying, currentTrackId, pause, play]);

  const nextTrack = useCallback(() => {
    if (!currentTrackId) {
      play(TRACKS[0].id);
      return;
    }
    const idx = TRACKS.findIndex((t) => t.id === currentTrackId);
    const nextIdx = (idx + 1) % TRACKS.length;
    play(TRACKS[nextIdx].id);
  }, [currentTrackId, play]);

  nextTrackRef.current = nextTrack;

  const setTrack = useCallback(
    (trackId) => {
      play(trackId);
    },
    [play],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      if (engineRef.current) {
        engineRef.current.setVolume(next ? 0 : 0.22);
      }
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCurrentTrackId(null);
    setIsPlaying(false);
  }, []);

  // Auto-advance on file end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      nextTrackRef.current?.();
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  const value = {
    currentTrack,
    currentTrackId,
    isPlaying,
    isMuted,
    tracks: TRACKS,
    play,
    pause,
    togglePlay,
    nextTrack,
    setTrack,
    toggleMute,
    stop,
  };

  return (
    <AudioContext.Provider value={value}>
      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export default AudioContext;
