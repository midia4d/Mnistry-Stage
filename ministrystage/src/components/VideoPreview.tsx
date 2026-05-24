import React, { useState } from 'react';
import { Play, Square, MonitorOff, FolderOpen, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useProjection } from '../context/ProjectionContext';
import { useLyrics } from '../context/LyricsContext';
import { convertFileSrc } from '@tauri-apps/api/core';

export const VideoPreview: React.FC = () => {
  const { isPlaying, currentVideo, channelA, channelB, activeChannel, playVideo, stopVideo } = useVideoPlayer();
  const { projectedText, projectedTitle, projectedSource, isBlackout, isCleared, toggleBlackout, mapping, layers } = useProjection();
  const { activeSong, strophes, currentStropheIndex, currentStrophe, nextStrophe, prevStrophe, goToStrophe } = useLyrics();
  const [showControls, setShowControls] = useState(false);

  const fileName = currentVideo?.split('/').pop()?.split('\\').pop() ?? '';

  const displayText = isCleared ? null : (projectedText ?? currentStrophe);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ aspectRatio: '16/9', background: '#000' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >

      {/* ── BLACKOUT OVERLAY ── */}
      {isBlackout && (
        <div
          className="absolute inset-0 bg-black z-50 flex items-center justify-center animate-fade-in-up cursor-pointer"
          onClick={toggleBlackout}
        >
          <div className="flex flex-col items-center gap-3">
            <MonitorOff size={40} style={{ color: 'rgba(239,68,68,0.7)' }} />
            <span className="text-sm font-bold tracking-widest uppercase" style={{ color: 'rgba(239,68,68,0.7)' }}>
              Blackout — clique para remover
            </span>
          </div>
        </div>
      )}

      {/* ── CAMADA 1: BACKGROUND (Z-10) ── */}
      {layers?.background?.visible && (
        <div 
          className="absolute inset-0 z-10 transition-opacity duration-300"
          style={{ opacity: (layers.background.opacity ?? 100) / 100 }}
        >
          {channelA && (
            <video
              src={convertFileSrc(channelA)}
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
              style={{ opacity: activeChannel === 'A' && isPlaying ? 1 : 0 }}
            />
          )}
          
          {channelB && (
            <video
              src={convertFileSrc(channelB)}
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
              style={{ opacity: activeChannel === 'B' && isPlaying ? 1 : 0 }}
            />
          )}
        </div>
      )}

      {/* ── CAMADA 2: OVERLAYS (Z-20) ── */}
      <div className="absolute inset-0 z-20 pointer-events-none" />

      {/* ── CAMADA 3: TEXTOS (Z-30) ── */}
      {!isBlackout && displayText && layers?.text?.visible && (
        <div 
          className="absolute inset-0 z-30 flex flex-col pointer-events-none transition-opacity duration-300"
          style={{ 
            opacity: (layers.text.opacity ?? 100) / 100,
            justifyContent: mapping.verticalAlign === 'top' ? 'flex-start' : mapping.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            padding: `${mapping.paddingY}% ${mapping.paddingX}%`,
          }}
        >
          <div 
            className="animate-lyric-in whitespace-pre-line"
            style={{
              fontSize: `${mapping.fontSize}px`,
              fontWeight: mapping.fontWeight,
              fontFamily: `'${mapping.fontFamily}', sans-serif`,
              color: mapping.textColor,
              lineHeight: mapping.lineHeight,
              letterSpacing: `${mapping.letterSpacing}px`,
              textAlign: mapping.textAlign,
              textTransform: mapping.textCase === 'none' ? 'none' : mapping.textCase,
              WebkitTextStroke: mapping.textStroke ? '1px rgba(0,0,0,0.4)' : 'none',
              textShadow:
                mapping.textShadow === 'strong' ? '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)' :
                mapping.textShadow === 'light'  ? '0 2px 10px rgba(0,0,0,0.5)' :
                'none',
              maxWidth: '100%',
              margin: mapping.textAlign === 'center' ? '0 auto' : mapping.textAlign === 'right' ? '0 0 0 auto' : '0',
            }}
          >
            {displayText}
          </div>
        </div>
      )}

      {/* ── STATUS BAR (topo) ── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 p-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}
      >
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <>
              <div className="w-2 h-2 rounded-full animate-blink" style={{ background: 'var(--ms-green)' }} />
              <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--ms-green)' }}>AO VIVO</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--ms-text-3)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--ms-text-3)' }}>STANDBY</span>
            </>
          )}
          {projectedSource === 'bible' && (
            <span
              className="text-xs px-2 py-0.5 rounded-full ml-2 font-semibold"
              style={{ background: 'rgba(20,184,166,0.2)', color: 'var(--ms-teal)', border: '1px solid rgba(20,184,166,0.3)' }}
            >
              Bíblia
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {fileName && (
            <span
              className="text-xs px-2.5 py-1 rounded-full truncate max-w-[200px]"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--ms-text-2)', backdropFilter: 'blur(8px)' }}
            >
              {fileName}
            </span>
          )}
          {/* Indicador de estrofe */}
          {strophes.length > 1 && (
            <span
              className="text-xs px-2.5 py-1 rounded font-semibold"
              style={{ background: 'rgba(0,0,0,0.55)', color: 'var(--ms-text-2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {currentStropheIndex + 1} / {strophes.length}
            </span>
          )}
        </div>
      </div>

      {/* ── ÁREA CENTRAL (sem música selecionada) ── */}
      {!activeSong && !projectedText && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3 group transition-all">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Monitor size={22} style={{ color: 'rgba(255,255,255,0.25)' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Selecione uma música ou fundo
            </span>
          </div>
        </div>
      )}



      {/* ── NAVEGAÇÃO DE ESTROFES (aparece no hover) ── */}
      {strophes.length > 1 && !isBlackout && (showControls || true) && (
        <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3 pointer-events-none">
          <button
            onClick={prevStrophe}
            disabled={currentStropheIndex === 0}
            className="pointer-events-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: currentStropheIndex === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              color: currentStropheIndex === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
              opacity: showControls ? 1 : 0.3,
              transition: 'opacity 0.2s, background 0.2s',
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={nextStrophe}
            disabled={currentStropheIndex === strophes.length - 1}
            className="pointer-events-auto w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: currentStropheIndex === strophes.length - 1 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              color: currentStropheIndex === strophes.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
              opacity: showControls ? 1 : 0.3,
              transition: 'opacity 0.2s, background 0.2s',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── DOTS de estrofes ── */}
      {strophes.length > 1 && !isBlackout && (
        <div className="absolute bottom-3 left-0 right-0 z-25 flex items-center justify-center gap-1.5">
          {strophes.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStrophe(i)}
              className="rounded-full transition-all"
              style={{
                width: i === currentStropheIndex ? 16 : 5,
                height: 5,
                background: i === currentStropheIndex ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
              }}
            />
          ))}
        </div>
      )}


      {/* ── CONTROLES INFERIORES (hover) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-2 px-4 py-3 transition-opacity"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          paddingTop: 40,
          opacity: showControls ? 1 : 0,
        }}
      >
        <div className="flex-1" />
        <button
          onClick={toggleBlackout}
          className="flex items-center justify-center gap-1.5 text-xs px-3 font-medium rounded-xl transition-all"
          style={{
            minHeight: 34,
            background: isBlackout ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--ms-red)',
          }}
        >
          <Monitor size={13} /> {isBlackout ? 'Remover Blackout' : 'Blackout'}
        </button>
      </div>
    </div>
  );
};
