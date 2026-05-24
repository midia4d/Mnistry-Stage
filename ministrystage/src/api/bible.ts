import { openDB } from "idb";

export const BIBLE_BOOKS = [
  { name: 'Gênesis', abbrev: 'gn', chapters: 50 },
  { name: 'Êxodo', abbrev: 'ex', chapters: 40 },
  { name: 'Levítico', abbrev: 'lv', chapters: 27 },
  { name: 'Números', abbrev: 'nm', chapters: 36 },
  { name: 'Deuteronômio', abbrev: 'dt', chapters: 34 },
  { name: 'Josué', abbrev: 'js', chapters: 24 },
  { name: 'Juízes', abbrev: 'jz', chapters: 21 },
  { name: 'Rute', abbrev: 'rt', chapters: 4 },
  { name: '1 Samuel', abbrev: '1sm', chapters: 31 },
  { name: '2 Samuel', abbrev: '2sm', chapters: 24 },
  { name: '1 Reis', abbrev: '1rs', chapters: 22 },
  { name: '2 Reis', abbrev: '2rs', chapters: 25 },
  { name: '1 Crônicas', abbrev: '1cr', chapters: 29 },
  { name: '2 Crônicas', abbrev: '2cr', chapters: 36 },
  { name: 'Esdras', abbrev: 'ed', chapters: 10 },
  { name: 'Neemias', abbrev: 'ne', chapters: 13 },
  { name: 'Ester', abbrev: 'et', chapters: 10 },
  { name: 'Jó', abbrev: 'job', chapters: 42 },
  { name: 'Salmos', abbrev: 'sl', chapters: 150 },
  { name: 'Provérbios', abbrev: 'pv', chapters: 31 },
  { name: 'Eclesiastes', abbrev: 'ec', chapters: 12 },
  { name: 'Cânticos', abbrev: 'ct', chapters: 8 },
  { name: 'Isaías', abbrev: 'is', chapters: 66 },
  { name: 'Jeremias', abbrev: 'jr', chapters: 52 },
  { name: 'Lamentações', abbrev: 'lm', chapters: 5 },
  { name: 'Ezequiel', abbrev: 'ez', chapters: 48 },
  { name: 'Daniel', abbrev: 'dn', chapters: 12 },
  { name: 'Oseias', abbrev: 'os', chapters: 14 },
  { name: 'Joel', abbrev: 'jl', chapters: 3 },
  { name: 'Amós', abbrev: 'am', chapters: 9 },
  { name: 'Obadias', abbrev: 'ob', chapters: 1 },
  { name: 'Jonas', abbrev: 'jn', chapters: 4 },
  { name: 'Miqueias', abbrev: 'mq', chapters: 7 },
  { name: 'Naum', abbrev: 'na', chapters: 3 },
  { name: 'Habacuque', abbrev: 'hc', chapters: 3 },
  { name: 'Sofonias', abbrev: 'sf', chapters: 3 },
  { name: 'Ageu', abbrev: 'ag', chapters: 2 },
  { name: 'Zacarias', abbrev: 'zc', chapters: 14 },
  { name: 'Malaquias', abbrev: 'ml', chapters: 4 },
  { name: 'Mateus', abbrev: 'mt', chapters: 28 },
  { name: 'Marcos', abbrev: 'mc', chapters: 16 },
  { name: 'Lucas', abbrev: 'lc', chapters: 24 },
  { name: 'João', abbrev: 'jo', chapters: 21 },
  { name: 'Atos', abbrev: 'at', chapters: 28 },
  { name: 'Romanos', abbrev: 'rm', chapters: 16 },
  { name: '1 Coríntios', abbrev: '1co', chapters: 16 },
  { name: '2 Coríntios', abbrev: '2co', chapters: 13 },
  { name: 'Gálatas', abbrev: 'gl', chapters: 6 },
  { name: 'Efésios', abbrev: 'ef', chapters: 6 },
  { name: 'Filipenses', abbrev: 'fp', chapters: 4 },
  { name: 'Colossenses', abbrev: 'cl', chapters: 4 },
  { name: '1 Tessalonicenses', abbrev: '1ts', chapters: 5 },
  { name: '2 Tessalonicenses', abbrev: '2ts', chapters: 3 },
  { name: '1 Timóteo', abbrev: '1tm', chapters: 6 },
  { name: '2 Timóteo', abbrev: '2tm', chapters: 4 },
  { name: 'Tito', abbrev: 'tt', chapters: 3 },
  { name: 'Filemom', abbrev: 'fm', chapters: 1 },
  { name: 'Hebreus', abbrev: 'hb', chapters: 13 },
  { name: 'Tiago', abbrev: 'tg', chapters: 5 },
  { name: '1 Pedro', abbrev: '1pe', chapters: 5 },
  { name: '2 Pedro', abbrev: '2pe', chapters: 3 },
  { name: '1 João', abbrev: '1jo', chapters: 5 },
  { name: '2 João', abbrev: '2jo', chapters: 1 },
  { name: '3 João', abbrev: '3jo', chapters: 1 },
  { name: 'Judas', abbrev: 'jd', chapters: 1 },
  { name: 'Apocalipse', abbrev: 'ap', chapters: 22 }
];

const BIBLE_API_URL = "https://bible-api.com";

// Inicializa o banco de cache da Bíblia
export const initBibleDB = async () => {
  return openDB("ministrystage-bible-cache", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("verses")) {
        db.createObjectStore("verses", { keyPath: "id" });
      }
    },
  });
};

export interface VerseResponse {
  reference: string;
  verses: {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export const VERSIONS_PT = [
  { id: "almeida", name: "João Ferreira de Almeida (Almeida)" }
];

export const getVerse = async (reference: string, version: string = "almeida"): Promise<VerseResponse> => {
  let db;
  const cacheKey = `${reference.toLowerCase()}-${version}`;
  
  try {
    db = await initBibleDB();
    // Tenta puxar do cache local primeiro
    const cached = await db.get("verses", cacheKey);
    if (cached) {
      return cached.data;
    }
  } catch (e) {
    console.warn("IndexedDB indisponível, usando apenas rede.", e);
  }

  // Faz o fetch da API bible-api.com com encodeURIComponent para lidar com espaços (ex: João 3:16)
  const encodedReference = encodeURIComponent(reference);
  const response = await fetch(`${BIBLE_API_URL}/${encodedReference}?translation=${version}`);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro: ${response.status} - ${errText}`);
  }
  
  const data: VerseResponse = await response.json();
  
  // Salva no IndexedDB para uso futuro offline ou mais rápido
  if (db) {
    try {
      await db.put("verses", { id: cacheKey, data });
    } catch (e) {
      console.warn("Falha ao salvar no IndexedDB", e);
    }
  }
  
  return data;
};
