import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { PersonalWorldMonuments } from './PersonalWorldMonuments';
import type { Monument } from '../../services/personalWorldScene';

interface PersonalWorldCanvasProps {
  monuments: Monument[];
  ringRadius: number;
}

export default function PersonalWorldCanvas({ monuments, ringRadius }: PersonalWorldCanvasProps) {
  const camDist = ringRadius * 1.8;
  return (
    <Canvas
      camera={{ position: [camDist, camDist * 0.7, camDist], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#04060c' }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 12, 6]} intensity={0.9} castShadow={false} />
      <Stars radius={120} depth={60} count={3000} factor={3} fade speed={0.3} />
      <PersonalWorldMonuments monuments={monuments} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={ringRadius * 3}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}
