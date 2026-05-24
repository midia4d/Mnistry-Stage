import React, { useEffect, useState } from 'react';
import { useSyncReceiver } from '../hooks/useSyncState';

export const StageDisplay: React.FC = () => {
  const { projectedText, previewText, isBlackout, isCleared } = useSyncReceiver({
    channelA: null, channelB: null, activeChannel: 'A', blendMode: 'normal', crossfade: 0, isPlaying: false,
    projectedText: null, projectedTitle: null, previewText: null, previewTitle: null, activeAlert: null,
    isBlackout: false, isCleared: false,
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

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const liveText = isCleared ? null : projectedText;

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white flex flex-col relative font-sans p-8">
      
      {/* ── HEADER: CLOCK & STATUS ── */}
      <div className="flex justify-between items-start shrink-0 border-b border-white/20 pb-4 mb-8">
        <div className="flex flex-col">
          <span className="text-8xl font-bold tracking-tighter" style={{ color: '#ffcc00' }}>
            {timeString}
          </span>
          <span className="text-2xl text-gray-500 font-medium uppercase tracking-widest mt-2">
            Stage Display
          </span>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          {isBlackout && (
            <div className="px-6 py-2 bg-red-600 rounded-lg text-white font-bold text-3xl uppercase animate-pulse">
              BLACKOUT
            </div>
          )}
          {!isBlackout && !liveText && (
            <div className="px-6 py-2 border-2 border-gray-600 rounded-lg text-gray-500 font-bold text-3xl uppercase">
              IDLE
            </div>
          )}
          {!isBlackout && liveText && (
            <div className="px-6 py-2 bg-green-600 rounded-lg text-white font-bold text-3xl uppercase">
              AO VIVO
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT: LIVE TEXT ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-center">
        <h2 className="text-gray-500 text-3xl font-bold uppercase tracking-widest mb-4">Atual</h2>
        <div 
          className="flex-1 bg-white/5 rounded-2xl p-8 flex items-center justify-center text-center"
          style={{ border: '2px solid rgba(255,255,255,0.1)' }}
        >
          {liveText && !isBlackout ? (
            <p className="text-7xl font-bold whitespace-pre-line leading-tight text-white drop-shadow-2xl">
              {liveText}
            </p>
          ) : (
            <p className="text-5xl text-gray-600 italic">Sem texto atual</p>
          )}
        </div>
      </div>

      {/* ── FOOTER: PREVIEW TEXT ── */}
      <div className="mt-8 shrink-0 h-1/3 flex flex-col">
        <h2 className="text-gray-500 text-3xl font-bold uppercase tracking-widest mb-4">Próximo</h2>
        <div className="flex-1 bg-white/10 rounded-2xl p-8 flex items-center justify-center text-center">
          {previewText ? (
            <p className="text-5xl font-semibold whitespace-pre-line leading-snug" style={{ color: '#aaa' }}>
              {previewText}
            </p>
          ) : (
            <p className="text-4xl text-gray-600 italic">Nenhum texto na fila</p>
          )}
        </div>
      </div>
      
    </div>
  );
};
