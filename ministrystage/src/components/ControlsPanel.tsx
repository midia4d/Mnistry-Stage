import React, { useState } from 'react';
import {
  SkipForward, SkipBack, MonitorOff, FolderOpen, Timer, Smartphone,
  ChevronLeft, ChevronRight, Video, Eye, EyeOff, Layers as LayersIcon
} from 'lucide-react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useProjection } from '../context/ProjectionContext';
import { useLyrics } from '../context/LyricsContext';
import { open } from '@tauri-apps/plugin-dialog';
import { useCountdown } from '../utils/timers';
import { OutputManager } from './OutputManager';

interface ControlsPanelProps {
  onNextScene: () => void;
  onPrevScene: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({ onNextScene, onPrevScene }) => {
  const { isPlaying, playVideo, stopVideo } = useVideoPlayer();
  const { isBlackout, toggleBlackout, clearScreen, unclearScreen, isCleared, clearProjection, layers, setLayer } = useProjection();
  const { nextStrophe, prevStrophe, strophes, currentStropheIndex, activeSong, goToStrophe } = useLyrics();
  const { isActive, timeLeft, start, pause, reset, formatTime } = useCountdown(30);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [showOutputManager, setShowOutputManager] = useState(false);

  const durations = [30, 60, 90, 120];

  const handleOpenVideo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Vídeos', extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm'] }]
      });
      if (selected && typeof selected === 'string') {
        await playVideo(selected);
      }
    } catch (e) { console.error(e); }
  };

  const handleTimerSelect = (d: number) => {
    setSelectedDuration(d);
    reset(d);
  };

  const handleTimerToggle = () => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  };

  const handleTimerReset = () => {
    reset(selectedDuration);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto">

      {/* ── Timer ── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
        <p className="ms-section-title mb-3">Timer</p>

        {/* Display */}
        <div className="text-center mb-3">
          <span
            className="text-4xl font-bold tabular-nums tracking-tight"
            style={{
              background: isActive ? 'var(--ms-grad-accent)' : 'none',
              WebkitBackgroundClip: isActive ? 'text' : 'unset',
              WebkitTextFillColor: isActive ? 'transparent' : 'var(--ms-text-3)',
              color: isActive ? 'transparent' : (timeLeft === 0 ? 'var(--ms-red)' : 'var(--ms-text-3)'),
            }}
          >
            {formatTime()}
          </span>
          {timeLeft === 0 && !isActive && (
            <p className="text-xs mt-1 font-semibold animate-blink" style={{ color: 'var(--ms-red)' }}>
              Tempo esgotado!
            </p>
          )}
        </div>

        {/* Durações */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {durations.map(d => (
            <button
              key={d}
              onClick={() => handleTimerSelect(d)}
              className="text-xs font-semibold py-2 rounded-xl transition-all"
              style={{
                background: selectedDuration === d ? 'rgba(124,58,237,0.2)' : 'var(--ms-surface-1)',
                color: selectedDuration === d ? 'var(--ms-accent)' : 'var(--ms-text-3)',
                border: `1px solid ${selectedDuration === d ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
              }}
            >
              {d >= 60 ? `${d / 60}m` : `${d}s`}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTimerToggle}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: isActive ? 'rgba(239,68,68,0.15)' : 'var(--ms-grad-accent)',
              color: isActive ? 'var(--ms-red)' : 'white',
              border: isActive ? '1px solid rgba(239,68,68,0.3)' : 'none',
              boxShadow: isActive ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
            }}
          >
            <Timer size={16} />
            {isActive ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            onClick={handleTimerReset}
            className="px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: 'var(--ms-surface-1)',
              color: 'var(--ms-text-3)',
              border: '1px solid var(--ms-border)',
            }}
            title="Resetar timer"
          >
            ↺
          </button>
        </div>
      </div>

      {/* ── Navegação de Cenas ── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
        <p className="ms-section-title mb-3">Cenas</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onPrevScene} className="ms-btn-ghost text-sm py-3 flex-col gap-1">
            <SkipBack size={18} />
            <span className="text-xs">Anterior</span>
          </button>
          <button onClick={onNextScene} className="ms-btn-ghost text-sm py-3 flex-col gap-1">
            <SkipForward size={18} />
            <span className="text-xs">Próxima</span>
          </button>
        </div>
      </div>

      {/* ── Navegação de Estrofes (Composition) ── */}
      {activeSong && strophes.length > 0 && (
        <div className="rounded-2xl p-4 flex flex-col max-h-[350px]" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="ms-section-title" style={{ marginBottom: 0 }}>Letra (Preview)</p>
            <span className="text-xs font-semibold" style={{ color: 'var(--ms-accent)' }}>
              {strophes.length} blocos
            </span>
          </div>
          
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-1 -mr-1">
            {strophes.map((strophe, index) => {
              const isLive = index === currentStropheIndex && !isCleared;
              return (
                <button
                  key={index}
                  onClick={() => {
                    goToStrophe(index);
                    clearProjection(); // Remove o versículo bíblico se houvesse algum
                    unclearScreen(); // Clicou no bloco, joga pra tela
                  }}
                  className="text-left p-3 rounded-xl text-xs leading-5 transition-all text-balance"
                  style={{
                    background: isLive ? 'rgba(124,58,237,0.2)' : 'var(--ms-surface-1)',
                    color: isLive ? 'white' : 'var(--ms-text-2)',
                    border: `1px solid ${isLive ? 'rgba(124,58,237,0.4)' : 'var(--ms-border)'}`,
                    fontWeight: isLive ? 600 : 400,
                  }}
                >
                  {strophe}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── GERENCIADOR DE LAYERS (Resolume Style) ── */}
      <div className="rounded-2xl p-4 mt-auto mb-2" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <LayersIcon size={18} style={{ color: 'var(--ms-accent)' }} />
          <p className="ms-section-title" style={{ marginBottom: 0 }}>Gerenciador de Layers</p>
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Layer de Texto */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl border transition-all"
            style={{ 
              background: layers.text.visible ? 'rgba(124,58,237,0.1)' : 'var(--ms-surface-1)',
              borderColor: layers.text.visible ? 'rgba(124,58,237,0.3)' : 'var(--ms-border)'
            }}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold" style={{ color: layers.text.visible ? 'var(--ms-accent)' : 'var(--ms-text-3)' }}>3. Textos</span>
              <span className="text-[10px]" style={{ color: 'var(--ms-text-3)' }}>Letras, Bíblia</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLayer('text', { visible: !layers.text.visible })}
                className="p-2 rounded-lg transition-colors hover:bg-purple-500/20"
                style={{ color: layers.text.visible ? 'var(--ms-accent)' : 'var(--ms-text-3)' }}
              >
                {layers.text.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button 
                onClick={() => { clearScreen(); setLayer('text', { visible: false }); }}
                className="p-2 rounded-lg transition-colors hover:bg-red-500/20 text-red-400"
                title="Limpar Letra"
              >
                X
              </button>
            </div>
          </div>

          {/* Layer de Fundo */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl border transition-all"
            style={{ 
              background: layers.background.visible ? 'rgba(124,58,237,0.1)' : 'var(--ms-surface-1)',
              borderColor: layers.background.visible ? 'rgba(124,58,237,0.3)' : 'var(--ms-border)'
            }}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold" style={{ color: layers.background.visible ? 'var(--ms-accent)' : 'var(--ms-text-3)' }}>1. Fundo</span>
              <span className="text-[10px]" style={{ color: 'var(--ms-text-3)' }}>Vídeos, Imagens</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="range" 
                min="0" max="100" 
                value={layers.background.opacity} 
                onChange={(e) => setLayer('background', { opacity: Number(e.target.value) })}
                className="w-16 accent-purple-500"
                title="Opacidade do Fundo"
              />
              <button 
                onClick={() => setLayer('background', { visible: !layers.background.visible })}
                className="p-2 rounded-lg transition-colors hover:bg-purple-500/20"
                style={{ color: layers.background.visible ? 'var(--ms-accent)' : 'var(--ms-text-3)' }}
              >
                {layers.background.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button 
                onClick={() => { stopVideo(); setLayer('background', { visible: false }); }}
                className="p-2 rounded-lg transition-colors hover:bg-red-500/20 text-red-400"
                title="Limpar Fundo"
              >
                X
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              clearScreen();
              stopVideo();
              setLayer('text', { visible: false });
              setLayer('background', { visible: false });
              if (isBlackout) toggleBlackout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-xl border font-bold text-xs transition-all hover:bg-red-500 hover:text-white"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.3)',
              color: 'var(--ms-red)',
            }}
          >
            ❌ LIMPAR TUDO (CLEAR ALL)
          </button>
        </div>
      </div>

      {/* ── BLACKOUT TOTAL ── */}
      <div className="pt-2">
        <button
          onClick={() => setShowOutputManager(true)}
          className="w-full py-3 mb-2 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20"
        >
          <MonitorOff size={18} />
          CONFIGURAR SAÍDAS (TELÃO)
        </button>

        <button
          onClick={toggleBlackout}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all"
          style={{
            background: isBlackout ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.5)',
            border: `2px solid ${isBlackout ? 'var(--ms-red)' : 'rgba(239,68,68,0.4)'}`,
            color: 'var(--ms-red)',
            boxShadow: isBlackout ? '0 0 30px rgba(239,68,68,0.3)' : 'none',
          }}
        >
          <MonitorOff size={22} />
          {isBlackout ? 'BLACKOUT ATIVO' : 'BLACKOUT'}
        </button>
      </div>

      {showOutputManager && (
        <OutputManager onClose={() => setShowOutputManager(false)} />
      )}
    </div>
  );
};
