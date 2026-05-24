import { useEffect } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';

export const useGlobalShortcuts = () => {
  // Usa o context singleton — mesmo estado que os componentes
  const { isPlaying, stopVideo } = useVideoPlayer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco estiver em inputs ou textareas
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // F1-F12: Cenas
      if (e.key.startsWith('F')) {
        const num = parseInt(e.key.substring(1));
        if (num >= 1 && num <= 12) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('changeScene', { detail: num }));
        }
      }

      // Esc: Blackout
      if (e.key === 'Escape') {
        e.preventDefault();
        window.dispatchEvent(new Event('toggleBlackout'));
      }

      // Seta direita / PageDown: próxima estrofe
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        window.dispatchEvent(new Event('nextStrophe'));
      }

      // Seta esquerda / PageUp: estrofe anterior
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        window.dispatchEvent(new Event('prevStrophe'));
      }

      // Ctrl+Space: Play/Pause vídeo
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) stopVideo();
      }

      // Ctrl+B: Toggle Bíblia
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        window.dispatchEvent(new Event('toggleBible'));
      }

      // Ctrl+M: Stage Display
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        window.open('http://localhost:3000/stage', '_blank');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, stopVideo]);
};
