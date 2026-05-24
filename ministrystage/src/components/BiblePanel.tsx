import React, { useState } from 'react';
import { Search, BookOpen, Copy, CheckCircle, MonitorPlay, ChevronLeft } from 'lucide-react';
import { useBible } from '../hooks/useBible';
import { useProjection } from '../context/ProjectionContext';
import { usePreview } from '../context/PreviewContext';
import { BIBLE_BOOKS } from '../api/bible';

type BibleStep = 'book' | 'chapter' | 'verse';

export const BiblePanel: React.FC = () => {
  const { loading, error, currentVerse, version, fetchVerse } = useBible();
  const { projectedSource } = useProjection();
  const { sendToPreview } = usePreview();
  
  const [step, setStep] = useState<BibleStep>('book');
  const [selectedBook, setSelectedBook] = useState<typeof BIBLE_BOOKS[0] | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [reference, setReference] = useState('');
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);

  // ─── Busca Direta (Barra de Pesquisa) ─────────────────────────────────────────
  const handleDirectSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setStep('verse');
    setSelectedBook(null);
    setSelectedChapter(null);
    fetchVerse(reference.trim());
  };

  // ─── Navegação Holyrics ───────────────────────────────────────────────────────
  const handleBookClick = (book: typeof BIBLE_BOOKS[0]) => {
    setSelectedBook(book);
    setStep('chapter');
  };

  const handleChapterClick = (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    setStep('verse');
    // Busca o capítulo inteiro (ex: "Mateus 1")
    fetchVerse(`${selectedBook.name} ${chapter}`);
  };

  const handleBack = () => {
    if (step === 'verse' && selectedBook) {
      setStep('chapter');
    } else if (step === 'chapter') {
      setStep('book');
      setSelectedBook(null);
    } else {
      setStep('book');
      setSelectedBook(null);
    }
  };

  // ─── Ações de Projeção e Cópia ────────────────────────────────────────────────
  const handleProjectVerse = (verseText: string, verseNumber: number) => {
    const title = selectedBook && selectedChapter 
      ? `${selectedBook.name} ${selectedChapter}:${verseNumber} (Almeida)`
      : `${currentVerse?.reference} (Almeida)`;
      
    sendToPreview(verseText, title, 'bible');
  };

  const handleProjectSingle = () => {
    if (!currentVerse) return;
    sendToPreview(
      currentVerse.text.trim(),
      `${currentVerse.reference} (Almeida)`,
      'bible'
    );
  };

  const copyToClipboard = async (text: string, ref: string) => {
    await navigator.clipboard.writeText(`${text.trim()} — ${ref}`);
    setCopiedVerse(ref);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  const isProjected = projectedSource === 'bible';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <p className="ms-section-title" style={{ marginBottom: 0 }}>Bíblia</p>
        <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: 'var(--ms-surface-2)', color: 'var(--ms-text-3)' }}>
          Almeida
        </span>
      </div>

      {/* Busca Direta */}
      <form onSubmit={handleDirectSearch} className="flex gap-2 mb-4 shrink-0">
        <input
          className="ms-input text-sm flex-1"
          placeholder="Busca rápida ex: João 3:16"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />
        <button type="submit" className="ms-btn-primary px-3" style={{ minHeight: 40, borderRadius: 12 }}>
          <Search size={16} />
        </button>
      </form>

      {/* Botão Voltar (Navegação) */}
      {step !== 'book' && (
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 mb-3 text-xs font-semibold hover:underline"
          style={{ color: 'var(--ms-accent)' }}
        >
          <ChevronLeft size={14} /> 
          Voltar para {step === 'verse' && selectedBook ? 'Capítulos' : 'Livros'}
        </button>
      )}

      {/* ─── ÁREA DE CONTEÚDO (Grid ou Lista) ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        
        {/* PASSO 1: Lista de Livros */}
        {step === 'book' && (
          <div className="grid grid-cols-2 gap-2 pb-4">
            {BIBLE_BOOKS.map(book => (
              <button
                key={book.name}
                onClick={() => handleBookClick(book)}
                className="text-left px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'var(--ms-surface-2)', color: 'var(--ms-text-2)', border: '1px solid var(--ms-border)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ms-accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ms-border)')}
              >
                {book.name}
              </button>
            ))}
          </div>
        )}

        {/* PASSO 2: Grid de Capítulos */}
        {step === 'chapter' && selectedBook && (
          <div className="animate-fade-in-up">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ms-text-1)' }}>
              {selectedBook.name} - Capítulos
            </h3>
            <div className="grid grid-cols-5 gap-2 pb-4">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(cap => (
                <button
                  key={cap}
                  onClick={() => handleChapterClick(cap)}
                  className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--ms-surface-2)', color: 'var(--ms-text-1)', border: '1px solid var(--ms-border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--ms-surface-3)';
                    e.currentTarget.style.borderColor = 'var(--ms-border-hover)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--ms-surface-2)';
                    e.currentTarget.style.borderColor = 'var(--ms-border)';
                  }}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 3: Lista de Versículos */}
        {step === 'verse' && (
          <div className="animate-fade-in-up flex flex-col gap-3 pb-4">
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-ms-accent border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--ms-accent)', borderTopColor: 'transparent' }} />
                <span className="text-xs" style={{ color: 'var(--ms-text-3)' }}>Buscando versículos...</span>
              </div>
            )}

            {error && !loading && (
              <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--ms-red)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            {/* Renderização se trouxer um capítulo inteiro (Array de verses) */}
            {!loading && currentVerse && currentVerse.verses && currentVerse.verses.length > 1 && (
              <>
                <h3 className="text-sm font-bold mb-2 sticky top-0 py-2 z-10" style={{ background: 'var(--ms-surface-1)', color: 'var(--ms-text-1)' }}>
                  {selectedBook?.name ?? currentVerse.verses[0].book_name} {selectedChapter ?? currentVerse.verses[0].chapter}
                </h3>
                {currentVerse.verses.map(v => (
                  <div 
                    key={v.verse}
                    className="p-3 rounded-xl group transition-all"
                    style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold mt-0.5" style={{ color: 'var(--ms-text-3)' }}>{v.verse}</span>
                      <p className="text-sm leading-6 flex-1" style={{ color: 'var(--ms-text-2)' }}>{v.text.trim()}</p>
                    </div>
                    
                    {/* Botões de Ação do Versículo (Aparecem no hover) */}
                    <div className="flex gap-2 mt-3 pt-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTop: '1px solid var(--ms-border)' }}>
                      <button
                        onClick={() => handleProjectVerse(v.text.trim(), v.verse)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-1)', border: '1px solid var(--ms-border-hover)' }}
                      >
                        <MonitorPlay size={14} /> Preview
                      </button>
                      <button
                        onClick={() => copyToClipboard(v.text, `${currentVerse.verses[0].book_name} ${currentVerse.verses[0].chapter}:${v.verse}`)}
                        className="w-8 flex items-center justify-center rounded-lg"
                        style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-2)' }}
                      >
                        {copiedVerse === `${currentVerse.verses[0].book_name} ${currentVerse.verses[0].chapter}:${v.verse}` ? <CheckCircle size={14} color="var(--ms-teal)" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Renderização se for busca direta e trouxer só um versículo mesclado */}
            {!loading && currentVerse && (!currentVerse.verses || currentVerse.verses.length <= 1) && (
              <div className="p-4 rounded-xl flex flex-col gap-3" style={{ background: 'var(--ms-surface-2)', border: '1px solid var(--ms-border)' }}>
                <div>
                  <h3 className="font-bold text-base" style={{ color: 'var(--ms-accent)' }}>
                    {currentVerse.reference}
                  </h3>
                </div>
                <p className="text-sm leading-7" style={{ color: 'var(--ms-text-1)' }}>
                  {currentVerse.text}
                </p>
                <div className="flex gap-2 mt-2 pt-3" style={{ borderTop: '1px solid var(--ms-border)' }}>
                  <button
                    onClick={handleProjectSingle}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
                    style={{ background: 'var(--ms-surface-3)', color: 'var(--ms-text-1)', border: '1px solid var(--ms-border-hover)' }}
                  >
                    <MonitorPlay size={15} /> Preview → Ao Vivo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
