import React, { useState } from "react";
import { useSpotify } from "./SpotifyContext.jsx";
import { useTheme } from "./ThemeContext.jsx";
import { FONTS } from "./theme.js";

const PRESETS = [
  { label: "Lo-Fi Beats", id: "37i9dQZF1DWWQRwui0ExPn" },
  { label: "Focus Flow", id: "37i9dQZF1DX8NTLI2TtZa6" },
  { label: "Ambient Relax", id: "37i9dQZF1DWZcZ1C7R3FIm" },
  { label: "Jazz Vibes", id: "37i9dQZF1DXbITWG1ZJKYt" },
  { label: "Classical Study", id: "37i9dQZF1DWWEJlAGA9gs0" },
];

function getEmbedUrl(input) {
  if (!input) return "";
  const idMatch = input.match(/spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/);
  if (idMatch) return `https://open.spotify.com/embed/${idMatch[1]}/${idMatch[2]}?utm_source=generator`;
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return `https://open.spotify.com/embed/playlist/${input.trim()}?utm_source=generator`;
  return "";
}

export default function SpotifyPlayer({ onClose }) {
  const { colors: C } = useTheme();
  const { musicMuted, spotifyUrl, setSpotifyUrl } = useSpotify();
  const [customLink, setCustomLink] = useState("");
  const embedUrl = getEmbedUrl(spotifyUrl);

  const handlePreset = (presetId) => {
    setSpotifyUrl(`https://open.spotify.com/playlist/${presetId}`);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const trimmed = customLink.trim();
    if (trimmed) {
      const url = getEmbedUrl(trimmed);
      if (url) setSpotifyUrl(trimmed);
      setCustomLink("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 700, color: C.ink }}>
          Spotify
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "none", color: C.inkMuted,
            cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: spotifyUrl.includes(p.id) ? C.sageSoft : "transparent",
              color: C.ink,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: FONTS.body,
              transition: "background 0.12s ease",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleCustomSubmit} style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          placeholder="Paste Spotify link..."
          value={customLink}
          onChange={(e) => setCustomLink(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.cream,
            color: C.ink,
            fontSize: 12,
            fontFamily: FONTS.body,
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.yellowSoft,
            color: C.ink,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONTS.body,
          }}
        >
          Load
        </button>
      </form>

      {musicMuted ? (
        <div style={{
          borderRadius: 10, border: `1px solid ${C.border}`,
          padding: "16px 12px", textAlign: "center",
          color: C.inkMuted, fontSize: 12, fontFamily: FONTS.body,
        }}>
          Music muted
        </div>
      ) : embedUrl ? (
        <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Player"
            style={{ display: "block" }}
          />
        </div>
      ) : (
        <div style={{
          borderRadius: 10, border: `1px solid ${C.border}`,
          padding: "16px 12px", textAlign: "center",
          color: C.inkMuted, fontSize: 12, fontFamily: FONTS.body,
        }}>
          Pick a playlist to start
        </div>
      )}
    </div>
  );
}
