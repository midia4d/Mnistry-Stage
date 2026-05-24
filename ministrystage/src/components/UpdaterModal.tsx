import React, { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { DownloadCloud, X, RefreshCw } from 'lucide-react';

export const UpdaterModal: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloaded, setDownloaded] = useState(0);
  const [contentLength, setContentLength] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          setUpdateAvailable(update);
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    };
    
    // Pequeno delay para não travar o carregamento inicial do app
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    if (!updateAvailable) return;
    setIsUpdating(true);
    setError(null);
    try {
      await updateAvailable.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            setContentLength(event.data.contentLength);
            break;
          case 'Progress':
            setDownloaded(prev => prev + event.data.chunkLength);
            break;
          case 'Finished':
            break;
        }
      });
      // A atualização foi baixada e instalada. Precisa reiniciar o app.
      // O Tauri 2 já reinicia automaticamente na maioria dos casos, mas caso não:
      // import { relaunch } from '@tauri-apps/plugin-process';
      // await relaunch();
    } catch (err) {
      console.error('Update failed:', err);
      setError('Erro ao atualizar. Tente novamente mais tarde.');
      setIsUpdating(false);
    }
  };

  if (!updateAvailable) return null;

  const progress = contentLength ? Math.round((downloaded / contentLength) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-[360px] rounded-xl flex flex-col overflow-hidden shadow-2xl"
        style={{ background: 'var(--ms-surface-1)', border: '1px solid var(--ms-border)' }}
      >
        <div className="flex items-center gap-3 p-4" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--ms-border)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/20 text-green-400 shrink-0">
            <DownloadCloud size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">Nova atualização disponível!</h3>
            <p className="text-xs text-gray-400 mt-0.5">Versão {updateAvailable.version}</p>
          </div>
          {!isUpdating && (
            <button 
              onClick={() => setUpdateAvailable(null)}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="p-4 flex flex-col gap-4">
          {updateAvailable.body && (
            <div className="text-xs text-gray-300 bg-white/5 p-3 rounded-lg max-h-[100px] overflow-y-auto">
              {updateAvailable.body}
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
              {error}
            </div>
          )}

          {isUpdating ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={10} className="animate-spin" /> 
                  Baixando atualização...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUpdateAvailable(null)}
                className="px-4 py-2 rounded-md text-xs font-bold text-gray-400 hover:bg-white/5 transition-colors"
              >
                Lembrar depois
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-md text-xs font-bold bg-green-600 hover:bg-green-500 text-white transition-colors"
              >
                Instalar agora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
