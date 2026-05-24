import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type PreviewSource = 'song' | 'bible' | 'none';

export interface HistoryItem {
  text: string;
  title: string;
  source: PreviewSource;
  timestamp: number;
}

interface PreviewState {
  previewText: string | null;
  previewTitle: string | null;
  previewSource: PreviewSource;
  previewStropheIndex: number | null;

  /** Últimas projeções (máx 5) */
  history: HistoryItem[];

  sendToPreview: (text: string, title?: string, source?: PreviewSource, stropheIndex?: number | null) => void;
  clearPreview: () => void;
  addToHistory: (text: string, title: string, source: PreviewSource) => void;
}

const PreviewContext = createContext<PreviewState | null>(null);

export const PreviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<PreviewSource>('none');
  const [previewStropheIndex, setPreviewStropheIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const sendToPreview = useCallback((
    text: string,
    title: string = '',
    source: PreviewSource = 'song',
    stropheIndex: number | null = null
  ) => {
    setPreviewText(text);
    setPreviewTitle(title);
    setPreviewSource(source);
    setPreviewStropheIndex(stropheIndex);
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewText(null);
    setPreviewTitle(null);
    setPreviewSource('none');
    setPreviewStropheIndex(null);
  }, []);

  const addToHistory = useCallback((text: string, title: string, source: PreviewSource) => {
    setHistory(prev => {
      const item: HistoryItem = { text, title, source, timestamp: Date.now() };
      return [item, ...prev].slice(0, 5); // manter só as 5 últimas
    });
  }, []);

  return (
    <PreviewContext.Provider value={{
      previewText, previewTitle, previewSource, previewStropheIndex,
      history, sendToPreview, clearPreview, addToHistory,
    }}>
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreview = (): PreviewState => {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreview must be used within <PreviewProvider>');
  return ctx;
};
