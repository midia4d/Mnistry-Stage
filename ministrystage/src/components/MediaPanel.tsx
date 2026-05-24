import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon, Video, FolderPlus, Trash2, Play,
  LayoutGrid, List, Square, Search, Layers as Blend, Settings2, Timer
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { getMediaList, saveMediaItem, removeMediaItem, MediaItem } from '../api/media';

// ── Gerador de miniatura via Canvas (captura o 1º frame do vídeo)
function useVideoThumbnail(path: string | undefined, type: 'video' | 'image') {
  const [thumb, setThumb] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) return;

    setLoading(true);

    if (type === 'image') {
      setThumb(convertFileSrc(path));
      setLoading(false);
      return;
    }

    // Para vídeo: carrega no background e captura frame via Canvas
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');

    const cleanup = () => {
      video.src = '';
      video.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = 1;
    };

    video.onseeked = () => {
      try {
        ctx?.drawImage(video, 0, 0, 160, 90);
        setThumb(canvas.toDataURL('image/jpeg', 0.7));
      } catch {
        setThumb(null);
      }
      setLoading(false);
      cleanup();
    };

    video.onerror = () => {
      setLoading(false);
      cleanup();
    };

    video.src = convertFileSrc(path);
    video.load();

    return cleanup;
  }, [path, type]);

  return { thumb, loading };
}

// ── Cartão de mídia com miniatura
interface MediaCardProps {
  item: MediaItem;
  isActive: boolean;
  viewMode: 'grid' | 'list';
  onPlay: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, isActive, viewMode, onPlay, onRemove }) => {
  const { thumb, loading } = useVideoThumbnail(item.path, item.type);
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === 'list') {
    return (
      <button
        onClick={onPlay}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex items-center gap-3 px-3 transition-all group"
        style={{
          height: 44,
          background: isActive
            ? 'rgba(34,197,94,0.08)'
            : isHovered
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
          border: `1px solid ${isActive ? 'rgba(34,197,94,0.25)' : isHovered ? 'var(--ms-border)' : 'transparent'}`,
          borderRadius: 8,
        }}
      >
        {/* Mini thumb */}
        <div
          className="shrink-0 rounded-md overflow-hidden"
          style={{ width: 60, height: 34, background: '#000', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}
        >
          {loading && <div className="ms-shimmer absolute inset-0" />}
          {thumb ? (
            <img src={thumb} alt={item.name} className="w-full h-full object-cover" />
          ) : !loading ? (
            <div className="w-full h-full flex items-center justify-center">
              {item.type === 'video' ? (
                <Video size={14} style={{ color: 'var(--ms-text-3)' }} />
              ) : (
                <ImageIcon size={14} style={{ color: 'var(--ms-text-3)' }} />
              )}
            </div>
          ) : null}
        </div>

        {/* Type icon + name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {item.type === 'video'
            ? <Video size={11} style={{ color: isActive ? 'var(--ms-green)' : 'var(--ms-text-4)', flexShrink: 0 }} />
            : <ImageIcon size={11} style={{ color: isActive ? 'var(--ms-green)' : 'var(--ms-text-4)', flexShrink: 0 }} />
          }
          <span className="text-xs font-medium truncate text-left" style={{ color: isActive ? 'white' : 'var(--ms-text-2)' }}>
            {item.name.replace(/\.[^/.]+$/, '')}
          </span>
        </div>

        {/* Live badge */}
        {isActive && (
          <div className="shrink-0 flex items-center gap-1.5">
            <div className="ms-live-dot" style={{ width: 5, height: 5 }} />
            <span className="text-[9px] font-bold tracking-wider" style={{ color: 'var(--ms-green)' }}>LIVE</span>
          </div>
        )}

        {/* Remove */}
        <div
          onClick={onRemove}
          className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{ color: 'var(--ms-red)', background: 'rgba(239,68,68,0.1)' }}
        >
          <Trash2 size={11} />
        </div>
      </button>
    );
  }

  // Grid mode
  return (
    <button
      onClick={onPlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-lg overflow-hidden transition-all group"
      style={{
        aspectRatio: '16/9',
        background: '#080808',
        border: isActive
          ? '1.5px solid rgba(34,197,94,0.5)'
          : isHovered
          ? '1.5px solid rgba(255,255,255,0.14)'
          : '1.5px solid rgba(255,255,255,0.06)',
        boxShadow: isActive ? '0 0 16px rgba(34,197,94,0.15)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Shimmer loading */}
      {loading && <div className="ms-shimmer absolute inset-0" />}

      {/* Miniatura */}
      {thumb ? (
        <img
          src={thumb}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isActive ? 0.9 : isHovered ? 0.85 : 0.72, transition: 'opacity 0.2s' }}
        />
      ) : !loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-lg p-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {item.type === 'video' ? (
              <Video size={20} style={{ color: 'rgba(255,255,255,0.25)' }} />
            ) : (
              <ImageIcon size={20} style={{ color: 'rgba(255,255,255,0.25)' }} />
            )}
          </div>
        </div>
      ) : null}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }}
      />

      {/* Hover play overlay */}
      {!isActive && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Play size={15} className="ml-0.5" style={{ color: 'white' }} />
          </div>
        </div>
      )}

      {/* Badge tipo (top-left) */}
      <div
        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded flex items-center gap-1"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      >
        {item.type === 'video'
          ? <Video size={9} style={{ color: 'rgba(255,255,255,0.6)' }} />
          : <ImageIcon size={9} style={{ color: 'rgba(255,255,255,0.6)' }} />
        }
        <span className="text-[8px] font-bold uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {item.type === 'video' ? 'VID' : 'IMG'}
        </span>
      </div>

      {/* Badge LIVE (top-right) */}
      {isActive && (
        <div
          className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(34,197,94,0.2)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(34,197,94,0.45)',
            boxShadow: '0 0 8px rgba(34,197,94,0.2)',
          }}
        >
          <div className="ms-live-dot" style={{ width: 4, height: 4 }} />
          <span className="text-[8px] font-bold" style={{ color: 'var(--ms-green)' }}>LIVE</span>
        </div>
      )}

      {/* Remover (bottom-right, hover only) */}
      <div
        onClick={onRemove}
        className="absolute bottom-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(4px)' }}
      >
        <Trash2 size={10} style={{ color: '#fca5a5' }} />
      </div>

      {/* Nome (bottom-left) */}
      <p
        className="absolute bottom-1.5 left-2 right-8 text-[10px] font-semibold truncate"
        style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 6px rgba(0,0,0,1)' }}
      >
        {item.name.replace(/\.[^/.]+$/, '')}
      </p>
    </button>
  );
};

// ── Section divider
const SectionLabel: React.FC<{ label: string; count: number; icon: React.ReactNode }> = ({ label, count, icon }) => (
  <div className="ms-media-section-label">
    <div className="flex items-center gap-1.5 shrink-0">
      <span style={{ color: 'var(--ms-text-4)' }}>{icon}</span>
      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-4)' }}>
        {label}
      </span>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-3)', border: '1px solid var(--ms-border)' }}
      >
        {count}
      </span>
    </div>
  </div>
);

// ── Painel principal
export const MediaPanel: React.FC = () => {
  const {
    channelA, channelB, activeChannel, isPlaying,
    blendMode, setBlendMode, crossfade, setCrossfade,
    transitionDuration, setTransitionDuration,
    playVideo, stopVideo
  } = useVideoPlayer();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'video' | 'image'>('all');

  const currentVideo = isPlaying ? (channelA || channelB) : null;

  const loadMedia = useCallback(async () => {
    const items = await getMediaList();
    setMediaList(items);
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  const handleAddMedia = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Mídias', extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'jpg', 'jpeg', 'png'] }]
      });
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        for (const path of paths) {
          const name = path.split('/').pop()?.split('\\').pop() || 'Arquivo';
          const ext = name.split('.').pop()?.toLowerCase();
          const isVideo = ['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext || '');
          await saveMediaItem({ id: path, path, name, type: isVideo ? 'video' : 'image' });
        }
        loadMedia();
      }
    } catch (e) { console.error('Erro ao adicionar mídias:', e); }
  };

  const handleRemoveMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeMediaItem(id);
    loadMedia();
  };

  // Filtragem
  const filtered = mediaList.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const videos = filtered.filter(i => i.type === 'video');
  const images = filtered.filter(i => i.type === 'image');

  const crossfadeTrack = `linear-gradient(to right, rgba(255,255,255,0.35) ${crossfade}%, rgba(255,255,255,0.08) ${crossfade}%)`;

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: 'var(--ms-surface-1)' }}
    >
      {/* ── HEADER: Título, Busca, Filtros, View Mode e Adicionar ── */}
      <div
        className="shrink-0 flex flex-col gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid var(--ms-border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--ms-text-3)' }}>
              Biblioteca de Mídia
            </span>
            {filtered.length > 0 && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-4)', border: '1px solid var(--ms-border)' }}
              >
                {filtered.length}
              </span>
            )}
          </div>
          <button
            onClick={handleAddMedia}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all"
            style={{
              background: 'var(--ms-surface-3)',
              color: 'var(--ms-text-1)',
              border: '1px solid var(--ms-border-hover)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--ms-surface-4)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--ms-border-strong)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--ms-surface-3)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--ms-border-hover)';
            }}
          >
            <FolderPlus size={11} />
            Adicionar
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="flex-1 min-w-0 relative flex items-center">
            <Search size={11} className="absolute left-2" style={{ color: 'var(--ms-text-4)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar mídias..."
              className="w-full pl-6 pr-2 py-1 rounded-md text-[11px] outline-none transition-all focus:border-green-500/50"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--ms-text-1)',
                border: '1px solid var(--ms-border)',
                height: 24,
              }}
            />
          </div>

          {/* Filtros */}
          <div
            className="flex shrink-0 gap-0.5 p-0.5 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ms-border)' }}
          >
            {([['all', 'Todos'], ['video', 'Vídeo'], ['image', 'Img']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className="px-2 py-0.5 rounded text-[10px] font-bold transition-all"
                style={{
                  background: filter === val ? 'var(--ms-surface-3)' : 'transparent',
                  color: filter === val ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
                  border: `1px solid ${filter === val ? 'var(--ms-border-hover)' : 'transparent'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div
            className="flex shrink-0 gap-0.5 p-0.5 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ms-border)' }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className="p-1 rounded transition-all"
              style={{
                background: viewMode === 'grid' ? 'var(--ms-surface-3)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
              }}
            >
              <LayoutGrid size={11} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-1 rounded transition-all"
              style={{
                background: viewMode === 'list' ? 'var(--ms-surface-3)' : 'transparent',
                color: viewMode === 'list' ? 'var(--ms-text-1)' : 'var(--ms-text-3)',
              }}
            >
              <List size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        {filtered.length === 0 ? (
          // Estado vazio melhorado
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ms-border)' }}
            >
              <Square size={24} style={{ color: 'var(--ms-text-4)' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold" style={{ color: 'var(--ms-text-3)' }}>
                {mediaList.length === 0 ? 'Biblioteca vazia' : 'Nenhum resultado'}
              </p>
              <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--ms-text-4)' }}>
                {mediaList.length === 0
                  ? 'Clique em "Adicionar" para importar\nvídeos e imagens de fundo'
                  : 'Tente outro filtro ou busca'}
              </p>
            </div>
            {mediaList.length === 0 && (
              <button
                onClick={handleAddMedia}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all mt-1"
                style={{
                  background: 'var(--ms-surface-3)',
                  color: 'var(--ms-text-2)',
                  border: '1px solid var(--ms-border-hover)',
                }}
              >
                <FolderPlus size={13} />
                Adicionar mídias
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          // Modo lista
          <div className="flex flex-col gap-0.5">
            {videos.length > 0 && (
              <div className="mb-1">
                <SectionLabel label="Vídeos" count={videos.length} icon={<Video size={10} />} />
                <div className="flex flex-col gap-0.5">
                  {videos.map(item => (
                    <MediaCard
                      key={item.id} item={item} viewMode="list"
                      isActive={currentVideo === item.path}
                      onPlay={() => playVideo(item.path)}
                      onRemove={(e) => handleRemoveMedia(item.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}
            {images.length > 0 && (
              <div>
                <SectionLabel label="Imagens" count={images.length} icon={<ImageIcon size={10} />} />
                <div className="flex flex-col gap-0.5">
                  {images.map(item => (
                    <MediaCard
                      key={item.id} item={item} viewMode="list"
                      isActive={currentVideo === item.path}
                      onPlay={() => playVideo(item.path)}
                      onRemove={(e) => handleRemoveMedia(item.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Modo grid
          <div className="space-y-4">
            {videos.length > 0 && (
              <div>
                <SectionLabel label="Vídeos" count={videos.length} icon={<Video size={10} />} />
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {videos.map(item => (
                    <MediaCard
                      key={item.id} item={item} viewMode="grid"
                      isActive={currentVideo === item.path}
                      onPlay={() => playVideo(item.path)}
                      onRemove={(e) => handleRemoveMedia(item.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}
            {images.length > 0 && (
              <div>
                <SectionLabel label="Imagens" count={images.length} icon={<ImageIcon size={10} />} />
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {images.map(item => (
                    <MediaCard
                      key={item.id} item={item} viewMode="grid"
                      isActive={currentVideo === item.path}
                      onPlay={() => playVideo(item.path)}
                      onRemove={(e) => handleRemoveMedia(item.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MIXER ROW (Bottom Console) ── */}
      <div
        className="shrink-0 flex items-center justify-between px-3"
        style={{
          height: 44,
          borderTop: '1px solid var(--ms-border)',
          background: 'var(--ms-surface-2)',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.2)',
          zIndex: 10
        }}
      >
        {/* Lado Esquerdo: Tempo de Transição + Blend Mode */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Timer size={11} style={{ color: 'var(--ms-text-4)' }} />
            <div className="flex flex-col gap-0.5" style={{ width: 60 }}>
              <span className="text-[8px] font-bold uppercase" style={{ color: 'var(--ms-text-4)', lineHeight: 1 }}>Fade: {transitionDuration / 1000}s</span>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={transitionDuration}
                onChange={e => setTransitionDuration(Number(e.target.value))}
                className="ms-crossfader w-full"
                style={{ height: 4, background: `linear-gradient(to right, rgba(34,197,94,0.5) ${(transitionDuration-100)/39}%, rgba(255,255,255,0.1) ${(transitionDuration-100)/39}%)` }}
              />
            </div>
          </div>
          
          <div className="w-px h-6 shrink-0" style={{ background: 'var(--ms-border)' }} />

          <div className="flex items-center gap-1.5 shrink-0">
            <Blend size={11} style={{ color: 'var(--ms-text-4)' }} />
            <select
              value={blendMode}
              onChange={e => setBlendMode(e.target.value)}
              className="text-[10px] font-semibold outline-none rounded-md px-1.5 py-1 cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--ms-text-2)',
                border: '1px solid var(--ms-border)',
                maxWidth: 100,
              }}
            >
              <option value="normal">Normal</option>
              <option value="screen">Screen</option>
              <option value="multiply">Multiply</option>
              <option value="add">Add</option>
              <option value="overlay">Overlay</option>
              <option value="color-dodge">Color Dodge</option>
            </select>
          </div>
        </div>

        {/* Lado Direito: Crossfader A/B */}
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded"
            style={{
              color: crossfade < 50 ? 'var(--ms-text-2)' : 'var(--ms-text-4)',
              background: crossfade < 50 ? 'rgba(255,255,255,0.08)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            A
          </span>
          <div className="flex-1 relative flex items-center" style={{ width: 140 }}>
            <input
              type="range"
              min="0"
              max="100"
              value={crossfade}
              onChange={e => setCrossfade(Number(e.target.value))}
              className="ms-crossfader w-full"
              style={{ background: crossfadeTrack }}
            />
          </div>
          <span
            className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded"
            style={{
              color: crossfade >= 50 ? 'var(--ms-text-2)' : 'var(--ms-text-4)',
              background: crossfade >= 50 ? 'rgba(255,255,255,0.08)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            B
          </span>
        </div>
      </div>
    </div>
  );
};
