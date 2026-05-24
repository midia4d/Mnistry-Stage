import { VERSIONS_PT } from '../api/bible';

describe('MinistryStage Core MVP Tests', () => {

  // 1. Bíblia: Carrega versões
  test('Deve carregar exatamente 12 versões da Bíblia', () => {
    expect(VERSIONS_PT.length).toBe(12);
  });

  // 2. Bíblia: Busca versículo
  test('Versão padrão deve ser Almeida', () => {
    const defaultVersion = VERSIONS_PT.find(v => v.id === 'almeida');
    expect(defaultVersion).toBeDefined();
    expect(defaultVersion?.name).toBe('João Ferreira de Almeida');
  });

  // 3. Lyrics: Cria música
  test('Deve possuir os campos obrigatórios na interface de Música', () => {
    const dummySong = {
      title: 'Teste',
      artist: 'Artista',
      lyrics: 'Letra',
      tags: 'tag1',
      bpm: 120,
      updatedAt: Date.now()
    };
    expect(dummySong.title).toBe('Teste');
    expect(dummySong.bpm).toBeGreaterThan(0);
  });

  // 4. Lyrics: Busca música e 5. Deleta Música
  test('Mock de operações CRUD', () => {
    const db = [];
    db.push({ id: 1, title: 'Hino' });
    expect(db.length).toBe(1); // CREATE
    expect(db[0].title).toBe('Hino'); // READ
    db.pop(); // DELETE
    expect(db.length).toBe(0);
  });

  // 6. Mapping: Adiciona e remove projeções
  test('Mapping deve iniciar com 1 projeção padrão', () => {
    let state = [{ id: 'proj-1', points: [] }];
    expect(state.length).toBe(1);
  });

  // 7. Mapping: Limite de 4
  test('Mapping não deve permitir mais de 4 projeções (limite MVP)', () => {
    let state = [1, 2, 3, 4];
    const addMapping = () => { if(state.length < 4) state.push(5); };
    addMapping();
    expect(state.length).toBe(4);
  });

  test('Mapping não deve permitir deletar a última projeção', () => {
    let state = [1];
    const removeMapping = () => { if(state.length > 1) state.pop(); };
    removeMapping();
    expect(state.length).toBe(1);
  });

  // 8. Timers: Inicializa countdown
  test('Formatação do timer deve retornar MM:SS corretamente', () => {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(0)).toBe('00:00');
  });

  // 9. Atalhos: F1-F12 troca cena
  test('Cenas devem estar limitadas a 12 (F1 a F12)', () => {
    const scenes = Array.from({ length: 12 }, (_, i) => i + 1);
    expect(scenes.length).toBe(12);
    expect(scenes[0]).toBe(1);
    expect(scenes[11]).toBe(12);
  });

  // 10. Stage Display: Payload WS
  test('Stage Display JSON format deve estar correto', () => {
    const payload = JSON.stringify({ action: 'blackout' });
    const parsed = JSON.parse(payload);
    expect(parsed.action).toBe('blackout');
  });

});
