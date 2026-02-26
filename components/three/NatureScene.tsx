import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, MeshReflectorMaterial, AdaptiveDpr } from '@react-three/drei';

// ─── Inline simplex noise (2D) ───────────────────────────────────────────────
const GRAD3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
];

function buildPermTable(seed: number) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807 + 0) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
}

const PERM = buildPermTable(42);

function noise2D(x: number, y: number): number {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;
  const ii = i & 255;
  const jj = j & 255;
  let n0 = 0, n1 = 0, n2 = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    const gi0 = PERM[ii + PERM[jj]] % 12;
    n0 = t0 * t0 * (GRAD3[gi0][0] * x0 + GRAD3[gi0][1] * y0);
  }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    const gi1 = PERM[ii + i1 + PERM[jj + j1]] % 12;
    n1 = t1 * t1 * (GRAD3[gi1][0] * x1 + GRAD3[gi1][1] * y1);
  }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    const gi2 = PERM[ii + 1 + PERM[jj + 1]] % 12;
    n2 = t2 * t2 * (GRAD3[gi2][0] * x2 + GRAD3[gi2][1] * y2);
  }
  return 70 * (n0 + n1 + n2);
}

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / max;
}

// ─── Time-of-day color system ─────────────────────────────────────────────────
// Custom gradient sky sphere — 5-point vertical gradient for natural realism.
// Inspired by real atmospheric scattering and landscape photography.

interface SkyColors {
  zenith: string;      // highest point — deepest color
  midSky: string;      // upper sky — transition zone
  horizon: string;     // horizon band — warmest/lightest
  lowHorizon: string;  // just below horizon — warm glow fade
  nadir: string;       // ground reflection tint
  fogColor: string;
  daylight: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpHex(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  ca.lerp(cb, Math.max(0, Math.min(1, t)));
  return '#' + ca.getHexString();
}

function blendSky(a: SkyColors, b: SkyColors, t: number): SkyColors {
  return {
    zenith:     lerpHex(a.zenith, b.zenith, t),
    midSky:     lerpHex(a.midSky, b.midSky, t),
    horizon:    lerpHex(a.horizon, b.horizon, t),
    lowHorizon: lerpHex(a.lowHorizon, b.lowHorizon, t),
    nadir:      lerpHex(a.nadir, b.nadir, t),
    fogColor:   lerpHex(a.fogColor, b.fogColor, t),
    daylight:   lerp(a.daylight, b.daylight, t),
  };
}

// ─── Natural sky palettes (soft, realistic, human) ────────────────────────
const SKY_NIGHT: SkyColors = {
  zenith: '#0a0e1a',      // deep space navy, not pure black
  midSky: '#0f1629',      // subtle blue-grey hint
  horizon: '#1a2038',     // faint blue glow at horizon
  lowHorizon: '#0f1420',  // muted dark
  nadir: '#080c14',       // deep dark
  fogColor: '#0c1020',
  daylight: 0,
};

const SKY_DAWN: SkyColors = {
  zenith: '#2a3a5e',      // steel blue, still cool at top
  midSky: '#5a6f8e',      // soft dusty blue
  horizon: '#e8c4a0',     // warm peach — soft, not harsh orange
  lowHorizon: '#c4967a',  // muted terracotta
  nadir: '#6b5a4e',       // earthy brown-grey
  fogColor: '#c4a886',
  daylight: 0.35,
};

const SKY_MORNING: SkyColors = {
  zenith: '#3a7abf',      // clear cerulean blue
  midSky: '#6ba3d6',      // soft sky blue
  horizon: '#b8d8ec',     // pale blue-white, airy
  lowHorizon: '#9cbfad',  // sage green-blue haze
  nadir: '#5e8a6e',       // soft green earth tint
  fogColor: '#a8cce0',
  daylight: 0.85,
};

const SKY_MIDDAY: SkyColors = {
  zenith: '#2468a8',      // rich cerulean — not electric
  midSky: '#5a9fd4',      // calm blue
  horizon: '#c0dce8',     // pale misty blue-white
  lowHorizon: '#98beab',  // soft sage haze
  nadir: '#5a7e68',       // muted green
  fogColor: '#b4d4e4',
  daylight: 1,
};

const SKY_AFTERNOON: SkyColors = {
  zenith: '#2c5e9e',      // slightly warmer blue
  midSky: '#6a96c4',      // golden-touched blue
  horizon: '#d4c4a8',     // warm cream-gold haze
  lowHorizon: '#a8946e',  // warm khaki
  nadir: '#6e6048',       // earthy warm
  fogColor: '#c4b898',
  daylight: 0.9,
};

const SKY_GOLDEN: SkyColors = {
  zenith: '#3a5a8a',      // deepening blue
  midSky: '#8a7ea0',      // lavender-blue transition
  horizon: '#e8b88a',     // soft golden peach
  lowHorizon: '#c49068',  // warm amber
  nadir: '#5e4a38',       // warm earth shadow
  fogColor: '#d4a880',
  daylight: 0.7,
};

const SKY_SUNSET: SkyColors = {
  zenith: '#28304e',      // deep twilight blue
  midSky: '#6e5a7e',      // dusty lavender
  horizon: '#e8967a',     // soft salmon-rose — NOT harsh red
  lowHorizon: '#b06850',  // warm terracotta
  nadir: '#3e2a24',       // dark earth
  fogColor: '#9a7068',
  daylight: 0.35,
};

const SKY_DUSK: SkyColors = {
  zenith: '#141828',      // approaching night
  midSky: '#2e2840',      // deep purple-grey
  horizon: '#8a5a5e',     // fading rose-mauve
  lowHorizon: '#4e3438',  // muted plum
  nadir: '#1a1418',       // near-black warm
  fogColor: '#3a2a30',
  daylight: 0.1,
};

function getSkyColors(): SkyColors {
  // DEV: override with ?hour=14 in URL to test any time of day
  const urlHour = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('hour') : null;
  const hour = urlHour !== null ? parseFloat(urlHour) : new Date().getHours() + new Date().getMinutes() / 60;

  // Smooth blending between named palette keyframes
  if (hour >= 22 || hour < 4.5)  return SKY_NIGHT;
  if (hour < 5.5)  return blendSky(SKY_NIGHT, SKY_DAWN,      (hour - 4.5) / 1);
  if (hour < 7)    return blendSky(SKY_DAWN, SKY_MORNING,     (hour - 5.5) / 1.5);
  if (hour < 9)    return blendSky(SKY_MORNING, SKY_MIDDAY,   (hour - 7) / 2);
  if (hour < 14.5) return SKY_MIDDAY;
  if (hour < 16)   return blendSky(SKY_MIDDAY, SKY_AFTERNOON, (hour - 14.5) / 1.5);
  if (hour < 17.5) return blendSky(SKY_AFTERNOON, SKY_GOLDEN, (hour - 16) / 1.5);
  if (hour < 19)   return blendSky(SKY_GOLDEN, SKY_SUNSET,    (hour - 17.5) / 1.5);
  if (hour < 20.5) return blendSky(SKY_SUNSET, SKY_DUSK,      (hour - 19) / 1.5);
  return blendSky(SKY_DUSK, SKY_NIGHT, (hour - 20.5) / 1.5);
}

function lerpColor(a: string, b: string, t: number): THREE.Color {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
}

// ─── Gradient Sky Sphere (5-point) ──────────────────────────────────────────
// Smooth sphere rendered from INSIDE. 5-point gradient: zenith → midSky →
// horizon → lowHorizon → nadir. Uses smoothstep for natural falloff.

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMidSky;
  uniform vec3 uHorizon;
  uniform vec3 uLowHorizon;
  uniform vec3 uNadir;
  varying vec3 vWorldPosition;

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float y = dir.y;

    vec3 color;
    if (y > 0.35) {
      // Upper sky: midSky → zenith
      float t = smoothstep(0.35, 0.95, y);
      color = mix(uMidSky, uZenith, t);
    } else if (y > 0.0) {
      // Lower sky: horizon → midSky (wider band for that airy feel)
      float t = smoothstep(0.0, 0.35, y);
      color = mix(uHorizon, uMidSky, t);
    } else if (y > -0.25) {
      // Just below horizon: lowHorizon → horizon (warm glow band)
      float t = smoothstep(-0.25, 0.0, y);
      color = mix(uLowHorizon, uHorizon, t);
    } else {
      // Ground: nadir → lowHorizon
      float t = smoothstep(-0.8, -0.25, y);
      color = mix(uNadir, uLowHorizon, t);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

function GradientSkySphere({ zenith, midSky, horizon, lowHorizon, nadir }: {
  zenith: string; midSky: string; horizon: string; lowHorizon: string; nadir: string;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uZenith:     { value: new THREE.Color(zenith) },
    uMidSky:     { value: new THREE.Color(midSky) },
    uHorizon:    { value: new THREE.Color(horizon) },
    uLowHorizon: { value: new THREE.Color(lowHorizon) },
    uNadir:      { value: new THREE.Color(nadir) },
  }), []);

  // Smooth interpolation every frame for gentle transitions
  useFrame(() => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uZenith.value.lerp(new THREE.Color(zenith), 0.015);
    u.uMidSky.value.lerp(new THREE.Color(midSky), 0.015);
    u.uHorizon.value.lerp(new THREE.Color(horizon), 0.015);
    u.uLowHorizon.value.lerp(new THREE.Color(lowHorizon), 0.015);
    u.uNadir.value.lerp(new THREE.Color(nadir), 0.015);
  });

  return (
    <mesh>
      <sphereGeometry args={[500, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
// ─── Camera Rig: slow orbit + mouse parallax ────────────────────────────────
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const angle = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame((_, delta) => {
    angle.current += delta * 0.03;
    const radius = 22;
    const baseX = Math.sin(angle.current) * radius;
    const baseZ = Math.cos(angle.current) * radius;
    const baseY = 7;

    const parallaxX = mouse.current.x * 3;
    const parallaxY = -mouse.current.y * 1.5;

    camera.position.x += (baseX + parallaxX - camera.position.x) * 0.02;
    camera.position.y += (baseY + parallaxY - camera.position.y) * 0.02;
    camera.position.z += (baseZ - camera.position.z) * 0.02;
    camera.lookAt(0, 1, 0);
  });

  return null;
}

// ─── Procedural Mountain Terrain ─────────────────────────────────────────────
function TerrainMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(50, 50, 128, 128);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const snowColor = new THREE.Color('#f0f5ff');
    const rockColor = new THREE.Color('#8b7355');
    const grassColor = new THREE.Color('#4a9e3f');
    const meadowColor = new THREE.Color('#6abf5e');
    const baseColor = new THREE.Color('#3d7a35');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);

      let height = fbm(x * 0.06, z * 0.06, 6) * 8;
      const ridge = Math.abs(fbm(x * 0.04 + 5, z * 0.04 + 5, 4));
      height += ridge * 5;

      const distFromCenter = Math.sqrt(x * x + z * z) / 25;
      const edgeFade = Math.max(0, 1 - distFromCenter * 0.6);
      height *= edgeFade;

      if (height < 0.3) height = Math.min(height, -0.2);

      pos.setZ(i, height);

      const c = new THREE.Color();
      if (height > 7) {
        c.copy(snowColor);
      } else if (height > 5) {
        c.lerpColors(rockColor, snowColor, (height - 5) / 2);
      } else if (height > 3) {
        c.lerpColors(grassColor, rockColor, (height - 3) / 2);
      } else if (height > 1) {
        c.lerpColors(meadowColor, grassColor, (height - 1) / 2);
      } else if (height > 0) {
        c.lerpColors(baseColor, meadowColor, height);
      } else {
        c.copy(baseColor);
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
}

// ─── Reflective Water Plane ──────────────────────────────────────────────────
function WaterPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
      <planeGeometry args={[60, 60]} />
      <MeshReflectorMaterial
        resolution={512}
        mirror={0.6}
        mixBlur={8}
        mixStrength={1.5}
        minDepthThreshold={0.8}
        maxDepthThreshold={1.2}
        depthToBlurRatioBias={0.25}
        color="#1a6b8a"
        metalness={0.6}
        roughness={0.4}
      />
    </mesh>
  );
}

// ─── Firefly Particles ───────────────────────────────────────────────────────
function Fireflies({ brightness }: { brightness: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 200;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 8 + 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    const time = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      pos.array[ix + 1] = positions[ix + 1] + Math.sin(time * 0.5 + i * 0.7) * 0.4;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffd166"
        transparent
        opacity={brightness}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Dynamic Lighting ────────────────────────────────────────────────────────
function DynamicLighting({ daylight }: { daylight: number }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  useFrame(() => {
    // Ambient: bright white during day, dim blue at night
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.15 + daylight * 0.5;
      ambientRef.current.color.copy(lerpColor('#1a2040', '#ffffff', daylight));
    }
    // Sun / Moon directional
    if (sunRef.current) {
      sunRef.current.intensity = 0.3 + daylight * 1.2;
      sunRef.current.color.copy(lerpColor('#4466aa', '#fff5e6', daylight));
      // Sun high during day, low at night
      sunRef.current.position.set(50, 10 + daylight * 60, 30);
    }
    // Fill light
    if (fillRef.current) {
      fillRef.current.intensity = 0.15 + daylight * 0.35;
      fillRef.current.color.copy(lerpColor('#223355', '#cce0ff', daylight));
    }
    // Hemisphere: sky + ground
    if (hemiRef.current) {
      hemiRef.current.intensity = 0.2 + daylight * 0.5;
      hemiRef.current.color.copy(lerpColor('#0a1628', '#87ceeb', daylight));
      hemiRef.current.groundColor.copy(lerpColor('#0a1210', '#4a9e3f', daylight));
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} />
      <directionalLight ref={sunRef} castShadow={false} />
      <directionalLight ref={fillRef} position={[-20, 40, -30]} />
      <hemisphereLight ref={hemiRef} />
    </>
  );
}

// ─── Dynamic Fog ─────────────────────────────────────────────────────────────
function DynamicFog({ fogColor }: { fogColor: string }) {
  const fogRef = useRef<THREE.Fog>(null);

  useFrame(() => {
    if (fogRef.current) {
      fogRef.current.color.lerp(new THREE.Color(fogColor), 0.02);
    }
  });

  return <fog ref={fogRef} attach="fog" args={['#b0d4f1', 30, 80]} />;
}

// ─── Scene Content ─────────────────────────────────────────────────────────────
function SceneContent() {
  const [sky, setSky] = useState<SkyColors>(getSkyColors);

  // Recalculate every 30 seconds for smooth time transitions
  useEffect(() => {
    const interval = setInterval(() => setSky(getSkyColors()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { zenith, midSky, horizon, lowHorizon, nadir, fogColor, daylight } = sky;

  return (
    <>
      <CameraRig />

      <DynamicFog fogColor={fogColor} />
      <DynamicLighting daylight={daylight} />

      {/* Smooth 5-point gradient sky sphere — natural, no edges */}
      <GradientSkySphere zenith={zenith} midSky={midSky} horizon={horizon} lowHorizon={lowHorizon} nadir={nadir} />

      {/* Stars — bright at night, fade during day */}
      <Stars
        radius={200}
        depth={80}
        count={3000}
        factor={5}
        saturation={0.3}
        fade
        speed={0.3}
      />

      {/* Landscape */}
      <TerrainMesh />
      <WaterPlane />
      <Fireflies brightness={0.3 + (1 - daylight) * 0.6} />
    </>
  );
}

// ─── Main Scene Export ───────────────────────────────────────────────────────
export function NatureScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 8, 22], fov: 55 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      gl={{ antialias: false, alpha: false }}
    >
      <AdaptiveDpr pixelated />
      <SceneContent />
    </Canvas>
  );
}

export default NatureScene;
