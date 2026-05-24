import { supabase } from './supabase';

export interface Song {
  id?: number;
  title: string;
  artist: string;
  lyrics: string;
  tags: string;
  bpm: number;
  updated_at?: string;
}

// Músicas de demonstração (aparecem quando Supabase não está disponível)
export const DEMO_SONGS: Song[] = [
  {
    id: -1,
    title: 'Grande é o Senhor',
    artist: 'Ministério Ipiranga',
    bpm: 76,
    tags: 'louvor,adoração',
    lyrics: `Grande é o Senhor e mui digno de louvor
Na cidade do nosso Deus, no seu santo monte

Grande é o Senhor que nos guarda e nos sustenta
Sua misericórdia se renova a cada manhã

Aleluia, aleluia
Grande é o Senhor
Aleluia, aleluia
Digno de louvor`,
  },
  {
    id: -2,
    title: 'Quão Grande é o Meu Deus',
    artist: 'Chris Tomlin',
    bpm: 68,
    tags: 'adoração,clássico',
    lyrics: `O Senhor reina, vista-se de glória
O Senhor se vestiu e se cingiu de força
O mundo foi firmado e não se abaterá

Quão grande é o meu Deus
Cantai comigo, quão grande é meu Deus
E todos verão quão grande, quão grande é o meu Deus

Eterno és Tu, Senhor, desde sempre existes
E existirás para sempre, és o mesmo Deus`,
  },
  {
    id: -3,
    title: 'Ó Vinde Adoremos',
    artist: 'Hinário',
    bpm: 80,
    tags: 'hino,adoração',
    lyrics: `Ó vinde adoremos, ó vinde adoremos
Ó vinde adoremos a Cristo o Senhor

Cantemos ao Rei com alegria e louvor
Que veio ao mundo para nos salvar

Glória in excelsis Deo
Glória in excelsis Deo`,
  },
];

// Retorna todas as músicas da nuvem
export const getSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.warn('Supabase indisponível, usando músicas de demo:', error.message);
    return DEMO_SONGS;
  }
  // Se retornou sucesso mas vazio, adiciona demo como sugestão
  return data && data.length > 0 ? data : DEMO_SONGS;
};


// Retorna uma música específica
export const getSong = async (id: number): Promise<Song | undefined> => {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar música específica:', error.message);
    return undefined;
  }
  return data;
};

// Cria ou atualiza uma música
export const saveSong = async (song: Partial<Song>): Promise<number> => {
  const { data, error } = await supabase
    .from('songs')
    .upsert({ ...song, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar música:', error.message);
    throw new Error(error.message);
  }
  return data.id;
};

// Deleta uma música
export const deleteSong = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar música:', error.message);
    throw new Error(error.message);
  }
};
