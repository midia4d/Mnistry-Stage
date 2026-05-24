import React, { useEffect, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useSyncReceiver } from '../hooks/useSyncState';
import { computeCornerPinTransform, CornerMap, isDefaultCorners, DEFAULT_CORNERS } from '../utils/computeHomography';

export const PublicProjection: React.FC = () => {
  const { 
    channelA, channelB, activeChannel, blendMode, crossfade, isPlaying, 
    projectedText, projectedTitle, isBlackout, mapping, layers, activeAlert 
  } = useSyncReceiver({
    channelA: null, channelB: null, activeChannel: 'A', blendMode: 'normal', crossfade: 0, isPlaying: false,
    projectedText: null, projectedTitle: null, previewText: null, previewTitle: null, activeAlert: null, isBlackout: false, isCleared: false,
    mapping: {
      fontSize: 48, verticalAlign: 'center', textAlign: 'center', textShadow: 'strong',
      textColor: '#ffffff', textStroke: false, fontFamily: 'Inter', fontWeight: 700,
      lineHeight: 1.25, letterSpacing: 0, paddingX: 8, paddingY: 8, textCase: 'none'
    },
    layers: {
      background: { visible: true, opacity: 100 },
      media: { visible: true, opacity: 100 },
      text: { visible: true, opacity: 100 },
      alerts: { visible: true, opacity: 100 }
    }
  });

  // Texto já vem filtrado pelo Mestre (isCleared)
  const displayText = projectedText;

  // Recebe o mapeamento de cantos via BroadcastChannel
  const [corners, setCorners] = useState<CornerMap>(DEFAULT_CORNERS);
  const [showTestPattern, setShowTestPattern] = useState(false);
  const [testPattern, setTestPattern] = useState('grid');

  // Escuta eventos de mapping via BroadcastChannel dedicado
  useEffect(() => {
    const ch = new BroadcastChannel('ministrystage-videomapping');
    ch.onmessage = (e) => {
      if (e.data.corners) setCorners(e.data.corners);
      if (typeof e.data.showTestPattern === 'boolean') setShowTestPattern(e.data.showTestPattern);
      if (e.data.testPattern) setTestPattern(e.data.testPattern);
    };
    return () => ch.close();
  }, []);

  const hasTransform = !isDefaultCorners(corners);
  const cssTransform = hasTransform
    ? computeCornerPinTransform(window.innerWidth, window.innerHeight, corners)
    : undefined;

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      {/* ── WRAPPER DE MAPPING (corner-pin transform) ── */}
      <div
        className="absolute inset-0"
        style={{ transformOrigin: 'top left', transform: cssTransform }}
      >
      {/* ── BLACKOUT OVERLAY ── */}
      {isBlackout && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center">
          {/* Opcional: mostrar ícone sutil, ou apenas tela preta puro. Num projetor real, tela preta pura é melhor. */}
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
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: isPlaying ? (1 - crossfade / 100) : 0 }}
            />
          )}
          
          {channelB && (
            <video
              src={convertFileSrc(channelB)}
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              style={{ 
                opacity: isPlaying ? (crossfade / 100) : 0,
                mixBlendMode: blendMode as React.CSSProperties['mixBlendMode']
              }}
            />
          )}
        </div>
      )}

      {/* ── CAMADA 2: OVERLAYS (Z-20) ── */}
      {/* Reservado para Logos, PIP, etc */}
      <div className="absolute inset-0 z-20 pointer-events-none" />

      {/* ── CAMADA 3: TEXTOS (Z-30) ── */}
      {!isBlackout && displayText && layers?.text?.visible && (
        <div 
          className="absolute inset-0 z-30 flex flex-col pointer-events-none transition-opacity duration-300"
          style={{ 
            opacity: (layers.text.opacity ?? 100) / 100,
            justifyContent: mapping.verticalAlign === 'top' ? 'flex-start' : mapping.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            padding: `${(mapping.paddingY ?? 8)}vh ${(mapping.paddingX ?? 8)}vw`,
          }}
        >
          <div 
            className="animate-lyric-in whitespace-pre-line"
            style={{
              fontSize: `${(mapping.fontSize ?? 48) * 1.4}px`,
              fontWeight: mapping.fontWeight ?? 700,
              fontFamily: `'${mapping.fontFamily ?? 'Inter'}', sans-serif`,
              color: mapping.textColor ?? 'white',
              lineHeight: mapping.lineHeight ?? 1.25,
              letterSpacing: `${mapping.letterSpacing ?? 0}px`,
              textAlign: mapping.textAlign,
              textTransform: (mapping.textCase ?? 'none') === 'none' ? 'none' : (mapping.textCase as 'uppercase' | 'lowercase'),
              WebkitTextStroke: mapping.textStroke ? '2px rgba(0,0,0,0.5)' : 'none',
              textShadow:
                mapping.textShadow === 'strong' ? '0 8px 40px rgba(0,0,0,0.95), 0 4px 16px rgba(0,0,0,0.9)' :
                mapping.textShadow === 'light'  ? '0 4px 16px rgba(0,0,0,0.7)' :
                'none',
              maxWidth: '100%',
              margin: mapping.textAlign === 'center' ? '0 auto' : mapping.textAlign === 'right' ? '0 0 0 auto' : '0',
            }}
          >
            {displayText}
          </div>
        </div>
      )}

      {/* ── CAMADA 4: ALERTAS (Z-50) ── */}
      {activeAlert && layers?.alerts?.visible && (
        <div 
          className="absolute bottom-0 left-0 right-0 z-50 flex transition-opacity duration-300" 
          style={{ height: '7vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', borderTop: '2px solid rgba(255,100,100,0.8)', opacity: (layers.alerts.opacity ?? 100) / 100 }}
        >
          <div className="shrink-0 flex items-center justify-center px-6 bg-red-600 font-bold uppercase text-white tracking-widest text-xl z-10" style={{ boxShadow: '10px 0 20px rgba(0,0,0,0.5)' }}>
            Aviso
          </div>
          <div className="flex-1 overflow-hidden relative flex items-center">
            <div className="animate-marquee whitespace-nowrap text-3xl font-bold text-white uppercase tracking-wider" style={{ paddingLeft: '100%' }}>
              {activeAlert}
            </div>
          </div>
        </div>
      )}

      {/* ── CAMADA 5: PADRÃO DE TESTE (Z-60) ── */}
      {showTestPattern && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          {testPattern === 'white' && <div className="absolute inset-0 bg-white" />}
          {testPattern === 'black' && <div className="absolute inset-0 bg-black" />}
          {testPattern === 'grid' && (
            <div className="absolute inset-0" style={{
              background: '#111',
              backgroundImage: `linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
              backgroundSize: '10% 10%, 10% 10%, 2% 2%, 2% 2%',
            }}>
              {/* Crosshair central */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-px bg-red-500" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-32 bg-red-500" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-red-500" />
                </div>
              </div>
              {/* Marcadores de canto */}
              <div className="absolute top-4 left-4 w-24 h-24 border-l-2 border-t-2 border-white/70" />
              <div className="absolute top-4 right-4 w-24 h-24 border-r-2 border-t-2 border-white/70" />
              <div className="absolute bottom-4 left-4 w-24 h-24 border-l-2 border-b-2 border-white/70" />
              <div className="absolute bottom-4 right-4 w-24 h-24 border-r-2 border-b-2 border-white/70" />
              {/* Label */}
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-white/40 text-base font-light tracking-[0.3em]">MinistryStage — VIDEO MAPPING</p>
              </div>
            </div>
          )}
          {testPattern === 'color_bars' && (
            <div className="absolute inset-0 flex">
              {['#fff','#ff0','#0ff','#0f0','#f0f','#f00','#00f','#000'].map((c, i) => (
                <div key={i} className="flex-1 h-full" style={{ background: c }} />
              ))}
            </div>
          )}
        </div>
      )}

      </div>{/* fim wrapper mapping */}
    </div>
  );
};
