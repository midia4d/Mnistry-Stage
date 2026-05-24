import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Song } from '../api/lyrics';

/** Uma estrofe é um bloco de versos separados por linha em branco */
export const splitLyrics = (lyrics: string): string[] => {
  return lyrics
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);
};

interface LyricsState {
  activeSong: Song | null;
  strophes: string[];
  currentStropheIndex: number;
  currentStrophe: string | null;
  setActiveSong: (song: Song | null) => void;
  nextStrophe: () => void;
  prevStrophe: () => void;
  goToStrophe: (index: number) => void;
}

const LyricsContext = createContext<LyricsState | null>(null);

export const LyricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSong, setActiveSongState] = useState<Song | null>(null);
  const [strophes, setStrophes] = useState<string[]>([]);
  const [currentStropheIndex, setCurrentStropheIndex] = useState(0);

  const setActiveSong = useCallback((song: Song | null) => {
    setActiveSongState(song);
    if (song?.lyrics) {
      const parts = splitLyrics(song.lyrics);
      setStrophes(parts);
      setCurrentStropheIndex(0);
    } else {
      setStrophes([]);
      setCurrentStropheIndex(0);
    }
  }, []);

  const nextStrophe = useCallback(() => {
    setCurrentStropheIndex(i => Math.min(i + 1, strophes.length - 1));
  }, [strophes.length]);

  const prevStrophe = useCallback(() => {
    setCurrentStropheIndex(i => Math.max(i - 1, 0));
  }, []);

  const goToStrophe = useCallback((index: number) => {
    setCurrentStropheIndex(Math.max(0, Math.min(index, strophes.length - 1)));
  }, [strophes.length]);

  const currentStrophe = strophes.length > 0 ? strophes[currentStropheIndex] : null;

  return (
    <LyricsContext.Provider value={{
      activeSong, strophes, currentStropheIndex, currentStrophe,
      setActiveSong, nextStrophe, prevStrophe, goToStrophe,
    }}>
      {children}
    </LyricsContext.Provider>
  );
};

export const useLyrics = (): LyricsState => {
  const ctx = useContext(LyricsContext);
  if (!ctx) throw new Error('useLyrics must be used within <LyricsProvider>');
  return ctx;
};
