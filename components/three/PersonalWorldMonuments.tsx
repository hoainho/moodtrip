import { Float, Html } from '@react-three/drei';
import { AdditiveBlending, DoubleSide } from 'three';
import type { Monument } from '../../services/personalWorldScene';

interface PersonalWorldMonumentsProps {
  monuments: Monument[];
  reduceMotion?: boolean;
}

const ACCENT_BY_KIND: Record<string, string> = {
  mountain: '#2dd4bf',
  palm: '#22c55e',
  pagoda: '#fb923c',
  lantern: '#fbbf24',
  paddyField: '#a3e635',
  cafeTable: '#22d3ee',
  riverBoat: '#38bdf8',
  lighthouse: '#fbbf24',
  tree: '#34d399',
};

export function PersonalWorldMonuments({ monuments, reduceMotion }: PersonalWorldMonumentsProps) {
  return (
    <group>
      {monuments.map((m) => (
        <MonumentNode key={m.id} monument={m} reduceMotion={reduceMotion} />
      ))}
    </group>
  );
}

function MonumentNode({ monument, reduceMotion }: { monument: Monument; reduceMotion?: boolean }) {
  const accent = ACCENT_BY_KIND[monument.kind] ?? '#94a3b8';
  const labelY = 1.5 * monument.scale + 0.55;

  return (
    <group position={monument.position}>
      {/* grassy mound the model sits on */}
      <mesh position={[0, 0.04, 0]} scale={[monument.scale, 0.45 * monument.scale, monument.scale]}>
        <sphereGeometry args={[0.58, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#16433a" flatShading roughness={0.95} />
      </mesh>
      {/* glowing base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.58 * monument.scale, 0.66 * monument.scale, 40]} />
        <meshBasicMaterial color={accent} transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} />
      </mesh>

      <Float speed={reduceMotion ? 0 : 1.2} rotationIntensity={0} floatIntensity={reduceMotion ? 0 : 0.4} floatingRange={[0, 0.14]}>
        <group rotation={[0, monument.rotation, 0]} scale={monument.scale} position={[0, 0.08, 0]}>
          <MonumentModel kind={monument.kind} accent={accent} />
        </group>
      </Float>

      <Html position={[0, labelY, 0]} center distanceFactor={9} zIndexRange={[20, 0]} occlude={false}>
        <div
          style={{ pointerEvents: 'none' }}
          className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white/95 bg-black/45 border border-white/20 whitespace-nowrap backdrop-blur-sm shadow-lg"
        >
          {monument.destinationLabel}
        </div>
      </Html>
    </group>
  );
}

function MonumentModel({ kind, accent }: { kind: string; accent: string }) {
  switch (kind) {
    case 'mountain':
      return (
        <group>
          {/* back peak */}
          <mesh position={[0.34, 0.5, -0.12]} rotation={[0, 0.5, 0]}>
            <coneGeometry args={[0.4, 0.95, 5]} />
            <meshStandardMaterial color="#155e57" flatShading roughness={0.85} />
          </mesh>
          {/* main peak */}
          <mesh position={[0, 0.65, 0.05]}>
            <coneGeometry args={[0.62, 1.3, 6]} />
            <meshStandardMaterial color="#1f8a80" flatShading roughness={0.8} />
          </mesh>
          {/* snow cap */}
          <mesh position={[0, 1.18, 0.05]}>
            <coneGeometry args={[0.26, 0.42, 6]} />
            <meshStandardMaterial color="#f1f7ff" flatShading roughness={0.5} />
          </mesh>
        </group>
      );

    case 'tree':
      return (
        <group>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.56, 6]} />
            <meshStandardMaterial color="#6b3f1d" flatShading roughness={0.9} />
          </mesh>
          {[
            { y: 0.62, r: 0.5, h: 0.55 },
            { y: 0.98, r: 0.38, h: 0.46 },
            { y: 1.28, r: 0.24, h: 0.38 },
          ].map((c, i) => (
            <mesh key={i} position={[0, c.y, 0]}>
              <coneGeometry args={[c.r, c.h, 7]} />
              <meshStandardMaterial color={i === 2 ? '#34d399' : '#10b981'} emissive={accent} emissiveIntensity={0.12} flatShading roughness={0.6} />
            </mesh>
          ))}
        </group>
      );

    case 'palm':
      return (
        <group>
          {/* curved trunk */}
          {[
            { y: 0.18, x: 0, rot: 0.0, r: 0.09 },
            { y: 0.5, x: 0.05, rot: 0.12, r: 0.075 },
            { y: 0.82, x: 0.14, rot: 0.26, r: 0.06 },
          ].map((s, i) => (
            <mesh key={i} position={[s.x, s.y, 0]} rotation={[0, 0, -s.rot]}>
              <cylinderGeometry args={[s.r, s.r + 0.02, 0.34, 6]} />
              <meshStandardMaterial color="#a16207" flatShading roughness={0.85} />
            </mesh>
          ))}
          {/* fronds */}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[0.22 + Math.cos(a) * 0.18, 1.02, Math.sin(a) * 0.18]} rotation={[Math.PI / 2.4, a, 0]}>
                <coneGeometry args={[0.1, 0.6, 4]} />
                <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} flatShading roughness={0.6} side={DoubleSide} />
              </mesh>
            );
          })}
          {/* coconuts */}
          <mesh position={[0.2, 0.96, 0.06]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#3f2d15" flatShading /></mesh>
        </group>
      );

    case 'pagoda':
      return (
        <group>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.62, 0.36, 0.62]} />
            <meshStandardMaterial color="#9a3412" flatShading roughness={0.7} />
          </mesh>
          {[
            { y: 0.42, r: 0.62, h: 0.26 },
            { y: 0.66, r: 0.5, h: 0.24 },
            { y: 0.88, r: 0.36, h: 0.22 },
          ].map((t, i) => (
            <group key={i}>
              {i > 0 && (
                <mesh position={[0, t.y - 0.06, 0]}>
                  <boxGeometry args={[t.r * 0.62, 0.14, t.r * 0.62]} />
                  <meshStandardMaterial color="#7c2d12" flatShading />
                </mesh>
              )}
              <mesh position={[0, t.y + 0.06, 0]}>
                <coneGeometry args={[t.r, t.h, 4]} />
                <meshStandardMaterial color={accent} flatShading roughness={0.6} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 1.08, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.9} />
          </mesh>
        </group>
      );

    case 'lantern':
      return (
        <group>
          {/* string */}
          <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.012, 0.012, 0.5, 4]} /><meshStandardMaterial color="#475569" /></mesh>
          {/* caps */}
          <mesh position={[0, 0.92, 0]}><cylinderGeometry args={[0.12, 0.08, 0.08, 10]} /><meshStandardMaterial color="#b91c1c" flatShading /></mesh>
          {/* body — elongated glowing silk */}
          <mesh position={[0, 0.62, 0]} scale={[1, 1.35, 1]}>
            <sphereGeometry args={[0.27, 14, 12]} />
            <meshStandardMaterial color="#f87171" emissive="#f59e0b" emissiveIntensity={1.2} roughness={0.35} flatShading />
          </mesh>
          {/* bottom cap + tassel */}
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.08, 0.11, 0.07, 10]} /><meshStandardMaterial color="#b91c1c" flatShading /></mesh>
          <mesh position={[0, 0.2, 0]}><coneGeometry args={[0.05, 0.14, 6]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} /></mesh>
          <pointLight position={[0, 0.62, 0]} color="#f59e0b" intensity={0.6} distance={2.6} />
        </group>
      );

    case 'paddyField':
      return (
        <group>
          {[
            { y: 0.06, r: 0.6, c: '#3f6212' },
            { y: 0.16, r: 0.46, c: '#65a30d' },
            { y: 0.26, r: 0.32, c: '#84cc16' },
          ].map((s, i) => (
            <mesh key={i} position={[0, s.y, 0]}>
              <cylinderGeometry args={[s.r, s.r + 0.03, 0.12, 18]} />
              <meshStandardMaterial color={s.c} emissive={i === 2 ? accent : '#000000'} emissiveIntensity={i === 2 ? 0.25 : 0} flatShading roughness={0.7} />
            </mesh>
          ))}
        </group>
      );

    case 'cafeTable':
      return (
        <group>
          {/* parasol */}
          <mesh position={[0, 0.78, 0]}><coneGeometry args={[0.42, 0.3, 10]} /><meshStandardMaterial color="#f97316" flatShading roughness={0.6} /></mesh>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.02, 0.02, 0.7, 6]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
          {/* table */}
          <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.3, 0.3, 0.05, 18]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.15} flatShading metalness={0.2} roughness={0.4} /></mesh>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.035, 0.05, 0.4, 8]} /><meshStandardMaterial color="#334155" flatShading /></mesh>
          {/* two stools */}
          {[-0.34, 0.34].map((x, i) => (
            <mesh key={i} position={[x, 0.2, 0.05]}><cylinderGeometry args={[0.1, 0.1, 0.18, 12]} /><meshStandardMaterial color="#0e7490" flatShading /></mesh>
          ))}
          {/* cup */}
          <mesh position={[0.1, 0.47, 0.05]}><cylinderGeometry args={[0.04, 0.035, 0.06, 10]} /><meshStandardMaterial color="#f8fafc" flatShading /></mesh>
        </group>
      );

    case 'riverBoat':
      return (
        <group position={[0, 0.06, 0]}>
          {/* hull */}
          <mesh position={[0, 0.12, 0]}><boxGeometry args={[1.05, 0.18, 0.4]} /><meshStandardMaterial color="#a16207" flatShading roughness={0.75} /></mesh>
          {/* upturned bow & stern */}
          <mesh position={[0.56, 0.2, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.2, 0.34, 4]} /><meshStandardMaterial color="#854d0e" flatShading /></mesh>
          <mesh position={[-0.56, 0.2, 0]} rotation={[0, 0, -0.5]}><coneGeometry args={[0.2, 0.34, 4]} /><meshStandardMaterial color="#854d0e" flatShading /></mesh>
          {/* arched roof */}
          <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.55, 12, 1, true, 0, Math.PI]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.15} flatShading side={DoubleSide} roughness={0.6} />
          </mesh>
        </group>
      );

    case 'lighthouse':
      return (
        <group>
          {/* striped tower */}
          {[
            { y: 0.2, r0: 0.26, r1: 0.22, c: '#f8fafc' },
            { y: 0.5, r0: 0.22, r1: 0.18, c: '#dc2626' },
            { y: 0.78, r0: 0.18, r1: 0.15, c: '#f8fafc' },
          ].map((s, i) => (
            <mesh key={i} position={[0, s.y, 0]}><cylinderGeometry args={[s.r1, s.r0, 0.3, 14]} /><meshStandardMaterial color={s.c} flatShading roughness={0.6} /></mesh>
          ))}
          {/* gallery ring */}
          <mesh position={[0, 0.95, 0]}><torusGeometry args={[0.18, 0.025, 8, 16]} /><meshStandardMaterial color="#334155" flatShading /></mesh>
          {/* lamp room */}
          <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.13, 0.13, 0.16, 12]} /><meshStandardMaterial color="#0f172a" flatShading /></mesh>
          <mesh position={[0, 1.05, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} /></mesh>
          {/* roof */}
          <mesh position={[0, 1.2, 0]}><coneGeometry args={[0.16, 0.18, 12]} /><meshStandardMaterial color="#dc2626" flatShading /></mesh>
          {/* light beam */}
          <mesh position={[0.55, 1.05, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.32, 1.1, 16, 1, true]} />
            <meshBasicMaterial color={accent} transparent opacity={0.12} blending={AdditiveBlending} side={DoubleSide} depthWrite={false} />
          </mesh>
          <pointLight position={[0, 1.05, 0]} color={accent} intensity={0.7} distance={3.2} />
        </group>
      );

    default:
      return (
        <group>
          <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.08, 0.12, 0.56, 6]} /><meshStandardMaterial color="#6b3f1d" flatShading /></mesh>
          <mesh position={[0, 0.8, 0]}><icosahedronGeometry args={[0.4, 0]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.15} flatShading /></mesh>
        </group>
      );
  }
}
