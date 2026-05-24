import React, { useState, useEffect } from 'react';
import { LyricsPanel } from './components/LyricsPanel';
import { BiblePanel } from './components/BiblePanel';
import { MappingPanel } from './components/MappingPanel';
import { VideoMappingEditor } from './components/VideoMappingEditor';
import { MediaPanel } from './components/MediaPanel';
import { SceneTabs } from './components/SceneTabs';
import { CompositionPanel } from './components/CompositionPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { RightPanel } from './components/RightPanel';
import { UpdaterModal } from './components/UpdaterModal';
import { useGlobalShortcuts } from './utils/shortcuts';
import { useLyrics } from './context/LyricsContext';
import { useProjection } from './context/ProjectionContext';
import { useVideoPlayer } from './context/VideoPlayerContext';
import { usePreview } from './context/PreviewContext';
import { useSyncBroadcaster } from './hooks/useSyncState';
import {
  Music2, BookOpen, Layers, Settings, MonitorPlay,
  ChevronLeft, ChevronRight, Move, Bell
} from 'lucide-react';

type SidebarTab = 'lyrics' | 'bible' | 'mapping' | 'videomapping' | 'alerts';

const App: React.FC = () => {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('lyrics');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeScene, setActiveScene] = useState(1);

  const { activeSong, currentStrophe, strophes, currentStropheIndex, nextStrophe, prevStrophe } = useLyrics();
  const { isBlackout, toggleBlackout, projectedText, isCleared, mapping, layers, activeAlert } = useProjection();
  const { channelA, channelB, activeChannel, blendMode, crossfade, isPlaying } = useVideoPlayer();
  const { previewText, previewTitle } = usePreview();

  useSyncBroadcaster({
    channelA,
    channelB,
    activeChannel,
    blendMode,
    crossfade,
    isPlaying,
    projectedText: isCleared ? null : (projectedText ?? currentStrophe),
    projectedTitle: null,
    previewText,
    previewTitle,
    activeAlert,
    isBlackout,
    isCleared,
    mapping,
    layers
  });

  useGlobalShortcuts();

  useEffect(() => {
    const onScene = (e: CustomEvent) => setActiveScene(e.detail);
    const onBible = () => setSidebarTab(t => t === 'bible' ? 'lyrics' : 'bible');
    const onBlackout = () => toggleBlackout();
    const onNext = () => nextStrophe();
    const onPrev = () => prevStrophe();

    window.addEventListener('changeScene', onScene as EventListener);
    window.addEventListener('toggleBible', onBible);
    window.addEventListener('toggleBlackout', onBlackout);
    window.addEventListener('nextStrophe', onNext);
    window.addEventListener('prevStrophe', onPrev);

    return () => {
      window.removeEventListener('changeScene', onScene as EventListener);
      window.removeEventListener('toggleBible', onBible);
      window.removeEventListener('toggleBlackout', onBlackout);
      window.removeEventListener('nextStrophe', onNext);
      window.removeEventListener('prevStrophe', onPrev);
    };
  }, [toggleBlackout, nextStrophe, prevStrophe]);

  const handleNextScene = () => setActiveScene(s => Math.min(12, s + 1));
  const handlePrevScene = () => setActiveScene(s => Math.max(1, s - 1));

  const sidebarItems: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
    { id: 'lyrics',       icon: <Music2 size={18} />,   label: 'Letras' },
    { id: 'bible',        icon: <BookOpen size={18} />,  label: 'Bíblia' },
    { id: 'mapping',      icon: <Layers size={18} />,    label: 'Mapeamento de Texto' },
    { id: 'videomapping', icon: <Move size={18} />,      label: 'Video Mapping' },
    { id: 'alerts',       icon: <Bell size={18} />,      label: 'Alertas (Avisos)' },
  ];

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden text-white" 
      style={{ background: 'var(--ms-surface-0)', fontFamily: 'Inter, sans-serif' }}
    >
      <UpdaterModal />

      {/* ── TITLEBAR ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4"
        style={{
          height: 40,
          background: 'var(--ms-surface-0)',
          borderBottom: '1px solid var(--ms-border)',
        }}
      >
        {/* Left: Logo + App name */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: 'var(--ms-surface-3)', border: '1px solid var(--ms-border-hover)' }}
          >
            <MonitorPlay size={13} color="white" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--ms-text-3)', letterSpacing: '0.12em' }}>
            MinistryStage
          </span>

          {activeSong && (
            <>
              <div className="w-px h-3 mx-1" style={{ background: 'var(--ms-border-hover)' }} />
              <div className="flex items-center gap-2 animate-fade-in">
                <div className="ms-live-dot" />
                <span className="text-xs font-semibold" style={{ color: 'var(--ms-text-1)' }}>
                  {activeSong.title}
                </span>
                {activeSong.artist && (
                  <span className="text-xs" style={{ color: 'var(--ms-text-3)' }}>
                    — {activeSong.artist}
                  </span>
                )}
                {strophes.length > 0 && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-bold"
                    style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border-hover)' }}
                  >
                    {currentStropheIndex + 1} / {strophes.length}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center: Status indicators */}
        <div className="flex items-center gap-3">
          {isBlackout && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md animate-fade-in"
              style={{ background: 'var(--ms-red-dim)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: 'var(--ms-red)' }} />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-red)' }}>Blackout</span>
            </div>
          )}
          <span className="text-[10px]" style={{ color: 'var(--ms-text-4)' }}>
            Enter · Esc · ← →
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium" style={{ color: 'var(--ms-text-3)' }}>
            Cena: <span style={{ color: 'var(--ms-text-1)' }}>F{activeScene}</span>
          </span>
          <button data-tooltip="Configurações" className="ms-sidebar-btn" style={{ width: 28, height: 28, borderRadius: 6 }}>
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── ICON RAIL ── */}
        <nav
          className="flex flex-col items-center py-3 gap-1 shrink-0 z-20"
          style={{
            width: 52,
            background: 'var(--ms-surface-0)',
            borderRight: '1px solid var(--ms-border)',
          }}
        >
          {sidebarItems.map(item => (
            <button
              key={item.id}
              data-tooltip={item.label}
              onClick={() => {
                if (sidebarTab === item.id && sidebarOpen) {
                  setSidebarOpen(false);
                } else {
                  setSidebarTab(item.id);
                  setSidebarOpen(true);
                }
              }}
              className={`ms-sidebar-btn ${sidebarTab === item.id && sidebarOpen ? 'active' : ''}`}
            >
              {item.icon}
            </button>
          ))}

          <div className="mt-auto flex flex-col items-center gap-1">
            <div className="ms-divider w-6 mb-1" />
            <button
              data-tooltip={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
              onClick={() => setSidebarOpen(o => !o)}
              className="ms-sidebar-btn"
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </nav>

        {/* ── CONTENT PANEL ── */}
        <div
          className="flex flex-col shrink-0 overflow-hidden transition-all duration-250 ease-in-out"
          style={{
            width: sidebarOpen ? 284 : 0,
            opacity: sidebarOpen ? 1 : 0,
            borderRight: sidebarOpen ? '1px solid var(--ms-border)' : 'none',
            background: 'var(--ms-surface-1)',
          }}
        >
          <div className="flex-1 px-3 py-3 overflow-hidden flex flex-col" style={{ width: 284 }}>
            {sidebarTab === 'lyrics'       && <LyricsPanel />}
            {sidebarTab === 'bible'         && <BiblePanel />}
            {sidebarTab === 'mapping'       && <MappingPanel />}
            {sidebarTab === 'videomapping'  && <VideoMappingEditor />}
            {sidebarTab === 'alerts'        && <AlertsPanel />}
          </div>
        </div>

        {/* ── CENTER: SCENE TABS + PREVIEW/COMPOSITION ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 gap-0">

          {/* Scene tabs bar */}
          <div
            className="shrink-0 flex items-center gap-3 px-3"
            style={{
              height: 44,
              borderBottom: '1px solid var(--ms-border)',
              background: 'var(--ms-surface-1)',
            }}
          >
            {/* Pane labels */}
            <div className="flex items-center gap-1 shrink-0">
              <div
                className="px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--ms-text-4)', border: '1px solid var(--ms-border)', background: 'var(--ms-surface-2)' }}
              >
                Preview
              </div>
              <div className="w-4 h-px" style={{ background: 'var(--ms-border)' }} />
              <div
                className="px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--ms-text-4)', border: '1px solid var(--ms-border)', background: 'var(--ms-surface-2)' }}
              >
                Composition
              </div>
            </div>

            <div className="w-px h-5 shrink-0" style={{ background: 'var(--ms-border)' }} />

            {/* Scene tabs */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <SceneTabs activeScene={activeScene} onSceneChange={setActiveScene} />
            </div>
          </div>

          {/* ── PREVIEW / COMPOSITION split ── */}
          <CompositionPanel />

        </main>

        {/* ── RIGHT PANEL ── */}
        <aside
          className="flex flex-col shrink-0 overflow-y-auto"
          style={{
            width: 248,
            borderLeft: '1px solid var(--ms-border)',
            background: 'var(--ms-surface-1)',
          }}
        >
          <RightPanel
            onNextScene={handleNextScene}
            onPrevScene={handlePrevScene}
          />
        </aside>
      </div>

      {/* ── MEDIA DOCK (bottom) ── */}
      <div
        className="shrink-0 w-full relative z-30"
        style={{
          height: 200,
          borderTop: '1px solid var(--ms-border)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <MediaPanel />
      </div>

    </div>
  );
};

export default App;
