import React, { useState } from 'react';
import { useProjection } from '../context/ProjectionContext';
import {
  AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, Minus,
  Type, Sliders, Layout
} from 'lucide-react';

type MapTab = 'text' | 'position' | 'style';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Oswald', 'Nunito', 'Source Sans 3', 'Ubuntu',
  'Playfair Display', 'Merriweather', 'PT Serif', 'Josefin Sans',
  'Bebas Neue', 'Anton', 'Barlow', 'Mulish', 'DM Sans'
];

const FONT_WEIGHTS = [
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
];

export const MappingPanel: React.FC = () => {
  const { mapping, updateMapping } = useProjection();
  const [tab, setTab] = useState<MapTab>('text');

  const previewText = 'Santo, Santo\nSanto é o Senhor';
  
  const textStyle: React.CSSProperties = {
    fontSize: `${Math.min(mapping.fontSize * 0.55, 32)}px`,
    textAlign: mapping.textAlign,
    fontFamily: `'${mapping.fontFamily}', sans-serif`,
    fontWeight: mapping.fontWeight,
    color: mapping.textColor,
    lineHeight: mapping.lineHeight,
    letterSpacing: `${mapping.letterSpacing}px`,
    textTransform: mapping.textCase === 'none' ? 'none' : mapping.textCase,
    textShadow:
      mapping.textShadow === 'strong' ? '0 4px 16px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' :
      mapping.textShadow === 'light'  ? '0 2px 8px rgba(0,0,0,0.6)' :
      'none',
    WebkitTextStroke: mapping.textStroke ? '1px rgba(0,0,0,0.5)' : 'none',
    whiteSpace: 'pre-line',
    maxWidth: '100%',
    padding: `${mapping.paddingY * 0.4}px ${mapping.paddingX * 0.4}px`,
    margin: mapping.textAlign === 'center' ? '0 auto' : mapping.textAlign === 'right' ? '0 0 0 auto' : '0',
  };

  const tabs = [
    { id: 'text' as MapTab, icon: <Type size={14} />, label: 'Fonte' },
    { id: 'position' as MapTab, icon: <Layout size={14} />, label: 'Posição' },
    { id: 'style' as MapTab, icon: <Sliders size={14} />, label: 'Estilo' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <p className="ms-section-title mb-3">Mapeamento de Texto</p>

      {/* ── PREVIEW AO VIVO ── */}
      <div
        className="shrink-0 rounded-xl mb-4 overflow-hidden relative"
        style={{
          aspectRatio: '16/9',
          background: '#0a0a0a',
          border: '1px solid var(--ms-border)',
        }}
      >
        {/* Grade de referência */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20% 33.3%'
        }} />

        <div
          className="absolute inset-0 flex flex-col"
          style={{
            justifyContent: mapping.verticalAlign === 'top' ? 'flex-start' : mapping.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            padding: `${mapping.paddingY * 0.4}px ${mapping.paddingX * 0.4}px`,
          }}
        >
          <div style={textStyle}>{previewText}</div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center gap-2"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: 'var(--ms-green)' }} />
          <span className="text-[9px] font-semibold" style={{ color: 'var(--ms-green)' }}>PREVIEW AO VIVO</span>
        </div>
      </div>

      {/* ── SUB-ABAS ── */}
      <div
        className="flex shrink-0 gap-1 p-1 rounded-xl mb-4"
        style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: tab === t.id ? 'rgba(124,58,237,0.25)' : 'transparent',
              color: tab === t.id ? 'var(--ms-accent)' : 'var(--ms-text-3)',
              border: tab === t.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTEÚDO DAS ABAS ── */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {/* ──── ABA FONTE ──── */}
        {tab === 'text' && (
          <>
            {/* Família de Fonte */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: 'var(--ms-text-3)' }}>FAMÍLIA</label>
              <select
                value={mapping.fontFamily}
                onChange={(e) => updateMapping({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium outline-none"
                style={{
                  background: 'var(--ms-surface-1)',
                  color: 'var(--ms-text-1)',
                  border: '1px solid var(--ms-border)',
                  fontFamily: `'${mapping.fontFamily}', sans-serif`,
                }}
              >
                {GOOGLE_FONTS.map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </div>

            {/* Tamanho */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--ms-text-3)' }}>TAMANHO</label>
                <span className="text-xs font-bold" style={{ color: 'var(--ms-accent)' }}>{mapping.fontSize}px</span>
              </div>
              <input
                type="range" min="20" max="140" step="2"
                value={mapping.fontSize}
                onChange={(e) => updateMapping({ fontSize: Number(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--ms-text-3)' }}>A</span>
                <span className="text-lg font-bold" style={{ color: 'var(--ms-text-3)' }}>A</span>
              </div>
            </div>

            {/* Peso */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: 'var(--ms-text-3)' }}>PESO (ESPESSURA)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FONT_WEIGHTS.map(fw => (
                  <button
                    key={fw.value}
                    onClick={() => updateMapping({ fontWeight: fw.value as MappingConfig['fontWeight'] })}
                    className="py-2 rounded-lg text-[11px] transition-all"
                    style={{
                      fontWeight: fw.value,
                      background: mapping.fontWeight === fw.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      color: mapping.fontWeight === fw.value ? 'var(--ms-accent)' : 'var(--ms-text-3)',
                      border: `1px solid ${mapping.fontWeight === fw.value ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                    }}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caixa Alta */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: 'var(--ms-text-3)' }}>CAPITALIZAÇÃO</label>
              <div className="flex gap-2">
                {(['none', 'uppercase', 'lowercase'] as const).map(tc => (
                  <button
                    key={tc}
                    onClick={() => updateMapping({ textCase: tc })}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all"
                    style={{
                      background: mapping.textCase === tc ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      color: mapping.textCase === tc ? 'var(--ms-accent)' : 'var(--ms-text-3)',
                      border: `1px solid ${mapping.textCase === tc ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                    }}
                  >
                    {tc === 'none' ? 'Aa' : tc === 'uppercase' ? 'AA' : 'aa'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ──── ABA POSIÇÃO ──── */}
        {tab === 'position' && (
          <>
            {/* Alinhamento Horizontal */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-3 block" style={{ color: 'var(--ms-text-3)' }}>ALINHAMENTO HORIZONTAL</label>
              <div className="flex gap-2">
                {[
                  { val: 'left', icon: <AlignLeft size={18} /> },
                  { val: 'center', icon: <AlignCenter size={18} /> },
                  { val: 'right', icon: <AlignRight size={18} /> },
                ].map(({ val, icon }) => (
                  <button
                    key={val}
                    onClick={() => updateMapping({ textAlign: val as MappingConfig['textAlign'] })}
                    className="flex-1 flex items-center justify-center py-3 rounded-xl transition-all"
                    style={{
                      background: mapping.textAlign === val ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      color: mapping.textAlign === val ? 'var(--ms-accent)' : 'var(--ms-text-3)',
                      border: `1px solid ${mapping.textAlign === val ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Posição Vertical */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-3 block" style={{ color: 'var(--ms-text-3)' }}>POSIÇÃO VERTICAL</label>
              <div className="flex gap-2">
                {[
                  { val: 'top', icon: <ArrowUp size={16} />, label: 'Topo' },
                  { val: 'center', icon: <Minus size={16} />, label: 'Centro' },
                  { val: 'bottom', icon: <ArrowDown size={16} />, label: 'Rodapé' },
                ].map(({ val, icon, label }) => (
                  <button
                    key={val}
                    onClick={() => updateMapping({ verticalAlign: val as MappingConfig['verticalAlign'] })}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-bold transition-all"
                    style={{
                      background: mapping.verticalAlign === val ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      color: mapping.verticalAlign === val ? 'var(--ms-accent)' : 'var(--ms-text-3)',
                      border: `1px solid ${mapping.verticalAlign === val ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Margens / Padding */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-3 block" style={{ color: 'var(--ms-text-3)' }}>MARGENS</label>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: 'var(--ms-text-2)' }}>Lateral (X)</span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--ms-accent)' }}>{mapping.paddingX}%</span>
                  </div>
                  <input
                    type="range" min="0" max="30" step="1"
                    value={mapping.paddingX}
                    onChange={(e) => updateMapping({ paddingX: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: 'var(--ms-text-2)' }}>Vertical (Y)</span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--ms-accent)' }}>{mapping.paddingY}%</span>
                  </div>
                  <input
                    type="range" min="0" max="30" step="1"
                    value={mapping.paddingY}
                    onChange={(e) => updateMapping({ paddingY: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ──── ABA ESTILO ──── */}
        {tab === 'style' && (
          <>
            {/* Cor do Texto */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: 'var(--ms-text-3)' }}>COR DO TEXTO</label>
              
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={mapping.textColor}
                  onChange={(e) => updateMapping({ textColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                  style={{ padding: 2, background: 'var(--ms-surface-1)', border: '1px solid var(--ms-border)' }}
                />
                <span className="text-sm font-mono font-bold" style={{ color: 'var(--ms-text-2)' }}>
                  {mapping.textColor.toUpperCase()}
                </span>
              </div>

              {/* Cores rápidas */}
              <div className="flex gap-2 flex-wrap">
                {['#ffffff', '#fef9c3', '#fde68a', '#fed7aa', '#ddd6fe', '#a5f3fc', '#bbf7d0'].map(c => (
                  <button
                    key={c}
                    onClick={() => updateMapping({ textColor: c })}
                    className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                    style={{
                      background: c,
                      borderColor: mapping.textColor === c ? 'var(--ms-accent)' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sombra */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-2 block" style={{ color: 'var(--ms-text-3)' }}>SOMBRA DO TEXTO</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { val: 'strong', label: 'Forte', sub: 'Melhor sobre fundos claros' },
                  { val: 'light',  label: 'Leve',  sub: 'Visual mais elegante' },
                  { val: 'none',   label: 'Sem sombra', sub: 'Use com fundos escuros' },
                ].map(({ val, label, sub }) => (
                  <button
                    key={val}
                    onClick={() => updateMapping({ textShadow: val as MappingConfig['textShadow'] })}
                    className="text-left px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: mapping.textShadow === val ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${mapping.textShadow === val ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                      color: mapping.textShadow === val ? 'white' : 'var(--ms-text-3)',
                    }}
                  >
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-[10px] opacity-70">{sub}</p>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-xs" style={{ color: 'var(--ms-text-2)' }}>Contorno (stroke)</span>
                <button
                  onClick={() => updateMapping({ textStroke: !mapping.textStroke })}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: mapping.textStroke ? 'var(--ms-accent)' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: mapping.textStroke ? 22 : 2 }}
                  />
                </button>
              </div>
            </div>

            {/* Espaçamento */}
            <div className="p-3.5 rounded-xl" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
              <label className="text-[10px] font-bold tracking-wider mb-3 block" style={{ color: 'var(--ms-text-3)' }}>ESPAÇAMENTO</label>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: 'var(--ms-text-2)' }}>Entre linhas</span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--ms-accent)' }}>{mapping.lineHeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range" min="0.8" max="2.5" step="0.05"
                    value={mapping.lineHeight}
                    onChange={(e) => updateMapping({ lineHeight: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: 'var(--ms-text-2)' }}>Entre letras</span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--ms-accent)' }}>{mapping.letterSpacing}px</span>
                  </div>
                  <input
                    type="range" min="-2" max="10" step="0.5"
                    value={mapping.letterSpacing}
                    onChange={(e) => updateMapping({ letterSpacing: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Needed for the import in fontWeight button
type MappingConfig = ReturnType<typeof useProjection>['mapping'];
