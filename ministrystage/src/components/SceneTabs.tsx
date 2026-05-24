import React from 'react';

interface SceneTabsProps {
  activeScene: number;
  onSceneChange: (scene: number) => void;
}

export const SceneTabs: React.FC<SceneTabsProps> = ({ activeScene, onSceneChange }) => {
  const scenes = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
      {scenes.map(scene => {
        const isActive = scene === activeScene;
        return (
          <button
            key={scene}
            onClick={() => onSceneChange(scene)}
            className={`ms-scene-tab shrink-0 ${isActive ? 'active' : ''}`}
          >
            <span
              className="text-[9px] font-bold px-1 py-0 rounded"
              style={{
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? 'var(--ms-text-2)' : 'var(--ms-text-4)',
              }}
            >
              F{scene}
            </span>
          </button>
        );
      })}
    </div>
  );
};
