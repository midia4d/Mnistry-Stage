import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CornerMap, DEFAULT_CORNERS, computeCornerPinTransform, isDefaultCorners } from '../utils/computeHomography';

const STORAGE_KEY = 'ms-video-mapping';

export type MappingPreset = {
  id: string;
  name: string;
  corners: CornerMap;
};

interface OutputMappingState {
  corners: CornerMap;
  presets: MappingPreset[];
  isActive: boolean;           // true = há distorção ativa, false = retângulo perfeito
  showTestPattern: boolean;
  testPattern: 'grid' | 'white' | 'black' | 'color_bars';
  setCorner: (corner: keyof CornerMap, pos: [number, number]) => void;
  resetCorners: () => void;
  flipH: () => void;
  flipV: () => void;
  toggleTestPattern: () => void;
  setTestPattern: (p: OutputMappingState['testPattern']) => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  getCSSTransform: (width: number, height: number) => string | null;
}

const OutputMappingContext = createContext<OutputMappingState | null>(null);

function loadFromStorage(): { corners: CornerMap; presets: MappingPreset[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { corners: DEFAULT_CORNERS, presets: [] };
}

function saveToStorage(corners: CornerMap, presets: MappingPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ corners, presets }));
}

export const OutputMappingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const saved = loadFromStorage();
  const [corners, setCorners] = useState<CornerMap>(saved.corners);
  const [presets, setPresets] = useState<MappingPreset[]>(saved.presets);
  const [showTestPattern, setShowTestPattern] = useState(false);
  const [testPattern, setTestPatternState] = useState<OutputMappingState['testPattern']>('grid');

  const isActive = !isDefaultCorners(corners);

  // Sincroniza o mapeamento com a janela de projeção via BroadcastChannel dedicado
  useEffect(() => {
    const ch = new BroadcastChannel('ministrystage-videomapping');
    ch.postMessage({ corners, showTestPattern, testPattern });
    return () => ch.close();
  }, [corners, showTestPattern, testPattern]);

  const setCorner = useCallback((corner: keyof CornerMap, pos: [number, number]) => {
    setCorners(prev => {
      const next = { ...prev, [corner]: pos };
      saveToStorage(next, presets);
      return next;
    });
  }, [presets]);

  const resetCorners = useCallback(() => {
    setCorners(DEFAULT_CORNERS);
    saveToStorage(DEFAULT_CORNERS, presets);
  }, [presets]);

  const flipH = useCallback(() => {
    setCorners(prev => {
      const next: CornerMap = {
        tl: prev.tr,
        tr: prev.tl,
        bl: prev.br,
        br: prev.bl,
      };
      saveToStorage(next, presets);
      return next;
    });
  }, [presets]);

  const flipV = useCallback(() => {
    setCorners(prev => {
      const next: CornerMap = {
        tl: prev.bl,
        tr: prev.br,
        bl: prev.tl,
        br: prev.tr,
      };
      saveToStorage(next, presets);
      return next;
    });
  }, [presets]);

  const toggleTestPattern = useCallback(() => setShowTestPattern(p => !p), []);
  const setTestPattern = useCallback((p: OutputMappingState['testPattern']) => setTestPatternState(p), []);

  const savePreset = useCallback((name: string) => {
    const preset: MappingPreset = {
      id: `preset-${Date.now()}`,
      name,
      corners: { ...corners },
    };
    setPresets(prev => {
      const next = [...prev, preset];
      saveToStorage(corners, next);
      return next;
    });
  }, [corners]);

  const loadPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;
    setCorners(preset.corners);
    saveToStorage(preset.corners, presets);
  }, [presets]);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => {
      const next = prev.filter(p => p.id !== id);
      saveToStorage(corners, next);
      return next;
    });
  }, [corners]);

  const getCSSTransform = useCallback((width: number, height: number): string | null => {
    if (!isActive) return null;
    return computeCornerPinTransform(width, height, corners);
  }, [isActive, corners]);

  return (
    <OutputMappingContext.Provider value={{
      corners, presets, isActive,
      showTestPattern, testPattern,
      setCorner, resetCorners, flipH, flipV,
      toggleTestPattern, setTestPattern,
      savePreset, loadPreset, deletePreset,
      getCSSTransform,
    }}>
      {children}
    </OutputMappingContext.Provider>
  );
};

export const useOutputMapping = (): OutputMappingState => {
  const ctx = useContext(OutputMappingContext);
  if (!ctx) throw new Error('useOutputMapping must be used within <OutputMappingProvider>');
  return ctx;
};
