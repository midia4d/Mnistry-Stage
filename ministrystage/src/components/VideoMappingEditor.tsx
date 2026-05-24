import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useOutputMapping } from '../context/OutputMappingContext';
import { CornerMap, DEFAULT_CORNERS, isDefaultCorners } from '../utils/computeHomography';
import { RotateCcw, FlipHorizontal, FlipVertical, Grid3X3, Save, Trash2, Check } from 'lucide-react';

// Componente de padrão de teste projetado no preview
const TestPatternOverlay: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'white') return <div className="absolute inset-0 bg-white" />;
  if (type === 'black') return <div className="absolute inset-0 bg-black" />;
  if (type === 'grid') return (
    <div className="absolute inset-0" style={{
      background: '#111',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px),
        linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
      `,
      backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
    }}>
      {/* Crosshair central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-px h-16 bg-red-500 mx-auto" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-16 h-px bg-red-500" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-red-500" />
        </div>
      </div>
      {/* Cantos com marcação */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
        <div key={corner} className={`absolute w-16 h-16 border-2 border-white/60 ${
          corner === 'top-left' ? 'top-2 left-2 border-r-0 border-b-0' :
          corner === 'top-right' ? 'top-2 right-2 border-l-0 border-b-0' :
          corner === 'bottom-left' ? 'bottom-2 left-2 border-r-0 border-t-0' :
          'bottom-2 right-2 border-l-0 border-t-0'
        }`} />
      ))}
      {/* Texto de referência */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-white font-bold text-sm opacity-60">MinistryStage</p>
        <p className="text-white/40 text-xs">Video Mapping — Grade de Teste</p>
      </div>
    </div>
  );
  if (type === 'color_bars') return (
    <div className="absolute inset-0 flex">
      {['#fff', '#ff0', '#0ff', '#0f0', '#f0f', '#f00', '#00f', '#000'].map((c, i) => (
        <div key={i} className="flex-1 h-full" style={{ background: c }} />
      ))}
    </div>
  );
  return null;
};

// Handle arrastável de canto
const CornerHandle: React.FC<{
  label: string;
  x: number; // posição em px no canvas preview
  y: number;
  onDrag: (dx: number, dy: number) => void;
  isDragging: boolean;
  setDragging: (v: boolean) => void;
}> = ({ label, x, y, onDrag, isDragging, setDragging }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (me: MouseEvent) => {
      onDrag(me.clientX - startX, me.clientY - startY);
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onDrag, setDragging]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{
        left: x - 14,
        top: y - 14,
        width: 28,
        height: 28,
        zIndex: 20,
        transition: isDragging ? 'none' : 'none',
      }}
    >
      <div
        className="w-5 h-5 rounded-full border-2 shadow-lg transition-colors"
        style={{
          background: isDragging ? 'var(--ms-accent)' : 'white',
          borderColor: isDragging ? 'white' : 'var(--ms-accent)',
          boxShadow: isDragging ? '0 0 0 3px rgba(124,58,237,0.4)' : '0 2px 8px rgba(0,0,0,0.6)',
        }}
      />
      <span
        className="absolute -bottom-5 text-[9px] font-bold tracking-wider select-none"
        style={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}
      >
        {label}
      </span>
    </div>
  );
};

export const VideoMappingEditor: React.FC = () => {
  const {
    corners, isActive, showTestPattern, testPattern,
    setCorner, resetCorners, flipH, flipV,
    toggleTestPattern, setTestPattern,
    savePreset, loadPreset, deletePreset, presets,
  } = useOutputMapping();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);
  const [draggingCorner, setDraggingCorner] = useState<keyof CornerMap | null>(null);
  const [presetName, setPresetName] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Mede o canvas assim que ele montar
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasW(entry.contentRect.width);
      setCanvasH(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Converte coordenadas normalizadas para px no canvas
  const toCanvasPos = useCallback((nx: number, ny: number) => ({
    x: nx * canvasW,
    y: ny * canvasH,
  }), [canvasW, canvasH]);

  // Cria handler de drag para um canto
  const makeDragHandler = useCallback((corner: keyof CornerMap, baseCorner: [number, number]) => {
    // Usa closure para capturar posição base no início do drag
    return (dx: number, dy: number) => {
      if (canvasW === 0 || canvasH === 0) return;
      const nx = Math.max(0, Math.min(1, baseCorner[0] + dx / canvasW));
      const ny = Math.max(0, Math.min(1, baseCorner[1] + dy / canvasH));
      setCorner(corner, [nx, ny]);
    };
  }, [canvasW, canvasH, setCorner]);

  // Posições px de cada canto no canvas
  const positions = {
    tl: toCanvasPos(corners.tl[0], corners.tl[1]),
    tr: toCanvasPos(corners.tr[0], corners.tr[1]),
    br: toCanvasPos(corners.br[0], corners.br[1]),
    bl: toCanvasPos(corners.bl[0], corners.bl[1]),
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim());
    setPresetName('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const testPatterns = [
    { id: 'grid', label: 'Grade' },
    { id: 'white', label: 'Branco' },
    { id: 'black', label: 'Preto' },
    { id: 'color_bars', label: 'Barras' },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <p className="ms-section-title" style={{ marginBottom: 0 }}>Video Mapping</p>
        {isActive && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-bold animate-blink"
            style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--ms-accent)', border: '1px solid rgba(124,58,237,0.4)' }}
          >
            ATIVO
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">

        {/* ── CANVAS DE EDIÇÃO ── */}
        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden"
          style={{ aspectRatio: '16/9', background: '#0a0a0a', border: '1px solid var(--ms-border)' }}
        >
          {/* Padrão de teste sobreposto */}
          {showTestPattern && <TestPatternOverlay type={testPattern} />}

          {/* Polígono que mostra a área mapeada */}
          {canvasW > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${canvasW} ${canvasH}`}
              preserveAspectRatio="none"
            >
              {/* Área mapeada */}
              <polygon
                points={`${positions.tl.x},${positions.tl.y} ${positions.tr.x},${positions.tr.y} ${positions.br.x},${positions.br.y} ${positions.bl.x},${positions.bl.y}`}
                fill="rgba(124,58,237,0.08)"
                stroke="rgba(124,58,237,0.6)"
                strokeWidth="1.5"
                strokeDasharray={isActive ? '6,3' : '0'}
              />
              {/* Diagonais de referência */}
              <line
                x1={positions.tl.x} y1={positions.tl.y}
                x2={positions.br.x} y2={positions.br.y}
                stroke="rgba(255,255,255,0.08)" strokeWidth="1"
              />
              <line
                x1={positions.tr.x} y1={positions.tr.y}
                x2={positions.bl.x} y2={positions.bl.y}
                stroke="rgba(255,255,255,0.08)" strokeWidth="1"
              />
            </svg>
          )}

          {/* Handles dos cantos */}
          {canvasW > 0 && (
            <>
              <CornerHandle
                label="TL"
                x={positions.tl.x} y={positions.tl.y}
                isDragging={draggingCorner === 'tl'}
                setDragging={v => setDraggingCorner(v ? 'tl' : null)}
                onDrag={makeDragHandler('tl', corners.tl)}
              />
              <CornerHandle
                label="TR"
                x={positions.tr.x} y={positions.tr.y}
                isDragging={draggingCorner === 'tr'}
                setDragging={v => setDraggingCorner(v ? 'tr' : null)}
                onDrag={makeDragHandler('tr', corners.tr)}
              />
              <CornerHandle
                label="BR"
                x={positions.br.x} y={positions.br.y}
                isDragging={draggingCorner === 'br'}
                setDragging={v => setDraggingCorner(v ? 'br' : null)}
                onDrag={makeDragHandler('br', corners.br)}
              />
              <CornerHandle
                label="BL"
                x={positions.bl.x} y={positions.bl.y}
                isDragging={draggingCorner === 'bl'}
                setDragging={v => setDraggingCorner(v ? 'bl' : null)}
                onDrag={makeDragHandler('bl', corners.bl)}
              />
            </>
          )}

          {/* Label central quando sem padrão de teste */}
          {!showTestPattern && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Arraste os cantos para mapear
              </p>
            </div>
          )}
        </div>

        {/* ── CONTROLES RÁPIDOS ── */}
        <div className="rounded-xl p-3" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={resetCorners}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all hover:bg-red-500/10"
              style={{ background: 'rgba(239,68,68,0.06)', color: 'var(--ms-red)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              onClick={flipH}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border)' }}
            >
              <FlipHorizontal size={16} />
              Espelho H
            </button>
            <button
              onClick={flipV}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border)' }}
            >
              <FlipVertical size={16} />
              Espelho V
            </button>
          </div>

          {/* Toggle Padrão de Teste */}
          <button
            onClick={toggleTestPattern}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: showTestPattern ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${showTestPattern ? 'rgba(124,58,237,0.4)' : 'var(--ms-border)'}`,
              color: showTestPattern ? 'var(--ms-accent)' : 'var(--ms-text-2)',
            }}
          >
            <div className="flex items-center gap-2">
              <Grid3X3 size={14} />
              <span className="text-xs font-bold">Padrão de Teste</span>
            </div>
            <div
              className="w-8 h-4 rounded-full relative"
              style={{ background: showTestPattern ? 'var(--ms-accent)' : 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
                style={{ left: showTestPattern ? 18 : 2 }}
              />
            </div>
          </button>

          {showTestPattern && (
            <div className="flex gap-1.5 mt-2">
              {testPatterns.map(tp => (
                <button
                  key={tp.id}
                  onClick={() => setTestPattern(tp.id)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: testPattern === tp.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                    color: testPattern === tp.id ? 'var(--ms-accent)' : 'var(--ms-text-3)',
                    border: `1px solid ${testPattern === tp.id ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                  }}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── COORDENADAS ── */}
        <div className="rounded-xl p-3" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
          <p className="text-[10px] font-bold tracking-wider mb-2" style={{ color: 'var(--ms-text-3)' }}>COORDENADAS (normalizado 0–1)</p>
          <div className="grid grid-cols-2 gap-2">
            {(['tl', 'tr', 'bl', 'br'] as (keyof CornerMap)[]).map(key => (
              <div
                key={key}
                className="px-2 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ms-border)' }}
              >
                <p className="text-[9px] font-bold mb-0.5" style={{ color: 'var(--ms-text-3)' }}>
                  {key === 'tl' ? 'Topo Esq.' : key === 'tr' ? 'Topo Dir.' : key === 'bl' ? 'Base Esq.' : 'Base Dir.'}
                </p>
                <p className="text-[10px] font-mono" style={{ color: 'var(--ms-accent)' }}>
                  {corners[key][0].toFixed(3)}, {corners[key][1].toFixed(3)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRESETS ── */}
        <div className="rounded-xl p-3" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
          <p className="text-[10px] font-bold tracking-wider mb-2" style={{ color: 'var(--ms-text-3)' }}>PRESETS</p>

          {/* Salvar */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="Nome do preset..."
              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: 'var(--ms-surface-1)', color: 'var(--ms-text-1)', border: '1px solid var(--ms-border)' }}
              onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
            />
            <button
              onClick={handleSavePreset}
              className="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
              style={{
                background: savedFeedback ? 'rgba(34,197,94,0.2)' : 'var(--ms-grad-accent)',
                color: savedFeedback ? 'var(--ms-green)' : 'white',
                minWidth: 42,
              }}
            >
              {savedFeedback ? <Check size={14} /> : <Save size={14} />}
            </button>
          </div>

          {/* Lista */}
          {presets.length === 0 ? (
            <p className="text-[10px] text-center py-2" style={{ color: 'var(--ms-text-3)' }}>Nenhum preset salvo</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ms-border)' }}
                >
                  <button
                    onClick={() => loadPreset(preset.id)}
                    className="text-xs font-medium text-left flex-1 truncate"
                    style={{ color: 'var(--ms-text-1)' }}
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors ml-2"
                    style={{ color: 'var(--ms-text-3)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
