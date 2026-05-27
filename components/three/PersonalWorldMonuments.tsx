import { useMemo } from 'react';
import type { Monument } from '../../services/personalWorldScene';

interface PersonalWorldMonumentsProps {
  monuments: Monument[];
}

const COLOR_BY_KIND: Record<string, string> = {
  mountain: '#0d9488',
  palm: '#22c55e',
  pagoda: '#f97316',
  lantern: '#fbbf24',
  paddyField: '#84cc16',
  cafeTable: '#06b6d4',
  riverBoat: '#0ea5e9',
  lighthouse: '#f59e0b',
  tree: '#16a34a',
};

export function PersonalWorldMonuments({ monuments }: PersonalWorldMonumentsProps) {
  const items = useMemo(() => monuments, [monuments]);
  return (
    <group>
      {items.map((m) => (
        <Monument3D key={m.id} monument={m} />
      ))}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial color="#0a1c2c" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Monument3D({ monument }: { monument: Monument }) {
  const color = COLOR_BY_KIND[monument.kind] ?? '#94a3b8';
  switch (monument.kind) {
    case 'mountain':
      return (
        <mesh position={monument.position} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <coneGeometry args={[0.55, 1.2, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'palm':
      return (
        <group position={monument.position} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1.1, 6]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <icosahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'pagoda':
      return (
        <group position={monument.position} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.7, 0.5, 0.7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <coneGeometry args={[0.55, 0.5, 4]} />
            <meshStandardMaterial color="#c2410c" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#fde68a" />
          </mesh>
        </group>
      );
    case 'lantern':
      return (
        <group position={monument.position} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial color={color} emissive="#f59e0b" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      );
    case 'paddyField':
      return (
        <mesh position={monument.position} rotation={[-Math.PI / 2, 0, monument.rotation]} scale={monument.scale}>
          <planeGeometry args={[0.9, 0.9, 4, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'cafeTable':
      return (
        <group position={monument.position} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.05, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      );
    case 'riverBoat':
      return (
        <mesh position={[monument.position[0], 0.1, monument.position[2]]} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <boxGeometry args={[1.2, 0.15, 0.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'lighthouse':
      return (
        <group position={monument.position} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.15, 0.22, 1.2, 12]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
        </group>
      );
    case 'tree':
    default:
      return (
        <group position={monument.position} rotation={[0, monument.rotation, 0]} scale={monument.scale}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
            <meshStandardMaterial color="#7c2d12" />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <icosahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
  }
}
