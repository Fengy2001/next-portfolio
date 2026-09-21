'use client';
import React, { JSX, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html, OrbitControls, Text, useFBO } from '@react-three/drei';
import * as THREE from 'three';
import vertexShader from '@/shaders/vertexShader.glsl';
import fragmentShader from '@/shaders/fragmentShader.glsl';


function useCssVariable(name: string) {
  const [value, setValue] = React.useState<string>('');

  React.useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const style = getComputedStyle(root);
      setValue(style.getPropertyValue(name).trim());
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [name]);

  return value;
}

type Satellite = {
  char: string;
  radius: number;
  inclination: number;
  speed: number;
  phase: number;
  eccentricity?: number;
  size?: number;
  color?: string;
};

function Geometries(): JSX.Element {
  /*
  * Credit to Maxime from the blog post https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
  * they provided the base code for the blackhole light-refracturing in JSX, allowing me to convert it into TSX for Nextjs usability.
  */
  const meshRef = useRef<THREE.Mesh | null>(null);
  const backgroundGroupRef = useRef<THREE.Group | null>(null);
  const overlayMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const { size, viewport } = useThree();
  const DPR = Math.min(window.devicePixelRatio ?? 1, 2);
  const fboWidth = Math.max(1, Math.floor(size.width * DPR));
  const fboHeight = Math.max(1, Math.floor(size.height * DPR));

  const mainRenderTarget = useFBO(fboWidth, fboHeight, {
    stencilBuffer: false,
  });

  const uniforms = useMemo(
    () => ({
      uTexture: { value: null as THREE.Texture | null },
      winResolution: {
        value: new THREE.Vector2(fboWidth, fboHeight),
      },
    }),
    []
  );

  useEffect(() => {
    uniforms.winResolution.value.set(fboWidth, fboHeight);
  }, [fboWidth, fboHeight, uniforms.winResolution]);

  const overlayMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertexShader as string,
      fragmentShader: fragmentShader as string,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return mat;
  }, []);

  useEffect(() => {
    overlayMatRef.current = overlayMaterial;
    return () => {
      overlayMatRef.current = null;
      overlayMaterial.dispose();
    };
  }, [overlayMaterial]);

  useFrame((state) => {
    const { gl, scene, camera } = state;
    if (!meshRef.current || !overlayMatRef.current) return;
    meshRef.current.visible = false;

    gl.setRenderTarget(mainRenderTarget);
    gl.clear();
    gl.render(scene, camera);

    overlayMatRef.current.uniforms.uTexture.value = mainRenderTarget.texture;

    gl.setRenderTarget(null);
    meshRef.current.visible = true;
  });

  return (
    <>
      <group ref={backgroundGroupRef}>
      </group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.84, 20]} />
        <primitive object={overlayMaterial} />
      </mesh>
    </>
  );
}

function SatelliteText({ sat, anchor = new THREE.Vector3(0, 0, 0) }: { sat: Satellite; anchor?: THREE.Vector3 }) {
  const ref = useRef<THREE.Object3D>(null!);
  const pos = useRef(new THREE.Vector3()).current;

  const idealtextcolor = useCssVariable('--foreground');

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const theta = time * sat.speed + sat.phase;

    const x0 = sat.radius * Math.cos(theta);
    const z0 = sat.radius * Math.sin(theta);
    const y0 = 0;

    const cosI = Math.cos(sat.inclination);
    const sinI = Math.sin(sat.inclination);

    const x = anchor.x + x0;
    const y = anchor.y + (y0 * cosI - z0 * sinI);
    const z = anchor.z + (y0 * sinI + z0 * cosI);

    pos.set(x, y, z);
    ref.current.position.copy(pos);
  });

  return (
    <group ref={ref}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={sat.size ?? 0.36}
          color={idealtextcolor}
          anchorX="center"
          anchorY="middle"
        >
          {sat.char}
        </Text>
      </Billboard>
    </group>
  );
}

/*
Placeholder background scene that reuses the blackhole.tsx
This should be it's own scene. However, I've left this portfolio
website on "work in progress" for too long, going to give it some
content so it'll look more appealing
*/
export default function aboutMe({
  anchor = [0, 0, 0] as [number, number, number],
  count = 64,
}: {
  width?: string | number;
  height?: string | number;
  anchor?: [number, number, number];
  count?: number;
}) {
  var idealblackholecorecolor = useCssVariable('--background');
  if (idealblackholecorecolor == "#ffffff") {
    idealblackholecorecolor = "#ffffff00";
  };
  const anchorVec = useMemo(() => new THREE.Vector3(...anchor), [anchor]);
  const chars = useMemo(() => {
    const base = [
      '!','+','-','*','÷','=','√','∑','π','∞','∫',
      'α','β','γ','Δ','λ','Ω','ε','𝑓','φ','≠','≈',
      '~','≡','<','>','≤','≥','∅','∈','∉','⊂','⊆',
      '⊊','⊃', '⊇', '⊋','∩','∪','⊖','よ','¬','∀',
      '∃','⇒','⇔','⊥','⁠∂','↦','∮','∯','∰','∏','≀',
      '∴','∵','∝','⊙','Ш','∦','∓','±'
    ];
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(base[i % base.length]);
    return out;
  }, [count]);

  const sats = useMemo(() => {
    return chars.map((c, i) => {
      const layer = i % 4;
      const radius = 1.8 + layer * 0.6 + Math.random() * 0.4;
      const inclination = (Math.PI / 10) * ((i % 7) - 3) + (Math.random() - 0.5) * 0.6;
      const baseSpeed = 0.25 + (i % 3) * 0.06;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const speed = direction * (baseSpeed + Math.random() * 0.08);
      const phase = Math.random() * Math.PI * 2;
      const eccentricity = Math.random() * 0.5;
      const size = 0.28 + Math.random() * 0.25;
      return { char: c, radius, inclination, speed, phase, eccentricity, size } as Satellite;
    });
  }, [chars]);

  return (
    <>
      <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <mesh position={[0, 0, 0]} scale={[0.5,0.5,0.5]} renderOrder={0}>
          {Geometries()}
          <sphereGeometry args={[0.75, 32, 32]} />
          <meshStandardMaterial color={'black'}/>
        </mesh>
        {sats.map((s, i) => (
          <SatelliteText key={i} sat={s} anchor={anchorVec}/>
        ))}

      <Html fullscreen zIndexRange={[0, 10]}>
        <style>{`
          @keyframes about-sheen {
            0%, 100% { transform: translateX(-20%); }
            50%      { transform: translateX(20%); }
          }
          .about-sheen { animation: about-sheen 6s ease-in-out infinite; }
        `}</style>

        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <section className="pointer-events-auto relative w-full max-w-md rounded-3xl border border-white/15 bg-black/80 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),rgba(0,0,0,0.85)_70%)] shadow-[0_0_60px_rgba(255,255,255,0.05),inset_0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden px-8 py-8">
            <div
              className="about-sheen absolute -inset-1/2 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)] pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative flex items-center justify-between mb-3">
              <h1 className="text-3xl font-semibold text-white tracking-wide">
                About Me
              </h1>
              <img
                src="https://media.licdn.com/dms/image/v2/D5603AQGak-LyXLuK5A/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1725460802376?e=1790208000&v=beta&t=LD4Jhx2GhTBbX_BRNGHmSKT1UhDSS5RDx26TckaTAHQ"
                alt="Profile picture"
                className="w-24 h-24 rounded-full object-cover border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)] flex-shrink-0"
              />
            </div>

            <div className="relative flex items-center gap-3 mb-5">
              <a
                href="https://github.com/fengy2001"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 hover:border-white/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-white/80" width="18" height="18">
                  <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.17.69-3.84-1.36-3.84-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.03-.71.08-.7.08-.7 1.14.08 1.74 1.17 1.74 1.17 1.02 1.74 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.17-3.05-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.58.23 2.75.11 3.04.73.79 1.17 1.81 1.17 3.05 0 4.37-2.67 5.34-5.21 5.62.41.35.77 1.05.77 2.11 0 1.53-.01 2.76-.01 3.13 0 .3.2.66.79.55 4.51-1.51 7.77-5.76 7.77-10.78C23.02 5.24 18.27.5 12 .5Z" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/in/feng-y-781a4a125/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 hover:border-white/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-white/80" width="18" height="18">
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
                </svg>
              </a>

              <a
                href="mailto:your.email@example.com"
                aria-label="Email"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 hover:border-white/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-none stroke-white/80" width="18" height="18" strokeWidth="1.8">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                  <path d="M3 6.5 12 13l9-6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <p className="relative text-white/80 leading-relaxed text-base mb-4">
              Hi, I'm <strong>Feng Yuan</strong>.
            </p>

            <p className="relative text-white/80 leading-relaxed text-base mb-4">
              Originally started as a data-scientist, after getting a taste of software development I couldn't stop. Since then, I've found passion in software engineering and helped found ZendTrading where I preside over all technical matters, from development, deployment, maintainence, and architecting.
            </p>

            <ul className="relative flex flex-col gap-2 mt-6 pt-6 border-t border-white/10 text-white/75">
              <li><span className="text-white/45 mr-2">Based in</span>Calgary</li>
              <li><span className="text-white/45 mr-2">Currently</span>Technical Founder at ZendTrading</li>
              <li><span className="text-white/45 mr-2">Outside of work</span>Testing/Developing software or open source models!</li>
            </ul>
          </section>
        </div>
      </Html>

      <OrbitControls
          target={[0, 0, 0]} 
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          minAzimuthAngle={2*Math.PI/64}
          maxAzimuthAngle={7*Math.PI/64}
          minPolarAngle={14.5*Math.PI / 30}
          maxPolarAngle={15.5*Math.PI / 30}
      />
    </>
  );
}