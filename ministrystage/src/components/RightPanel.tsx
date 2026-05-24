import React, { useState } from 'react';
import {
  Layers as LayersIcon, MonitorOff, Timer, SkipBack, SkipForward,
  Eye, EyeOff, Video, Music2, Monitor, ChevronRight
} from 'lucide-react';
import { useProjection } from '../context/ProjectionContext';
import { usePreview } from '../context/PreviewContext';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { useLyrics } from '../context/LyricsContext';
import { useCountdown } from '../utils/timers';
import { OutputManager } from './OutputManager';

type RightTab = 'live' | 'lyrics' | 'utils';

interface RightPanelProps {
  onNextScene: () => void;
  onPrevScene: () => void;
}

const TabBtn: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex-1 py-1.5 text-xs font-semibold transition-all rounded-md"
    style={{
      background: active ? 'var(--ms-surface-3)' : 'transparent',
      color: active ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
      border: active ? '1px solid var(--ms-border-hover)' : '1px solid transparent',
    }}
  >
    {label}
  </button>
);

export const RightPanel: React.FC<RightPanelProps> = ({ onNextScene, onPrevScene }) => {
  const [tab, setTab] = useState<RightTab>('live');
  const [showOutputManager, setShowOutputManager] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);

  const { isBlackout, toggleBlackout, clearScreen, unclearScreen, isCleared, clearProjection, layers, setLayer, project } = useProjection();
  const { sendToPreview, previewStropheIndex, addToHistory, clearPreview } = usePreview();
  const { isPlaying, stopVideo } = useVideoPlayer();
  const { strophes, currentStropheIndex, activeSong, goToStrophe } = useLyrics();
  const { isActive, timeLeft, start, pause, reset, formatTime } = useCountdown(60);

  const durations = [30, 60, 90, 120];

  return (
    <div className="flex flex-col h-full">

      {/* ── Panel Header ── */}
      <div
        className="shrink-0 flex items-center gap-1 px-3 pt-3 pb-2"
        style={{ borderBottom: '1px solid var(--ms-border)' }}
      >
        <TabBtn active={tab === 'live'} label="Ao Vivo" onClick={() => setTab('live')} />
        <TabBtn active={tab === 'lyrics'} label="Letra" onClick={() => setTab('lyrics')} />
        <TabBtn active={tab === 'utils'} label="Utils" onClick={() => setTab('utils')} />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-3">

        {/* ══════════ AO VIVO ══════════ */}
        {tab === 'live' && (
          <>
            {/* BLACKOUT — hero button */}
            <button
              onClick={toggleBlackout}
              className="w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shrink-0"
              style={{
                background: isBlackout ? 'rgba(239,68,68,0.2)' : 'var(--ms-surface-2)',
                border: `1px solid ${isBlackout ? 'rgba(239,68,68,0.5)' : 'var(--ms-border)'}`,
                color: isBlackout ? 'var(--ms-red)' : 'var(--ms-text-2)',
                boxShadow: isBlackout ? '0 0 20px rgba(239,68,68,0.15)' : 'none',
              }}
            >
              <MonitorOff size={16} />
              {isBlackout ? 'BLACKOUT ATIVO' : 'BLACKOUT'}
            </button>

            {/* LAYERS */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: '1px solid var(--ms-border)' }}
              >
                <LayersIcon size={12} style={{ color: 'var(--ms-text-3)' }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-3)' }}>Layers</span>
              </div>

              {/* Text layer */}
              <div
                className="flex items-center justify-between px-3 py-2.5 transition-all"
                style={{ borderBottom: '1px solid var(--ms-border)' }}
              >
                <div>
                  <p className="text-xs font-semibold" style={{ color: layers.text.visible ? 'var(--ms-text-1)' : 'var(--ms-text-3)' }}>Texto</p>
                  <p className="text-[10px]" style={{ color: 'var(--ms-text-4)' }}>Letras · Bíblia</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLayer('text', { visible: !layers.text.visible })}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                    style={{
                      background: layers.text.visible ? 'var(--ms-surface-4)' : 'transparent',
                      color: layers.text.visible ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
                      border: '1px solid var(--ms-border)',
                    }}
                  >
                    {layers.text.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={() => { clearScreen(); setLayer('text', { visible: false }); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all"
                    style={{ color: 'var(--ms-red)', background: 'var(--ms-red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Background layer */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold" style={{ color: layers.background.visible ? 'var(--ms-text-1)' : 'var(--ms-text-3)' }}>Fundo</p>
                  <p className="text-[10px]" style={{ color: 'var(--ms-text-4)' }}>Vídeos · Imagens</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range" min="0" max="100"
                    value={layers.background.opacity}
                    onChange={(e) => setLayer('background', { opacity: Number(e.target.value) })}
                    className="w-12"
                    title="Opacidade"
                  />
                  <button
                    onClick={() => setLayer('background', { visible: !layers.background.visible })}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                    style={{
                      background: layers.background.visible ? 'var(--ms-surface-4)' : 'transparent',
                      color: layers.background.visible ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
                      border: '1px solid var(--ms-border)',
                    }}
                  >
                    {layers.background.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={() => { stopVideo(); setLayer('background', { visible: false }); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all"
                    style={{ color: 'var(--ms-red)', background: 'var(--ms-red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <button
              onClick={() => {
                clearScreen();
                stopVideo();
                setLayer('text', { visible: false });
                setLayer('background', { visible: false });
                if (isBlackout) toggleBlackout();
              }}
              className="w-full py-2 rounded-lg font-semibold text-xs tracking-wider transition-all"
              style={{ background: 'var(--ms-red-dim)', color: 'var(--ms-red)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              LIMPAR TUDO
            </button>

            <button
              onClick={() => setShowOutputManager(true)}
              className="w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              style={{ background: 'var(--ms-surface-2)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border)' }}
            >
              <Monitor size={13} />
              SAÍDAS DE VÍDEO
              <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--ms-text-3)' }} />
            </button>
          </>
        )}

        {/* ══════════ LETRA ══════════ */}
        {tab === 'lyrics' && (
          <>
            {activeSong && strophes.length > 0 ? (
              <div
                className="rounded-lg flex-1 flex flex-col overflow-hidden"
                style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}
              >
                <div
                  className="px-3 py-2.5 shrink-0 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--ms-border)' }}
                >
                  <div>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--ms-text-1)', maxWidth: 140 }}>{activeSong.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--ms-text-3)' }}>{strophes.length} estrofes</p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded font-bold"
                    style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border-hover)' }}
                  >
                    {currentStropheIndex + 1}/{strophes.length}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
                  {strophes.map((strophe, i) => {
                    const isLive = i === currentStropheIndex && !isCleared;
                    const isPreview = previewStropheIndex === i;
                    
                    const handleDoubleClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      goToStrophe(i);
                      project(strophe, activeSong?.title ?? '', 'song');
                      unclearScreen();
                      addToHistory(strophe, activeSong?.title ?? '', 'song');
                      
                      // Auto-advance preview
                      const nextIdx = i + 1;
                      if (nextIdx < strophes.length) {
                        sendToPreview(strophes[nextIdx], activeSong?.title ?? '', 'song', nextIdx);
                      } else {
                        clearPreview();
                      }
                    };

                    return (
                      <button
                        key={i}
                        onClick={() => { sendToPreview(strophe, activeSong?.title, 'song', i); }}
                        onDoubleClick={handleDoubleClick}
                        className="text-left px-2.5 py-2 rounded-md text-[11px] leading-relaxed transition-all relative group overflow-hidden"
                        style={{
                          background: isLive ? 'var(--ms-surface-4)' : isPreview ? 'rgba(255,255,255,0.04)' : 'transparent',
                          color: isLive ? 'var(--ms-text-1)' : 'var(--ms-text-2)',
                          border: `1px solid ${isLive ? 'var(--ms-border-hover)' : isPreview ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                          fontWeight: isLive ? 600 : 400,
                          paddingLeft: (isLive || isPreview) ? '24px' : '10px',
                        }}
                        onMouseEnter={e => {
                          if (!isLive && !isPreview) (e.currentTarget as HTMLElement).style.background = 'var(--ms-surface-2)';
                        }}
                        onMouseLeave={e => {
                          if (!isLive && !isPreview) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        {/* Indicators */}
                        {isLive && (
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                            <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: 'var(--ms-green)' }} />
                          </div>
                        )}
                        {!isLive && isPreview && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50">
                            <Eye size={10} style={{ color: 'var(--ms-text-2)' }} />
                          </div>
                        )}
                        {strophe}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center opacity-40">
                  <Music2 size={28} className="mx-auto mb-2" style={{ color: 'var(--ms-text-3)' }} />
                  <p className="text-xs" style={{ color: 'var(--ms-text-3)' }}>Nenhuma música ativa</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--ms-text-4)' }}>Selecione no painel de Letras</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════ UTILS ══════════ */}
        {tab === 'utils' && (
          <>
            {/* Timer */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: '1px solid var(--ms-border)' }}
              >
                <Timer size={12} style={{ color: 'var(--ms-text-3)' }} />
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-3)' }}>Timer</span>
              </div>

              <div className="p-3">
                <div className="text-center mb-3">
                  <span
                    className="text-4xl font-bold tabular-nums tracking-tight"
                    style={{
                      color: timeLeft === 0 ? 'var(--ms-red)' : isActive ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
                    }}
                  >
                    {formatTime()}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 mb-3">
                  {durations.map(d => (
                    <button
                      key={d}
                      onClick={() => { setSelectedDuration(d); reset(d); }}
                      className="text-xs font-bold py-1.5 rounded-md transition-all"
                      style={{
                        background: selectedDuration === d ? 'var(--ms-surface-3)' : 'transparent',
                        color: selectedDuration === d ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
                        border: `1px solid ${selectedDuration === d ? 'var(--ms-border-hover)' : 'transparent'}`,
                      }}
                    >
                      {d >= 60 ? `${d / 60}m` : `${d}s`}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={isActive ? pause : start}
                    className="flex-1 py-2.5 rounded-md text-sm font-bold transition-all"
                    style={{
                      background: isActive ? 'var(--ms-red-dim)' : 'var(--ms-surface-3)',
                      color: isActive ? 'var(--ms-red)' : 'var(--ms-text-1)',
                      border: `1px solid ${isActive ? 'rgba(239,68,68,0.3)' : 'var(--ms-border-hover)'}`,
                    }}
                  >
                    {isActive ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button
                    onClick={() => reset(selectedDuration)}
                    className="px-3 py-2.5 rounded-md text-sm transition-all"
                    style={{ background: 'var(--ms-surface-2)', color: 'var(--ms-text-3)', border: '1px solid var(--ms-border)' }}
                  >
                    ↺
                  </button>
                </div>
              </div>
            </div>

            {/* Scene navigation */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: '1px solid var(--ms-border)' }}
              >
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-3)' }}>Cenas</span>
              </div>
              <div className="p-2 grid grid-cols-2 gap-1.5">
                <button
                  onClick={onPrevScene}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-md text-xs font-medium transition-all"
                  style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border)' }}
                >
                  <SkipBack size={16} />
                  Anterior
                </button>
                <button
                  onClick={onNextScene}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-md text-xs font-medium transition-all"
                  style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border)' }}
                >
                  <SkipForward size={16} />
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showOutputManager && <OutputManager onClose={() => setShowOutputManager(false)} />}
    </div>
  );
};
