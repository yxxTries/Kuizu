import React from "react";
import { useAudio, TRACKS } from "./AudioContext.jsx";
import { useTheme } from "./ThemeContext.jsx";
import { FONTS } from "./theme.js";

function btnStyle(C) {
  return {
    background: "transparent",
    border: "none",
    color: C.ink,
    cursor: "pointer",
    fontSize: 15,
    padding: "2px 4px",
    lineHeight: 1,
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    flexShrink: 0,
  };
}

export default function AudioPlayer({ compact = false, onClose }) {
  const { colors: C } = useTheme();
  const { currentTrack, isPlaying, togglePlay, nextTrack, setTrack, tracks, stop } = useAudio();

  if (compact && !currentTrack) return null;

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          background: C.creamSoft,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          padding: "3px 4px 3px 8px",
          height: 34,
          boxShadow: `0 2px 8px ${C.shadow}`,
        }}
      >
        <button onClick={togglePlay} style={btnStyle(C)} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? "\u23F8" : "\u25B6"}
        </button>
        <button onClick={nextTrack} style={{ ...btnStyle(C), width: 22 }} title="Skip" disabled={!currentTrack}>
          {"\u23ED"}
        </button>
        <button
          onClick={stop}
          title="Stop music"
          style={{
            ...btnStyle(C),
            width: 22,
            fontSize: 12,
            color: C.inkMuted,
          }}
        >
          {"\u2715"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 700, color: C.ink }}>
          Audio
        </span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: C.inkMuted,
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
          >
            {"\u2715"}
          </button>
        )}
      </div>

      {/* Now playing */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: C.cream,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          padding: "8px 12px",
        }}
      >
        <button
          onClick={togglePlay}
          style={{
            ...btnStyle(C),
            width: 32,
            height: 32,
            fontSize: 18,
            background: isPlaying ? C.sageSoft : "transparent",
            borderRadius: 8,
          }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "\u23F8" : "\u25B6"}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              fontWeight: 700,
              color: C.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentTrack ? currentTrack.title : "No track"}
          </div>
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 10,
              color: C.inkMuted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentTrack ? currentTrack.artist : "Select below"}
          </div>
        </div>

        <button
          onClick={nextTrack}
          style={{ ...btnStyle(C), width: 28, fontSize: 14 }}
          title="Skip"
          disabled={!currentTrack}
        >
          {"\u23ED"}
        </button>
      </div>

      {/* Preset buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {tracks.map((t) => (
          <button
            key={t.id}
            onClick={() => setTrack(t.id)}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: currentTrack?.id === t.id ? C.sageSoft : "transparent",
              color: C.ink,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: FONTS.body,
              transition: "background 0.12s ease",
            }}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Info */}
      <div
        style={{
          fontSize: 10,
          color: C.inkMuted,
          fontFamily: FONTS.body,
          textAlign: "center",
        }}
      >
        {currentTrack
          ? isPlaying
            ? "Playing \u2014 audio continues across pages"
            : "Paused"
          : "Pick a track to start"}
      </div>
    </div>
  );
}
