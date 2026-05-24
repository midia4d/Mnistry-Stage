import React, { useState } from 'react';
import { useProjection } from '../context/ProjectionContext';
import { Bell, Send, Trash2, Eye, EyeOff } from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const { activeAlert, setAlert, layers, setLayer } = useProjection();
  const [inputText, setInputText] = useState('');
  
  const handleSend = () => {
    if (inputText.trim()) {
      setAlert(inputText.trim());
      setInputText('');
    }
  };

  const handleClear = () => {
    setAlert(null);
  };

  const toggleVisibility = () => {
    setLayer('alerts', { visible: !layers.alerts.visible });
  };

  return (
    <div className="flex flex-col h-full bg-black/20 overflow-hidden">
      {/* HEADER */}
      <div className="shrink-0 p-4 border-b border-white/5 bg-black/40">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell size={16} className="text-red-500" />
          Alertas e Mensagens
        </h2>
        <p className="text-[10px] text-gray-500 mt-1">
          Envie avisos rápidos (berçário, placas de carro) para a projeção como um rodapé animado.
        </p>
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6">
        
        {/* INPUT BOX */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400">Nova Mensagem</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ex: Criança chorando no berçário..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* ACTIVE ALERT */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400">Alerta Ativo</label>
          {activeAlert ? (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />
              <p className="text-lg font-bold text-white">{activeAlert}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <button 
                  onClick={toggleVisibility}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border"
                  style={{
                    background: layers.alerts.visible ? 'var(--ms-surface-3)' : 'var(--ms-surface-1)',
                    borderColor: layers.alerts.visible ? 'var(--ms-border-hover)' : 'var(--ms-border)',
                    color: layers.alerts.visible ? 'white' : 'var(--ms-text-3)'
                  }}
                >
                  {layers.alerts.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  {layers.alerts.visible ? 'OCULTAR' : 'MOSTRAR'}
                </button>

                <button 
                  onClick={handleClear}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 size={14} /> REMOVER
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2">
              <Bell size={24} className="text-gray-600" />
              <p className="text-xs text-gray-500 font-medium">Nenhum alerta ativo.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
