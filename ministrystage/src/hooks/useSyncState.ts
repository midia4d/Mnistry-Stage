import { useEffect, useState } from 'react';
import { MappingConfig, LayerState } from '../context/ProjectionContext';

export interface SyncState {
  channelA: string | null;
  channelB: string | null;
  activeChannel: 'A' | 'B';
  blendMode: string;
  crossfade: number;
  isPlaying: boolean;
  projectedText: string | null;
  projectedTitle: string | null;
  previewText: string | null;
  previewTitle: string | null;
  activeAlert: string | null;
  isBlackout: boolean;
  isCleared: boolean;
  mapping: MappingConfig;
  layers: LayerState;
}

const SYNC_CHANNEL_NAME = 'ministrystage-sync';

// Utilizado pela Janela Mestre (App.tsx)
export const useSyncBroadcaster = (state: SyncState) => {
  useEffect(() => {
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    // Envia o estado completo sempre que algo mudar
    channel.postMessage(state);
    return () => channel.close();
  }, [
    state.channelA, state.channelB, state.activeChannel, state.blendMode, state.crossfade, state.isPlaying,
    state.projectedText, state.projectedTitle, state.previewText, state.previewTitle, 
    state.activeAlert, state.isBlackout, state.isCleared,
    state.mapping, state.layers
  ]);
};

// Utilizado pela Janela Escrava (PublicProjection.tsx)
export const useSyncReceiver = (initialState: SyncState): SyncState => {
  const [state, setState] = useState<SyncState>(initialState);

  useEffect(() => {
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    
    // Pede o estado atual assim que abrir (opcional, mas o master geralmente atualiza rápido)
    channel.postMessage({ type: 'REQUEST_SYNC' });

    channel.onmessage = (event) => {
      // Ignora pedidos de sync que vêm da própria escrava
      if (event.data?.type === 'REQUEST_SYNC') return;
      setState(event.data);
    };

    return () => channel.close();
  }, []);

  return state;
};
