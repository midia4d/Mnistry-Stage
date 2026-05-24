import { useState, useCallback } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface PolygonMapping {
  id: string;
  points: Point[];
}

export const useMapping = () => {
  // Padrão: 1 projeção retangular cobrindo a tela toda
  const [mappings, setMappings] = useState<PolygonMapping[]>([
    {
      id: 'proj-1',
      points: [
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ],
    },
  ]);

  const updateMapping = useCallback((id: string, newPoints: Point[]) => {
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, points: newPoints } : m))
    );
  }, []);

  const addMapping = useCallback(() => {
    if (mappings.length >= 4) return; // Limite de 4 como estipulado
    setMappings((prev) => [
      ...prev,
      {
        id: `proj-${Date.now()}`,
        points: [
          { x: -0.5, y: 0.5 },
          { x: 0.5, y: 0.5 },
          { x: 0.5, y: -0.5 },
          { x: -0.5, y: -0.5 },
        ],
      },
    ]);
  }, [mappings]);

  const removeMapping = useCallback((id: string) => {
    if (mappings.length <= 1) return; // Mínimo 1
    setMappings((prev) => prev.filter((m) => m.id !== id));
  }, [mappings]);

  return {
    mappings,
    updateMapping,
    addMapping,
    removeMapping,
  };
};
