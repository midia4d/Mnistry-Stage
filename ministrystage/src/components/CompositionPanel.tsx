import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  MonitorOff, Monitor, ChevronLeft, ChevronRight,
  ArrowRight, X, Clock, BookOpen, Zap, ScanLine
} from 'lucide-react';
import { useProjection } from '../context/ProjectionContext';
import { usePreview } from '../context/PreviewContext';
import { useLyrics } from '../context/LyricsContext';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { convertFileSrc } from '@tauri-apps/api/core';

// ── Renderiza o conteúdo de texto sobre o fundo ────────────────────────────
interface TextOverlayProps {
  text: string | null;
  mapping: ReturnType<typeof useProjection>['mapping'];
  opacity?: number;
  animKey?: number;
}
const TextOverlay: React.FC<TextOverlayProps> = ({ text, mapping, opacity = 1, animKey = 0 }) => {
  if (!text) return null;
  return (
    <div
      className="absolute inset-0 flex flex-col pointer-events-none"
      style={{
        opacity,
        justifyContent:
          mapping.verticalAlign === 'top' ? 'flex-start' :
          mapping.verticalAlign === 'bottom' ? 'flex-end' : 'center',
        padding: `${mapping.paddingY}% ${mapping.paddingX}%`,
      }}
    >
      <div
        key={animKey}
        className="animate-composition-in whitespace-pre-line"
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
          margin:
            mapping.textAlign === 'center' ? '0 auto' :
            mapping.textAlign === 'right' ? '0 0 0 auto' : '0',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ── Pane label badge ───────────────────────────────────────────────────────
const PaneLabel: React.FC<{ label: string; color?: string; dot?: boolean }> = ({ label, color, dot }) => (
  <div
    className="flex items-center gap-1.5 px-2 py-1 rounded-md"
    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.07)' }}
  >
    {dot && <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: color || 'var(--ms-green)' }} />}
    <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: color || 'rgba(255,255,255,0.45)' }}>
      {label}
    </span>
  </div>
);

// ── Chip de histórico ──────────────────────────────────────────────────────
const HistoryChip: React.FC<{
  text: string;
  title: string;
  source: string;
  onClick: () => void;
}> = ({ text, title, source, onClick }) => {
  const firstLine = text.split('\n')[0].trim();
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex flex-col gap-0.5 px-2.5 py-1.5 rounded-md text-left transition-all group"
      style={{
        background: 'var(--ms-surface-2)',
        border: '1px solid var(--ms-border)',
        minWidth: 100,
        maxWidth: 140,
      }}
      title={text}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ms-border-hover)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ms-border)')}
    >
      {title && (
        <span className="text-[9px] font-bold tracking-wider uppercase truncate w-full" style={{ color: 'var(--ms-text-4)' }}>
          {source === 'bible' ? (
            <span className="flex items-center gap-1">
              <BookOpen size={8} />
              {title.replace(' (Almeida)', '')}
            </span>
          ) : title}
        </span>
      )}
      <span className="text-[10px] truncate w-full" style={{ color: 'var(--ms-text-3)' }}>
        {firstLine}
      </span>
    </button>
  );
};

const BgVideosMemo = React.memo(({ channelA, channelB, isPlaying, crossfade, blendMode, transitionDuration }: any) => (
  <>
    {channelA && (
      <video
        src={convertFileSrc(channelA)}
        autoPlay loop muted
        className="absolute inset-0 w-full h-full object-cover transition-opacity"
        style={{ opacity: isPlaying ? (1 - crossfade / 100) : 0, transitionDuration: `${transitionDuration}ms` }}
      />
    )}
    {channelB && (
      <video
        src={convertFileSrc(channelB)}
        autoPlay loop muted
        className="absolute inset-0 w-full h-full object-cover transition-opacity"
        style={{ 
          opacity: isPlaying ? (crossfade / 100) : 0,
          mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
          transitionDuration: `${transitionDuration}ms`
        }}
      />
    )}
  </>
));

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITION PANEL
// ═══════════════════════════════════════════════════════════════════════════

export const CompositionPanel: React.FC = () => {
  const {
    projectedText, isBlackout, isCleared, toggleBlackout, activeAlert,
    mapping, layers, project, clearProjection, clearScreen, unclearScreen
  } = useProjection();

  const {
    previewText, previewTitle, previewSource,
    previewStropheIndex, clearPreview, sendToPreview,
    history, addToHistory
  } = usePreview();

  const {
    activeSong, strophes, currentStropheIndex, currentStrophe,
    goToStrophe, nextStrophe, prevStrophe
  } = useLyrics();

  const { channelA, channelB, activeChannel, blendMode, crossfade, transitionDuration, isPlaying } = useVideoPlayer();

  // Key para animar a transição do texto ao vivo
  const [liveAnimKey, setLiveAnimKey] = useState(0);

  // Flash burst state
  const [isFlashing, setIsFlashing] = useState(false);
  const [showScanLine, setShowScanLine] = useState(false);

  // Configurações do flash
  const [flashDuration, setFlashDuration] = useState(450);
  const [flashColor, setFlashColor] = useState('#ffffff');
  const [showFlashSettings, setShowFlashSettings] = useState(false);
  const flashSettingsRef = React.useRef<HTMLDivElement>(null);

  // Fechar settings ao clicar fora
  React.useEffect(() => {
    if (!showFlashSettings) return;
    const handler = (e: MouseEvent) => {
      if (flashSettingsRef.current && !flashSettingsRef.current.contains(e.target as Node)) {
        setShowFlashSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFlashSettings]);

  // Texto que está realmente ao vivo
  const liveText = isCleared ? null : (projectedText ?? currentStrophe);

  // ── Escala reduzida para os panes de preview
  const scaledMapping = { ...mapping, fontSize: Math.round(mapping.fontSize * 0.46) };

  // ── Helper compartilhado: dispara flash + scan line ───────────────────────────────────
  const triggerFlash = useCallback(() => {
    setIsFlashing(false);
    setShowScanLine(false);
    requestAnimationFrame(() => {
      setIsFlashing(true);
      setShowScanLine(true);
      setTimeout(() => {
        setIsFlashing(false);
        setShowScanLine(false);
      }, flashDuration);
    });
  }, [flashDuration]);

  const triggerScan = useCallback(() => {
    setShowScanLine(false);
    requestAnimationFrame(() => {
      setShowScanLine(true);
      setTimeout(() => setShowScanLine(false), 600);
    });
  }, []);

  // ── Go Live: preview → composition ──────────────────────────────────────────────────────────
  const goLive = useCallback(() => {
    if (!previewText) return;

    const idx = previewStropheIndex;

    // Aplica no contexto de letras e projeção
    if (idx !== null) goToStrophe(idx);
    project(previewText, previewTitle ?? '', previewSource ?? 'song');
    unclearScreen();

    // Adiciona ao histórico
    addToHistory(previewText, previewTitle ?? '', previewSource ?? 'song');

    // Dispara animação no composition
    setLiveAnimKey(k => k + 1);

    // Flash + scan line automático ao Go Live
    triggerFlash();

    // ── Auto-advance: coloca a próxima estrofe no Preview ──────────────────
    if (previewSource === 'song' && idx !== null) {
      const nextIdx = idx + 1;
      if (nextIdx < strophes.length) {
        sendToPreview(strophes[nextIdx], activeSong?.title ?? '', 'song', nextIdx);
      } else {
        clearPreview(); // última estrofe, limpa preview
      }
    } else {
      clearPreview(); // bible ou none: limpa preview
    }
  }, [
    previewText, previewTitle, previewSource, previewStropheIndex,
    project, unclearScreen, addToHistory, clearPreview, sendToPreview,
    strophes, activeSong, goToStrophe, triggerFlash
  ]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Enter / Space / ArrowDown / PageDown = Go Live
      if (['Enter', ' ', 'ArrowDown', 'PageDown'].includes(e.key) && previewText) {
        e.preventDefault();
        goLive();
        return;
      }

      // ArrowLeft / ArrowRight = navegar estrofes (quando não há preview)
      if (!previewText) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevStrophe(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); nextStrophe(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goLive, previewText, prevStrophe, nextStrophe]);

  // ── Primeira linha para "próximo" indicator ──────────────────────────────
  const previewFirstLine = previewText?.split('\n')[0]?.trim() ?? '';

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── PANES ROW ─────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 gap-0">

        {/* ═══════════════════════════════════════════
            PREVIEW PANE (esquerda)
            ═══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 p-3 gap-2">

          {/* Cabeçalho */}
          <div className="shrink-0 flex items-center justify-between" style={{ height: 24 }}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-4)' }}>
                Preview
              </span>
              {previewText && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold animate-slide-left" style={{
                  background: 'var(--ms-surface-3)', color: 'var(--ms-text-3)', border: '1px solid var(--ms-border-hover)'
                }}>
                  aguardando
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {previewText && (
                <>
                  <span className="text-[9px]" style={{ color: 'var(--ms-text-4)' }}>Enter · ↓</span>
                  <button
                    onClick={clearPreview}
                    className="w-5 h-5 rounded flex items-center justify-center transition-all"
                    style={{ color: 'var(--ms-text-3)', background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}
                    title="Limpar preview (Esc)"
                  >
                    <X size={10} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tela de Preview */}
          <div
            className="flex-1 min-h-0 rounded-lg overflow-hidden relative"
            style={{
              background: '#000',
              border: previewText ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--ms-border)',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Background */}
            {layers.background.visible && <BgVideosMemo channelA={channelA} channelB={channelB} isPlaying={isPlaying} crossfade={crossfade} blendMode={blendMode} transitionDuration={transitionDuration} />}

            {/* Bible reference badge (preview) */}
            {previewText && previewSource === 'bible' && previewTitle && (
              <div
                className="absolute top-8 left-0 right-0 z-40 flex justify-center animate-slide-left"
              >
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <BookOpen size={9} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {previewTitle.replace(' (Almeida)', '')}
                  </span>
                </div>
              </div>
            )}

            {/* Texto em preview */}
            {previewText && layers.text.visible && (
              <TextOverlay
                key={previewText}
                text={previewText}
                mapping={scaledMapping}
                opacity={(layers.text.opacity ?? 100) / 100}
                animKey={0}
              />
            )}

            {/* Badge */}
            <div className="absolute top-2 left-2 z-40">
              <PaneLabel label={previewText ? 'Na fila' : 'Preview'} />
            </div>

            {/* Empty state */}
            {!previewText && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                <Monitor size={20} style={{ color: 'rgba(255,255,255,0.1)' }} />
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  Clique ou duplo-clique nas estrofes
                </span>
              </div>
            )}

            {/* ── GO LIVE button ── */}
            {previewText && (
              <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center pb-3">
                <button
                  onClick={goLive}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs tracking-wider transition-all animate-fade-in-up"
                  style={{
                    background: 'rgba(255,255,255,0.96)',
                    color: '#000',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                    letterSpacing: '0.06em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.96)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <ArrowRight size={12} />
                  AO VIVO
                  <span style={{ opacity: 0.4, fontWeight: 400, fontSize: 10 }}>Enter</span>
                </button>
              </div>
            )}
          </div>

          {/* Navegação prev/next estrofes */}
          {strophes.length > 1 && (
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={prevStrophe}
                disabled={currentStropheIndex === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
                style={{
                  background: 'var(--ms-surface-2)', color: 'var(--ms-text-3)',
                  border: '1px solid var(--ms-border)',
                  opacity: currentStropheIndex === 0 ? 0.3 : 1,
                }}
              >
                <ChevronLeft size={12} /> Ant.
              </button>
              <span className="text-[10px] tabular-nums shrink-0" style={{ color: 'var(--ms-text-4)' }}>
                {currentStropheIndex + 1}/{strophes.length}
              </span>
              <button
                onClick={nextStrophe}
                disabled={currentStropheIndex === strophes.length - 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center"
                style={{
                  background: 'var(--ms-surface-2)', color: 'var(--ms-text-3)',
                  border: '1px solid var(--ms-border)',
                  opacity: currentStropheIndex === strophes.length - 1 ? 0.3 : 1,
                }}
              >
                Próx. <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Separador vertical */}
        <div className="shrink-0 self-stretch" style={{ width: 1, background: 'var(--ms-border)', margin: '12px 0' }} />

        {/* ═══════════════════════════════════════════
            COMPOSITION PANE (direita) — ao vivo
            ═══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 p-3 gap-2">

          {/* Cabeçalho */}
          <div className="shrink-0 flex items-center justify-between" style={{ height: 24 }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-4)' }}>
                Composition
              </span>
              {/* Ao Vivo badge — sem animate-fade-in para não reiniciar em re-renders */}
              <div
                style={{
                  opacity: (liveText || isPlaying) && !isBlackout ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none',
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
              >
                <div className="ms-live-dot" style={{ width: 5, height: 5 }} />
                <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-green)' }}>Ao Vivo</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5" ref={flashSettingsRef} style={{ position: 'relative' }}>
              {/* Botão Flash com settings */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={triggerFlash}
                  title="Flash"
                  className="flex items-center justify-center w-6 h-6 rounded transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--ms-border)',
                    color: 'var(--ms-text-3)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
                    (e.currentTarget as HTMLElement).style.color = 'white';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ms-text-3)';
                  }}
                >
                  <Zap size={11} />
                </button>
                {/* Seta de settings no canto do botão */}
                <button
                  onClick={() => setShowFlashSettings(v => !v)}
                  title="Configurações do Flash"
                  style={{
                    position: 'absolute',
                    right: -1,
                    bottom: -1,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--ms-surface-3)',
                    border: '1px solid var(--ms-border-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 6, color: 'var(--ms-text-3)', lineHeight: 1 }}>&#9660;</span>
                </button>

                {/* Popover de configurações */}
                {showFlashSettings && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '110%',
                      right: 0,
                      zIndex: 200,
                      background: 'var(--ms-surface-2)',
                      border: '1px solid var(--ms-border-hover)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      width: 200,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      animation: 'fadeInUp 0.15s ease both',
                    }}
                  >
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ms-text-3)', marginBottom: 10 }}>Configurações do Flash</p>

                    {/* Cor */}
                    <p style={{ fontSize: 9, color: 'var(--ms-text-4)', marginBottom: 6, fontWeight: 600 }}>COR</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {[
                        { label: 'Branco', value: '#ffffff' },
                        { label: 'Quente', value: '#fff8e7' },
                        { label: 'Amarelo', value: '#fef08a' },
                        { label: 'Vermelho', value: '#ef4444' },
                        { label: 'Azul', value: '#3b82f6' },
                        { label: 'Ciano', value: '#22d3ee' },
                      ].map(c => (
                        <button
                          key={c.value}
                          onClick={() => setFlashColor(c.value)}
                          title={c.label}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: c.value,
                            border: flashColor === c.value ? '2px solid white' : '2px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer',
                            boxShadow: flashColor === c.value ? `0 0 6px ${c.value}` : 'none',
                            transition: 'all 0.15s',
                          }}
                        />
                      ))}
                    </div>

                    {/* Duração */}
                    <p style={{ fontSize: 9, color: 'var(--ms-text-4)', marginBottom: 6, fontWeight: 600 }}>DURAÇÃO: {flashDuration}ms</p>
                    <input
                      type="range"
                      min={100}
                      max={1200}
                      step={50}
                      value={flashDuration}
                      onChange={e => setFlashDuration(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 9, color: 'var(--ms-text-4)' }}>100ms</span>
                      <span style={{ fontSize: 9, color: 'var(--ms-text-4)' }}>1.2s</span>
                    </div>

                    {/* Preview */}
                    <button
                      onClick={() => { triggerFlash(); setShowFlashSettings(false); }}
                      style={{
                        marginTop: 10,
                        width: '100%',
                        padding: '6px 0',
                        borderRadius: 6,
                        background: 'var(--ms-surface-3)',
                        border: '1px solid var(--ms-border-hover)',
                        color: 'var(--ms-text-2)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                      }}
                    >
                      &#9889; Testar Flash
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={triggerScan}
                title="Scan Line"
                className="flex items-center justify-center w-6 h-6 rounded transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--ms-border)',
                  color: 'var(--ms-text-3)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLElement).style.color = 'white';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--ms-text-3)';
                }}
              >
                <ScanLine size={11} />
              </button>
              {(liveText && !isBlackout) && (
                <button
                  onClick={() => { clearProjection(); clearScreen(); }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all"
                  style={{ color: 'var(--ms-red)', background: 'var(--ms-red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <X size={10} /> Limpar
                </button>
              )}
            </div>
          </div>

          {/* Tela de Composition */}
          <div
            className="flex-1 min-h-0 rounded-lg overflow-hidden relative"
            style={{
              background: '#000',
              border: liveText && !isBlackout
                ? '1px solid rgba(34,197,94,0.3)'
                : '1px solid var(--ms-border)',
              transition: 'border-color 0.4s',
            }}
          >
            {/* Glow border — SEMPRE no DOM, apenas opacity varia. Animação em classe CSS estática = nunca reinicia em re-renders */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none ms-live-glow-border"
              style={{
                zIndex: 58,
                opacity: (liveText && !isBlackout) ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
            {layers?.alerts?.visible && activeAlert && (
              <div 
                className="absolute bottom-0 left-0 right-0 z-50 flex transition-opacity duration-300" 
                style={{ height: '7%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', borderTop: '2px solid rgba(255,100,100,0.8)', opacity: (layers.alerts.opacity ?? 100) / 100 }}
              >
                <div className="shrink-0 flex items-center justify-center px-4 bg-red-600 font-bold uppercase text-white tracking-widest text-[10px] z-10" style={{ boxShadow: '10px 0 20px rgba(0,0,0,0.5)' }}>
                  Aviso
                </div>
                <div className="flex-1 overflow-hidden relative flex items-center">
                  <div className="animate-marquee whitespace-nowrap text-[12px] font-bold text-white uppercase tracking-wider" style={{ paddingLeft: '100%' }}>
                    {activeAlert}
                  </div>
                </div>
              </div>
            )}

            {/* ── Flash burst overlay — sempre no DOM, opacity via keyframe ── */}
            <div
              className={isFlashing ? 'ms-flash-burst' : ''}
              style={{
                position: 'absolute',
                inset: 0,
                background: flashColor,
                pointerEvents: 'none',
                zIndex: 55,
                opacity: 0,
              }}
            />

            {/* ── Scan line ── */}
            {showScanLine && (
              <div className="ms-scan-line" />
            )}

            {/* BLACKOUT */}
            {isBlackout && (
              <div
                className="absolute inset-0 bg-black z-50 flex items-center justify-center animate-fade-in cursor-pointer"
                onClick={toggleBlackout}
              >
                <div className="flex flex-col items-center gap-2">
                  <MonitorOff size={26} style={{ color: 'rgba(239,68,68,0.55)' }} />
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(239,68,68,0.55)' }}>
                    Blackout — clique para remover
                  </span>
                </div>
              </div>
            )}

            {/* Vídeo de fundo */}
            {layers.background.visible && (
              <div className="absolute inset-0 z-10 transition-opacity duration-300" style={{ opacity: (layers.background.opacity ?? 100) / 100 }}>
                <BgVideosMemo channelA={channelA} channelB={channelB} isPlaying={isPlaying} crossfade={crossfade} blendMode={blendMode} transitionDuration={transitionDuration} />
              </div>
            )}

            {/* Texto ao vivo */}
            {!isBlackout && liveText && layers.text.visible && (
              <div className="absolute inset-0 z-30">
                <TextOverlay
                  text={liveText}
                  mapping={scaledMapping}
                  opacity={(layers.text.opacity ?? 100) / 100}
                  animKey={liveAnimKey}
                />
              </div>
            )}

            {/* Bible reference badge (live) */}
            {liveText && !isBlackout && projectedText && (
              <div className="absolute top-8 left-0 right-0 z-40 flex justify-center">
                {/* only show if source is bible — check projectedText vs strophe */}
              </div>
            )}

            {/* Badge top-left */}
            <div className="absolute top-2 left-2 z-40">
              {liveText && !isBlackout
                ? <PaneLabel label="Live" color="var(--ms-green)" dot />
                : <PaneLabel label="Composition" />
              }
            </div>

            {/* ── "Próximo" indicator (o que está em preview) ── */}
            {previewText && liveText && !isBlackout && (
              <div
                className="absolute bottom-0 left-0 right-0 z-40 flex items-center gap-2 px-3 py-2 animate-fade-in"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  paddingTop: 24,
                }}
              >
                <ArrowRight size={10} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                <span
                  className="text-[10px] truncate"
                  style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}
                >
                  Próximo: {previewFirstLine}
                </span>
              </div>
            )}

            {/* Dots de estrofes */}
            {strophes.length > 1 && !isBlackout && (
              <div className="absolute bottom-7 left-0 right-0 z-30 flex items-center justify-center gap-1.5">
                {strophes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStrophe(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === currentStropheIndex ? 12 : 4,
                      height: 4,
                      background: i === currentStropheIndex ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)',
                      transition: 'all 0.25s cubic-bezier(0.34,1.2,0.64,1)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!liveText && !isPlaying && !isBlackout && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2 opacity-15">
                  <Monitor size={22} style={{ color: 'white' }} />
                  <span className="text-[10px] text-white">Idle</span>
                </div>
              </div>
            )}
          </div>

          {/* Info bar — blackout ou status */}
          <div className="shrink-0 flex items-center gap-2" style={{ height: 24 }}>
            {isBlackout ? (
              <button
                onClick={toggleBlackout}
                className="text-[10px] font-semibold px-2 py-1 rounded-md transition-all animate-fade-in"
                style={{ background: 'var(--ms-red-dim)', color: 'var(--ms-red)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                BLACKOUT ATIVO — clique para remover
              </button>
            ) : (
              <span className="text-[10px]" style={{ color: 'var(--ms-text-4)' }}>
                {liveText
                  ? <span style={{ color: 'var(--ms-text-3)' }}>Projetando texto</span>
                  : isPlaying
                  ? <span style={{ color: 'var(--ms-text-3)' }}>Vídeo ao vivo</span>
                  : 'Idle'
                }
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          HISTORY BAR (abaixo dos panes)
          ═══════════════════════════════════════════ */}
      {history.length > 0 && (
        <div
          className="shrink-0 flex items-center gap-2 px-3 pb-2"
          style={{ borderTop: '1px solid var(--ms-border)', paddingTop: 8 }}
        >
          <div className="flex items-center gap-1 shrink-0">
            <Clock size={10} style={{ color: 'var(--ms-text-4)' }} />
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-4)' }}>
              Histórico
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {history.map((item, i) => (
              <HistoryChip
                key={item.timestamp}
                text={item.text}
                title={item.title}
                source={item.source}
                onClick={() => sendToPreview(item.text, item.title, item.source, null)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
