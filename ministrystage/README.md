# MinistryStage

**MinistryStage** — Sua apresentação ao vivo, perfeita a cada culto.

O MinistryStage é um aplicativo desktop ultra-rápido, criado especificamente para igrejas e eventos, focando na facilidade de uso por voluntários, sem abrir mão de recursos visuais impressionantes.

## 🌟 Funcionalidades Principais

- **Bíblia Rápida Offline**: 12 versões PT-BR com cache local via IndexedDB.
- **Letras de Músicas**: CRUD simples, busca rápida, sem complicação.
- **Stage Display Inteligente**: PWA nativa acessível via `http://[seu-ip]:3000/stage` para a equipe do altar (retorno de tela).
- **Projeção Flexível**: Mapeamento via Polygon Split em WebGL, até 4 fatias (sem warps complexos).
- **Playback Estável**: MPV embutido rodando nativamente no backend Rust.
- **Volunteer-Friendly**: Interface de navegação limpa (Dark Mode) com atalhos de teclado ágeis.

*Nota: Construído 100% sem dependências DMX ou bibliotecas de iluminação, mantendo o foco absoluto em estabilidade de projeção e texto.*

---

## 🚀 Como Iniciar (Desenvolvimento)

### Pré-requisitos
- Node.js 18+
- Rust & Cargo (Necessário para compilar o backend Tauri v2)
- MPV Player instalado no sistema (Adicionado ao PATH).

### Comandos Iniciais

Instale as dependências essenciais:
```bash
npm install
```

Inicie o modo de desenvolvimento com hot-reload (Vite + Tauri):
```bash
npm run dev
```

---

## 📦 Build e Instalação (Produção)

Para criar os instaladores nativos robustos para sua plataforma, utilize:

```bash
# Build otimizado do frontend (Opcional, o tauri já faz internamente)
npm run build

# Build do aplicativo nativo Desktop Tauri
cargo tauri build
```

**Local dos Instaladores (Tamanho enxuto <100MB):**
Após o término, os instaladores ficarão disponíveis em `src-tauri/target/release/bundle/`:
- **Windows**: `ministrystage_x64.msi`
- **Mac**: `ministrystage.dmg`
- **Linux**: `ministrystage_amd64.deb`

---

## ⌨️ Atalhos de Teclado Essenciais

Estes atalhos foram pensados para operação veloz durante o culto e uso contínuo da equipe técnica:

- **`F1` a `F12`**: Aciona as cenas (estrofes/refrões) da música atual.
- **`Esc`**: BLACKOUT IMEDIATO da tela.
- **`Ctrl + Space`**: Play / Pause do Vídeo Background.
- **`Ctrl + B`**: Alternar Painel da Bíblia (Mostrar/Ocultar instantaneamente).
- **`Ctrl + M`**: Abrir a interface do Stage Display (Retorno de Palco) no navegador.

---

## 🛠️ Troubleshooting (Solução de Problemas)

1. **Vídeo não reproduz ou nada acontece ao selecionar arquivo:**
   - O MinistryStage necessita que o executor `mpv` esteja instalado nativamente no sistema operacional e adicionado às variáveis de ambiente (`PATH`). 
2. **Stage Display não conecta em celulares da rede:**
   - Verifique o firewall do seu computador master e assegure-se de que ele permite conexões na porta TCP `8080` (WebSocket do Tauri) e TCP `3000` (Servidor de UI Vite).
3. **Músicas ou Versículos não salvam offline:**
   - Assegure-se que o navegador/webview local tem suporte ativo a permissões de armazenamento IndexedDB (habilitado por padrão no motor Wry/Tauri).

---
