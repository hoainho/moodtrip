import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Float, GradientTexture, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BackSide, AdditiveBlending, ACESFilmicToneMapping } from 'three';
import { PersonalWorldMonuments } from './PersonalWorldMonuments';
import { useReducedMotion, PauseOnHidden, RenderCountProbe } from './sceneHelpers';
import { treeGrowth, type Monument } from '../../services/personalWorldScene';

interface PersonalWorldCanvasProps {
  monuments: Monument[];
  ringRadius: number;
  tripCount: number;
}

export default function PersonalWorldCanvas({ monuments, ringRadius, tripCount, onContextLost, onSelectMonument, selectedMonumentId }: PersonalWorldCanvasProps & { onContextLost?: () => void; onSelectMonument?: (id: string) => void; selectedMonumentId?: string | null }) {
  const reduce = useReducedMotion();
  const camDist = ringRadius * 1.85 + 2;

  return (
    <Canvas
      camera={{ position: [camDist, camDist * 0.62, camDist], fov: 48 }}
      gl={{ antialias: true, alpha: false, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      dpr={[1, 1.8]}
      style={{ background: '#04060c' }}
      onPointerMissed={() => onSelectMonument?.('')}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true },
        );
      }}
    >
      <PauseOnHidden />
      <RenderCountProbe />
      {/* Gradient sky dome */}
      <mesh scale={260}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial side={BackSide}>
          <GradientTexture stops={[0, 0.5, 1]} colors={['#10243f', '#0a1626', '#02040a']} size={1024} />
        </meshBasicMaterial>
      </mesh>
      <fog attach="fog" args={['#0a1626', 16, 52]} />

      <ambientLight intensity={0.32} color="#1e3a5f" />
      <directionalLight position={[12, 18, 8]} intensity={1.05} color="#ffe9c7" />
      {/* warm hearth from the island centre (replaces the old saturated-cyan fill) */}
      <pointLight position={[0, 0.6, 0]} color="#f59e0b" intensity={0.5} distance={ringRadius * 1.8 + 4} />
      <directionalLight position={[-9, 5, -7]} intensity={0.22} color="#1e3a5f" />

      <Stars radius={150} depth={75} count={3500} factor={3.4} fade speed={reduce ? 0 : 0.4} />
      <Sparkles
        count={70}
        scale={[ringRadius * 2.8, 8, ringRadius * 2.8]}
        position={[0, 2.5, 0]}
        size={2.6}
        speed={reduce ? 0 : 0.3}
        color="#7dd3fc"
        opacity={0.7}
      />

      <Float speed={reduce ? 0 : 0.7} rotationIntensity={0} floatIntensity={reduce ? 0 : 0.55} floatingRange={[-0.15, 0.15]}>
        <Island radius={ringRadius} />
        <JourneyArcs monuments={monuments} />
        <LifeTree tripCount={tripCount} reduce={reduce} onSelect={onSelectMonument} selected={selectedMonumentId === '__tree__'} />
        <PersonalWorldMonuments monuments={monuments} reduceMotion={reduce} onSelect={onSelectMonument} selectedId={selectedMonumentId} />
      </Float>

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={4}
        maxDistance={ringRadius * 3.5 + 4}
        autoRotate={!reduce}
        autoRotateSpeed={0.5}
        enableDamping
      />

      {/* Bloom turns the emissive lantern/tree/rim into real light halos (vs flat chalk). */}
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.4} intensity={1.1} />
      </EffectComposer>
    </Canvas>
  );
}

function Island({ radius }: { radius: number }) {
  const r = radius + 1.6;
  return (
    <group>
      {/* soft under-glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <circleGeometry args={[r + 3.5, 64]} />
        <meshBasicMaterial color="#0d9488" transparent opacity={0.14} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* island body — tapered disc */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[r, r - 1.4, 1.1, 72]} />
        <meshStandardMaterial color="#0c2230" roughness={0.85} metalness={0.15} />
      </mesh>
      {/* top surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[r, 72]} />
        <meshStandardMaterial color="#0f2c3a" emissive="#0d9488" emissiveIntensity={0.07} roughness={0.75} />
      </mesh>
      {/* glowing rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[r - 0.12, r + 0.06, 72]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function JourneyArcs({ monuments }: { monuments: Monument[] }) {
  const arcs = useMemo(
    () =>
      monuments.map((m) => {
        const [x, , z] = m.position;
        const mid: [number, number, number] = [x * 0.5, 0.9, z * 0.5];
        return { id: m.id, points: [[0, 0.4, 0], mid, [x, 0.12, z]] as [number, number, number][] };
      }),
    [monuments],
  );
  return (
    <group>
      {arcs.map((a) => (
        <Line key={a.id} points={a.points} color="#22d3ee" lineWidth={1.6} transparent opacity={0.5} />
      ))}
    </group>
  );
}

// Foliage clusters revealed one-per-stage as the tree levels up (index 0 first).
const TREE_CLUSTERS: { pos: [number, number, number]; r: number; c: string; e: string }[] = [
  { pos: [0, 1.85, 0], r: 0.6, c: '#10b981', e: '#34d399' },
  { pos: [0.42, 1.55, 0.1], r: 0.4, c: '#34d399', e: '#34d399' },
  { pos: [-0.4, 1.5, -0.15], r: 0.38, c: '#2dd4bf', e: '#2dd4bf' },
  { pos: [0.12, 2.18, -0.08], r: 0.34, c: '#34d399', e: '#34d399' },
  { pos: [-0.22, 1.95, 0.26], r: 0.3, c: '#10b981', e: '#34d399' },
];

function LifeTree({ tripCount, reduce, onSelect, selected }: { tripCount: number; reduce: boolean; onSelect?: (id: string) => void; selected?: boolean }) {
  const growth = treeGrowth(tripCount);
  const g = growth.progress; // 0..1 toward 10 trips
  const s = 0.55 + g * 1.25; // overall size: small seed → full canopy at 10 trips
  const foliageCount = growth.level; // 0..5 clusters, one per stage

  return (
    <group position={[0, 0, 0]} scale={s}>
      {/* Click/hover target — tap the tree to see its growth progress. */}
      <mesh
        position={[0, 1.2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect?.('__tree__'); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[0.95, 0.95, 2.6, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[1.05, 1.32, 48]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.95} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      <pointLight position={[0, 1.6, 0]} color="#34d399" intensity={0.5 + g * 1.1} distance={7} />
      {/* trunk */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.13, 0.22, 1.6, 8]} />
        <meshStandardMaterial color="#6b4423" roughness={0.8} />
      </mesh>

      {/* Earliest stage: a single bud at the trunk top. */}
      {foliageCount === 0 && (
        <mesh position={[0, 1.75, 0]}>
          <icosahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.6} roughness={0.45} />
        </mesh>
      )}

      {/* Foliage clusters appear one per growth stage. */}
      {TREE_CLUSTERS.slice(0, foliageCount).map((c, i) => (
        <mesh key={i} position={c.pos}>
          <icosahedronGeometry args={[c.r, 0]} />
          <meshStandardMaterial color={c.c} emissive={c.e} emissiveIntensity={0.42} roughness={0.45} />
        </mesh>
      ))}

      {/* base glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.0, 48]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.16 + g * 0.2} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <Sparkles count={Math.round(8 + g * 22)} scale={[1.8, 2.4, 1.8]} position={[0, 1.7, 0]} size={3} color="#a7f3d0" speed={reduce ? 0 : 0.4} />
    </group>
  );
}
