import React, { createContext, useContext, useState } from "react";

const SpotifyContext = createContext(null);

export function SpotifyProvider({ children }) {
  const [musicMuted, setMusicMuted] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState("");

  return (
    <SpotifyContext.Provider value={{ musicMuted, setMusicMuted, spotifyUrl, setSpotifyUrl }}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error("useSpotify must be used within SpotifyProvider");
  return ctx;
}

export default SpotifyContext;
