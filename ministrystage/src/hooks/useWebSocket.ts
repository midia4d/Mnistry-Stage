import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useWebSocket = () => {
  const sendMessage = useCallback(async (action: string, payload: any) => {
    try {
      const message = JSON.stringify({ action, payload });
      await invoke('send_ws_message', { message });
    } catch (error) {
      console.error('Falha ao enviar mensagem WebSocket:', error);
    }
  }, []);

  return { sendMessage };
};
