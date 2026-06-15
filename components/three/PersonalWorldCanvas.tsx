import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Float, GradientTexture, Line } from '@react-three/drei';
import { BackSide, AdditiveBlending } from 'three';
import { PersonalWorldMonuments } from './PersonalWorldMonuments';
import type { Monument } from '../../services/personalWorldScene';

interface PersonalWorldCanvasProps {
  monuments: Monument[];
  ringRadius: number;
  tripCount: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PersonalWorldCanvas({ monuments, ringRadius, tripCount }: PersonalWorldCanvasProps) {
  const [reduce] = useState(prefersReducedMotion);
  const camDist = ringRadius * 1.85 + 2;

  return (
    <Canvas
      camera={{ position: [camDist, camDist * 0.62, camDist], fov: 48 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.8]}
      style={{ background: '#04060c' }}
    >
      {/* Gradient sky dome */}
      <mesh scale={260}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial side={BackSide}>
          <GradientTexture stops={[0, 0.5, 1]} colors={['#10243f', '#0a1626', '#02040a']} size={1024} />
        </meshBasicMaterial>
      </mesh>
      <fog attach="fog" args={['#0a1626', 16, 52]} />

      <ambientLight intensity={0.42} />
      <directionalLight position={[12, 18, 8]} intensity={1.05} color="#ffe9c7" />
      <directionalLight position={[-9, 5, -7]} intensity={0.45} color="#38bdf8" />

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

      <Float speed={reduce ? 0 : 0.7} rotationIntensity={0} floatIntensity={reduce ? 0 : 0.55} floatingRange={[0, 0.3]}>
        <Island radius={ringRadius} />
        <JourneyArcs monuments={monuments} />
        <LifeTree tripCount={tripCount} reduce={reduce} />
        <PersonalWorldMonuments monuments={monuments} reduceMotion={reduce} />
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
        <Line key={a.id} points={a.points} color="#22d3ee" lineWidth={1} transparent opacity={0.22} />
      ))}
    </group>
  );
}

function LifeTree({ tripCount, reduce }: { tripCount: number; reduce: boolean }) {
  const s = 0.7 + (Math.min(tripCount, 25) / 25) * 1.15;
  return (
    <group position={[0, 0, 0]} scale={s}>
      <pointLight position={[0, 1.6, 0]} color="#34d399" intensity={1.3} distance={7} />
      {/* trunk */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.13, 0.22, 1.6, 8]} />
        <meshStandardMaterial color="#6b4423" roughness={0.8} />
      </mesh>
      {/* foliage clusters */}
      <mesh position={[0, 1.85, 0]}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#10b981" emissive="#34d399" emissiveIntensity={0.45} roughness={0.45} />
      </mesh>
      <mesh position={[0.42, 1.55, 0.1]}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[-0.4, 1.5, -0.15]}>
        <icosahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.4} roughness={0.45} />
      </mesh>
      {/* base glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.0, 48]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <Sparkles count={26} scale={[1.8, 2.4, 1.8]} position={[0, 1.7, 0]} size={3} color="#a7f3d0" speed={reduce ? 0 : 0.4} />
    </group>
  );
}
