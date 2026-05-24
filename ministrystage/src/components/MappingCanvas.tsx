import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useMapping } from '../hooks/useMapping';
import { Layers } from 'lucide-react';

export const MappingCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { mappings, addMapping, removeMapping } = useMapping();

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    
    // Evita duplicar canvas no hot-reload do React
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    const materials = [
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.6 }), // Blue
      new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.6 }), // Green
      new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true, transparent: true, opacity: 0.6 }), // Red
      new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.6 }), // Purple
    ];

    mappings.forEach((mapping, index) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        mapping.points[0].x, mapping.points[0].y, 0.0,
        mapping.points[1].x, mapping.points[1].y, 0.0,
        mapping.points[2].x, mapping.points[2].y, 0.0,
        
        mapping.points[0].x, mapping.points[0].y, 0.0,
        mapping.points[2].x, mapping.points[2].y, 0.0,
        mapping.points[3].x, mapping.points[3].y, 0.0,
      ]);

      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      const mesh = new THREE.Mesh(geometry, materials[index % materials.length]);
      scene.add(mesh);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
    };
  }, [mappings]);

  return (
    <div className="bg-panel rounded-lg p-4 shadow-md mb-4 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Layers className="text-accent" size={24} /> Polygon Mapping
        </h2>
      </div>
      
      <div ref={mountRef} className="w-full rounded-md overflow-hidden border border-gray-700 bg-background" />
      
      <div className="flex gap-2 mt-4 justify-between">
        <div className="flex gap-2">
          <button onClick={addMapping} className="bg-gray-700 hover:bg-gray-600 text-primary px-4 py-2 rounded-md transition-colors text-sm font-medium">
            + Adicionar Projeção
          </button>
          <button onClick={() => mappings.length > 1 && removeMapping(mappings[mappings.length - 1].id)} className="bg-gray-700 hover:bg-gray-600 text-primary px-4 py-2 rounded-md transition-colors text-sm font-medium">
            - Remover
          </button>
        </div>
        <button className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium">
          Salvar Mapeamento
        </button>
      </div>
    </div>
  );
};
