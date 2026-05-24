import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ProjectionSource = 'song' | 'bible' | 'none';

export interface MappingConfig {
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'center' | 'bottom';
  textShadow: 'none' | 'light' | 'strong';
  textColor: string;
  textStroke: boolean;
  fontFamily: string;
  fontWeight: 400 | 500 | 600 | 700 | 800 | 900;
  lineHeight: number;
  letterSpacing: number;
  paddingX: number;
  paddingY: number;
  textCase: 'none' | 'uppercase' | 'lowercase';
}

export interface LayerConfig {
  visible: boolean;
  opacity: number;
}

export interface LayerState {
  background: LayerConfig;
  media: LayerConfig;
  text: LayerConfig;
  alerts: LayerConfig;
}

interface ProjectionState {
  projectedText: string | null;
  projectedTitle: string | null;
  projectedSource: ProjectionSource;
  isBlackout: boolean;
  isCleared: boolean;
  mapping: MappingConfig;
  layers: LayerState;
  project: (text: string, title: string, source: ProjectionSource) => void;
  clearProjection: () => void;
  clearScreen: () => void;
  unclearScreen: () => void;
  toggleBlackout: () => void;
  setBlackout: (val: boolean) => void;
  activeAlert: string | null;
  setAlert: (msg: string | null) => void;
  updateMapping: (config: Partial<MappingConfig>) => void;
  setLayer: (layerName: keyof LayerState, config: Partial<LayerConfig>) => void;
}

const defaultMapping: MappingConfig = {
  fontSize: 40,
  textAlign: 'center',
  verticalAlign: 'center',
  textShadow: 'strong',
  textColor: '#ffffff',
  textStroke: false,
  fontFamily: 'Inter',
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: 0,
  paddingX: 8,
  paddingY: 8,
  textCase: 'none',
};

const ProjectionContext = createContext<ProjectionState | null>(null);

export const ProjectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectedText, setProjectedText] = useState<string | null>(null);
  const [projectedTitle, setProjectedTitle] = useState<string | null>(null);
  const [projectedSource, setProjectedSource] = useState<ProjectionSource>('none');
  const [isBlackout, setIsBlackout] = useState(false);
  const [isCleared, setIsCleared] = useState(true);
  const [mapping, setMapping] = useState<MappingConfig>(() => {
    try {
      const saved = localStorage.getItem('ms-mapping');
      if (saved) return { ...defaultMapping, ...JSON.parse(saved) };
    } catch {}
    return defaultMapping;
  });
  const [layers, setLayers] = useState<LayerState>({
    background: { visible: true, opacity: 100 },
    media: { visible: true, opacity: 100 },
    text: { visible: true, opacity: 100 },
    alerts: { visible: true, opacity: 100 }
  });
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const project = useCallback((text: string, title: string, source: ProjectionSource) => {
    setProjectedText(text);
    setProjectedTitle(title);
    setProjectedSource(source);
    setIsBlackout(false); // auto-remove blackout when projecting
    setIsCleared(false); // projecting something means screen is not clear
  }, []);

  const clearProjection = useCallback(() => {
    setProjectedText(null);
    setProjectedTitle(null);
    setProjectedSource('none');
    setIsCleared(true);
  }, []);

  const clearScreen = useCallback(() => setIsCleared(true), []);
  const unclearScreen = useCallback(() => setIsCleared(false), []);

  const toggleBlackout = useCallback(() => setIsBlackout(b => !b), []);
  const setBlackout = useCallback((val: boolean) => setIsBlackout(val), []);
  const setAlert = useCallback((msg: string | null) => setActiveAlert(msg), []);
  const updateMapping = useCallback((config: Partial<MappingConfig>) => {
    setMapping(prev => {
      const next = { ...prev, ...config };
      localStorage.setItem('ms-mapping', JSON.stringify(next));
      return next;
    });
  }, []);
  const setLayer = useCallback((layerName: keyof LayerState, config: Partial<LayerConfig>) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: { ...prev[layerName], ...config }
    }));
  }, []);

  return (
    <ProjectionContext.Provider value={{
      projectedText, projectedTitle, projectedSource,
      isBlackout, isCleared, mapping, layers, activeAlert, 
      project, clearProjection, clearScreen, unclearScreen, 
      toggleBlackout, setBlackout, setAlert, updateMapping, setLayer,
    }}>
      {children}
    </ProjectionContext.Provider>
  );
};

export const useProjection = (): ProjectionState => {
  const ctx = useContext(ProjectionContext);
  if (!ctx) throw new Error('useProjection must be used within <ProjectionProvider>');
  return ctx;
};
