import { useState, useCallback } from 'react';
import { getVerse, VerseResponse, VERSIONS_PT } from '../api/bible';

export const useBible = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVerse, setCurrentVerse] = useState<VerseResponse | null>(null);
  const [version, setVersion] = useState('almeida');

  const fetchVerse = useCallback(async (reference: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVerse(reference, version);
      setCurrentVerse(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar versículo');
      setCurrentVerse(null);
    } finally {
      setLoading(false);
    }
  }, [version]);

  const changeVersion = useCallback((newVersion: string) => {
    setVersion(newVersion);
    if (currentVerse) {
      fetchVerse(currentVerse.reference);
    }
  }, [currentVerse, fetchVerse]);

  return {
    loading,
    error,
    currentVerse,
    version,
    versions: VERSIONS_PT,
    fetchVerse,
    changeVersion,
  };
};
