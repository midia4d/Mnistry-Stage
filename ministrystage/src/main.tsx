import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { VideoPlayerProvider } from './context/VideoPlayerContext.tsx';
import { LyricsProvider } from './context/LyricsContext.tsx';
import { ProjectionProvider } from './context/ProjectionContext.tsx';
import { PreviewProvider } from './context/PreviewContext.tsx';
import { PublicProjection } from './components/PublicProjection.tsx';
import { StageDisplay } from './components/StageDisplay.tsx';
import { OutputMappingProvider } from './context/OutputMappingContext.tsx';
import './index.css';

const Router = () => {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (hash === '#/projection') {
    return <PublicProjection />;
  }

  if (hash === '#/stagedisplay') {
    return <StageDisplay />;
  }

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <VideoPlayerProvider>
      <LyricsProvider>
        <ProjectionProvider>
          <PreviewProvider>
            <OutputMappingProvider>
              <Router />
            </OutputMappingProvider>
          </PreviewProvider>
        </ProjectionProvider>
      </LyricsProvider>
    </VideoPlayerProvider>
  </React.StrictMode>
);
