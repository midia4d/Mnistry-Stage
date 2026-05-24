import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Music2, Check, X, Save, Loader2 } from 'lucide-react';
import { getSongs, saveSong, deleteSong, Song } from '../api/lyrics';
import { useLyrics } from '../context/LyricsContext';
import { useProjection } from '../context/ProjectionContext';
import { usePreview } from '../context/PreviewContext';

// ─── Modal de Criação / Edição ────────────────────────────────────────────────

interface SongModalProps {
  song: Song | null; // null = criar novo
  onClose: () => void;
  onSaved: () => void;
}

const SongModal: React.FC<SongModalProps> = ({ song, onClose, onSaved }) => {
  const [title, setTitle] = useState(song?.title ?? '');
  const [artist, setArtist] = useState(song?.artist ?? '');
  const [bpm, setBpm] = useState(song?.bpm?.toString() ?? '0');
  const [tags, setTags] = useState(song?.tags ?? '');
  const [lyrics, setLyrics] = useState(song?.lyrics ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(song?.id && song.id > 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Título é obrigatório.'); return; }
    setSaving(true);
    setError(null);
    try {
      await saveSong({
        ...(isEdit ? { id: song!.id } : {}),
        title: title.trim(),
        artist: artist.trim(),
        bpm: Number(bpm) || 0,
        tags: tags.trim(),
        lyrics: lyrics.trim(),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar música.');
    } finally {
      setSaving(false);
    }
  };

  // Fechar com Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ms-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ms-modal">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--ms-text-1)' }}>
              {isEdit ? 'Editar Música' : 'Nova Música'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ms-text-3)' }}>
              {isEdit ? `Editando: ${song!.title}` : 'Preencha os dados da música'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--ms-text-3)', background: 'var(--ms-surface-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ms-text-1)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--ms-text-3)')}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ms-text-3)' }}>
              TÍTULO *
            </label>
            <input
              className="ms-input"
              placeholder="Ex: Grande é o Senhor"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Artista + BPM */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ms-text-3)' }}>
                ARTISTA / MINISTÉRIO
              </label>
              <input
                className="ms-input"
                placeholder="Ex: Hillsong"
                value={artist}
                onChange={e => setArtist(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ms-text-3)' }}>
                BPM
              </label>
              <input
                className="ms-input"
                type="number"
                placeholder="0"
                min="0"
                max="300"
                value={bpm}
                onChange={e => setBpm(e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ms-text-3)' }}>
              TAGS (separadas por vírgula)
            </label>
            <input
              className="ms-input"
              placeholder="Ex: louvor, adoração, páscoa"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          {/* Letra */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--ms-text-3)' }}>
              LETRA (separe estrofes com linha em branco)
            </label>
            <textarea
              className="ms-textarea"
              placeholder={`Estrofe 1 / Verso 1\nEstrofe 1 / Verso 2\n\nEstrofe 2 / Refrão\nEstrofe 2 / Linha 2`}
              value={lyrics}
              onChange={e => setLyrics(e.target.value)}
              rows={8}
            />
            {lyrics && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--ms-text-3)' }}>
                {lyrics.split(/\n\s*\n/).filter(Boolean).length} estrofe(s) detectada(s)
              </p>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div
              className="text-sm px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--ms-red)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="ms-btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ms-btn-primary flex-1"
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
                : <><Save size={15} /> {isEdit ? 'Salvar alterações' : 'Adicionar música'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Painel principal ─────────────────────────────────────────────────────────

export const LyricsPanel: React.FC = () => {
  const { setActiveSong, activeSong, strophes } = useLyrics();
  const { clearScreen } = useProjection();
  const { sendToPreview, previewStropheIndex } = usePreview();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Song | null>(null);

  const loadSongs = async () => {
    setLoading(true);
    const data = await getSongs();
    setSongs(data);
    setLoading(false);
  };

  useEffect(() => { loadSongs(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    // Músicas de demo não podem ser deletadas
    if (id < 0) return;
    if (!confirm('Deletar esta música?')) return;
    await deleteSong(id);
    loadSongs();
  };

  const handleSelectSong = (song: Song) => {
    setActiveSong(song);
    clearScreen(); // Auto-limpa a tela para o modo Composition
  };

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Modal de criação / edição */}
      {modalOpen && (
        <SongModal
          song={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSaved={loadSongs}
        />
      )}

      <div className="flex flex-col h-full overflow-hidden">
        {/* Header da seção */}
        <div className="flex items-center justify-between mb-4">
          <p className="ms-section-title">Músicas ({songs.length})</p>
          <button
            className="ms-btn-primary text-xs px-3"
            style={{ minHeight: 32 }}
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
          >
            <Plus size={14} /> Nova
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--ms-text-3)' }}
          />
          <input
            className="ms-input pl-9 text-sm"
            placeholder="Buscar músicas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto space-y-1 -mr-1 pr-1">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: 'var(--ms-text-2)' }}
              />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Music2 size={28} style={{ color: 'var(--ms-text-3)' }} />
              <span className="text-sm" style={{ color: 'var(--ms-text-3)' }}>
                {songs.length === 0 ? 'Nenhuma música cadastrada' : 'Nenhum resultado'}
              </span>
            </div>
          )}

          {!loading && filtered.map(song => {
            const isActive = song.id === activeSong?.id;
            return (
              <div
                key={song.id}
                onClick={() => handleSelectSong(song)}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 animate-fade-in-up"
                style={{
                  background: isActive
                    ? 'var(--ms-surface-3)'
                    : 'transparent',
                  border: `1px solid ${isActive ? 'var(--ms-border-hover)' : 'transparent'}`,
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--ms-surface-2)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Ícone */}
                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: isActive
                      ? 'var(--ms-surface-4)'
                      : 'var(--ms-surface-2)',
                  }}
                >
                  {isActive
                    ? <Check size={16} color="white" />
                    : <Music2 size={16} style={{ color: 'var(--ms-text-3)' }} />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: isActive ? 'var(--ms-text-1)' : 'var(--ms-text-2)' }}
                  >
                    {song.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--ms-text-3)' }}>
                    {song.artist}
                    {song.bpm > 0 && <span className="ml-2 opacity-60">{song.bpm} BPM</span>}
                    {song.id && song.id < 0 && <span className="ml-2 opacity-50 italic">demo</span>}
                  </p>
                </div>

                {/* Ações (hover) — ocultas para demos */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {(!song.id || song.id > 0) && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); setEditTarget(song); setModalOpen(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--ms-text-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--ms-text-1)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--ms-text-3)')}
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={e => song.id && handleDelete(e, song.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--ms-text-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--ms-red)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--ms-text-3)')}
                        title="Deletar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
