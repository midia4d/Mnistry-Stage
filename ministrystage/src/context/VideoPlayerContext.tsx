import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

export type VideoChannel = 'A' | 'B';

interface VideoPlayerState {
  isPlaying: boolean;
  currentVideo: string | null; // Apenas por compatibilidade, mapeia para o canal ativo
  channelA: string | null;
  channelB: string | null;
  activeChannel: VideoChannel;
  blendMode: string;
  crossfade: number; // 0 to 100
  transitionDuration: number; // 100 to 4000
  setBlendMode: (mode: string) => void;
  setCrossfade: (val: number) => void;
  setTransitionDuration: (val: number) => void;
  playVideo: (path: string) => Promise<void>;
  stopVideo: () => Promise<void>;
}

const VideoPlayerContext = createContext<VideoPlayerState | null>(null);

export const VideoPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [channelA, setChannelA] = useState<string | null>(null);
  const [channelB, setChannelB] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<VideoChannel>('A');
  const [blendMode, setBlendMode] = useState<string>('normal');
  const [crossfade, setCrossfade] = useState<number>(0); // 0 = A, 100 = B
  const [transitionDuration, setTransitionDuration] = useState<number>(500); // ms

  // currentVideo por compatibilidade aponta para o canal ativo
  const currentVideo = activeChannel === 'A' ? channelA : channelB;

  const playVideo = useCallback(async (path: string) => {
    try {
      setActiveChannel(prev => {
        if (prev === 'A') {
          setChannelB(path);
          setCrossfade(100); // Automático para B
          return 'B';
        } else {
          setChannelA(path);
          setCrossfade(0); // Automático para A
          return 'A';
        }
      });
      setIsPlaying(true);
    } catch (err) {
      console.error('Erro ao reproduzir vídeo:', err);
    }
  }, []);

  const stopVideo = useCallback(async () => {
    setChannelA(null);
    setChannelB(null);
    setActiveChannel('A');
    setIsPlaying(false);
  }, []);

  return (
    <VideoPlayerContext.Provider value={{ 
      isPlaying, currentVideo, channelA, channelB, activeChannel, 
      blendMode, crossfade, transitionDuration,
      setBlendMode, setCrossfade, setTransitionDuration,
      playVideo, stopVideo 
    }}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = (): VideoPlayerState => {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error('useVideoPlayer must be used within <VideoPlayerProvider>');
  return ctx;
};
