import React, { useState, useEffect } from 'react';
import { Monitor, X, Play } from 'lucide-react';
import { availableMonitors, Monitor as TauriMonitor } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

interface OutputManagerProps {
  onClose: () => void;
}

export const OutputManager: React.FC<OutputManagerProps> = ({ onClose }) => {
  const [monitors, setMonitors] = useState<TauriMonitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonitors = async () => {
      try {
        const m = await availableMonitors();
        setMonitors(m);
      } catch (err) {
        console.error('Erro ao buscar monitores:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMonitors();
  }, []);

  const openWindow = async (monitor: TauriMonitor, type: 'projection' | 'stagedisplay') => {
    try {
      console.log('Criando janela no monitor:', monitor.name);
      const url = window.location.pathname + (type === 'projection' ? '#/projection' : '#/stagedisplay');
      const isStageDisplay = url.includes('#/stagedisplay');
      const win = new WebviewWindow(`proj-${Date.now()}`, {
        url,
        x: monitor.position.x,
        y: monitor.position.y,
        width: monitor.size.width,
        height: monitor.size.height,
        fullscreen: true,
        alwaysOnTop: !isStageDisplay, // Stage display might not need always on top, but it's usually fullscreen
        decorations: false,
        title: isStageDisplay ? 'MinistryStage Stage Display' : 'MinistryStage Projection'
      });

      win.once('tauri://error', function (e: unknown) {
        console.error('Erro ao abrir janela de projeção:', e);
        alert('Erro ao abrir janela: ' + JSON.stringify(e));
      });
      
      onClose();
    } catch (e) {
      console.error(e);
      alert('Exceção ao criar WebviewWindow: ' + e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-fade-in-up"
        style={{ background: 'var(--ms-surface-1)', border: '1px solid var(--ms-border)' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>

        <h2 className="text-xl font-bold text-white mb-2">Saídas de Vídeo</h2>
        <p className="text-sm text-gray-400 mb-6">
          Selecione o monitor para onde deseja enviar o telão em tela cheia.
        </p>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {monitors.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">Nenhum monitor encontrado.</p>
            ) : (
              monitors.map((m, i) => (
                <div
                  key={i}
                  className="flex flex-col p-4 rounded-xl border"
                  style={{ borderColor: 'var(--ms-border)', background: 'var(--ms-surface-2)' }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-black/30 rounded-lg text-purple-400">
                      <Monitor size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Tela {i + 1} {m.name ? `(${m.name})` : ''}</p>
                      <p className="text-xs text-gray-400">
                        {m.size.width}x{m.size.height} px
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openWindow(m, 'projection')}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                      style={{ background: 'var(--ms-surface-3)', color: 'white', border: '1px solid var(--ms-border-hover)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--ms-surface-4)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--ms-surface-3)')}
                    >
                      <Play size={12} /> PROJEÇÃO
                    </button>
                    
                    <button
                      onClick={() => openWindow(m, 'stagedisplay')}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                      style={{ background: 'var(--ms-surface-0)', color: 'var(--ms-text-3)', border: '1px solid var(--ms-border)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--ms-surface-1)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--ms-surface-0)'; e.currentTarget.style.color = 'var(--ms-text-3)'; }}
                    >
                      <Monitor size={12} /> RETORNO
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
