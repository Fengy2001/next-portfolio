'use client';
import React, { JSX, useEffect, useMemo, useRef, useState } from 'react';
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

type ProjectData = {
  title: string;
  description: string;
  image: string;
  url?: string;
  blogSlug?: string;
};

type ProjectOrbit = {
  project: ProjectData;
  radius: number;
  inclination: number;
  speed: number;
  phase: number;
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

function ProjectPanel({
  orbit,
  anchor = new THREE.Vector3(0, 0, 0),
  isOpen,
  onOpen,
  blackholeRadius = 1.6,
}: {
  orbit: ProjectOrbit;
  anchor?: THREE.Vector3;
  isOpen: boolean;
  onOpen: () => void;
  blackholeRadius?: number;
}) {
  const ref = useRef<THREE.Object3D>(null!);
  const cardRef = useRef<HTMLDivElement>(null);
  const pos = useRef(new THREE.Vector3()).current;
  const { camera, gl } = useThree();

  const projectedCard = useRef(new THREE.Vector3()).current;
  const projectedAnchor = useRef(new THREE.Vector3()).current;
  const edgePoint = useRef(new THREE.Vector3()).current;
  const rightVec = useRef(new THREE.Vector3()).current;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const theta = time * orbit.speed + orbit.phase;

    const x0 = orbit.radius * Math.cos(theta);
    const z0 = orbit.radius * Math.sin(theta);
    const y0 = 0;

    const cosI = Math.cos(orbit.inclination);
    const sinI = Math.sin(orbit.inclination);

    const x = anchor.x + x0;
    const y = anchor.y + (y0 * cosI - z0 * sinI);
    const z = anchor.z + (y0 * sinI + z0 * cosI);

    pos.set(x, y, z);
    ref.current.position.copy(pos);

    if (cardRef.current && !isOpen) {
      const card = cardRef.current;
      const canvasRect = gl.domElement.getBoundingClientRect();

      projectedCard.copy(pos).project(camera);
      projectedAnchor.copy(anchor).project(camera);

      rightVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
      edgePoint.copy(anchor).addScaledVector(rightVec, blackholeRadius).project(camera);

      const toPx = (ndcX: number, ndcY: number) => ({
        x: canvasRect.left + (ndcX * 0.5 + 0.5) * canvasRect.width,
        y: canvasRect.top + (1 - (ndcY * 0.5 + 0.5)) * canvasRect.height,
      });

      const spherePx = toPx(projectedAnchor.x, projectedAnchor.y);
      const edgePx = toPx(edgePoint.x, edgePoint.y);
      const sphereRadiusPx = Math.hypot(edgePx.x - spherePx.x, edgePx.y - spherePx.y);

      const isBehind = projectedCard.z > projectedAnchor.z;

      if (!isBehind) {
        card.style.maskImage = 'none';
        (card.style as any).webkitMaskImage = 'none';
      } else {
        const cardRect = card.getBoundingClientRect();
        const scale = cardRect.width / card.offsetWidth || 1;

        const cardCenterPx = {
          x: cardRect.left + cardRect.width / 2,
          y: cardRect.top + cardRect.height / 2,
        };

        const localCenterX = card.offsetWidth / 2 + (spherePx.x - cardCenterPx.x) / scale;
        const localCenterY = card.offsetHeight / 2 + (spherePx.y - cardCenterPx.y) / scale;
        const localRadius = sphereRadiusPx / scale;

        const mask = `radial-gradient(circle at ${localCenterX}px ${localCenterY}px, transparent ${localRadius}px, black ${localRadius + 2}px)`;
        card.style.maskImage = mask;
        (card.style as any).webkitMaskImage = mask;
      }
    }
  });

  return (
    <group ref={ref}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Html zIndexRange={[0, 10]}>
          <div
            ref={cardRef}
            onClick={onOpen}
            className="cursor-pointer w-28 rounded-xl border border-white/15 bg-black/85 shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden backdrop-blur-sm hover:border-white/30 transition-all"
            style={{ opacity: isOpen ? 0 : 1, pointerEvents: isOpen ? 'none' : 'auto' }}
          >
            <img
              src={orbit.project.image}
              alt={orbit.project.title}
              className="w-full h-14 object-cover"
            />
            <div className="p-2">
              <h3 className="text-white text-[11px] font-semibold mb-0.5 truncate">
                {orbit.project.title}
              </h3>
              <p className="text-white/60 text-[9px] leading-snug line-clamp-2">
                {orbit.project.description}
              </p>
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

function ProjectDetailOverlay({
  project,
  onClose,
  onNavigate,
}: {
  project: ProjectData | null;
  onClose: () => void;
  onNavigate?: (slug: string) => void;
}) {
  if (!project) return null;

  return (
    <Html fullscreen zIndexRange={[20, 30]}>
      <div
        onClick={onClose}
        className="w-full h-full bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-black/90 shadow-[0_0_60px_rgba(255,255,255,0.08)] overflow-hidden"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition-colors z-10"
          >
            ✕
          </button>

          <img src={project.image} alt={project.title} className="w-full h-64 object-cover" />

          <div className="p-8">
            <h2 className="text-white text-2xl font-semibold mb-3">{project.title}</h2>
            <p className="text-white/80 text-base leading-relaxed mb-4">{project.description}</p>

            {project.blogSlug ? (
              <button
                onClick={() => onNavigate?.(project.blogSlug!)}
                className="inline-block text-white/70 hover:text-white underline text-sm"
              >
                Read the full write-up →
              </button>
            ) : project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-white/70 hover:text-white underline text-sm"
              >
                Visit project →
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Html>
  );
}

export default function Projects({
  anchor = [0, 0, 0] as [number, number, number],
  count = 64,
  projects: propsProjects,
  onNavigate,
}: {
  width?: string | number;
  height?: string | number;
  anchor?: [number, number, number];
  count?: number;
  projects?: ProjectData[];
  onNavigate?: (slug: string) => void;
}) {
  var idealblackholecorecolor = useCssVariable('--background');
  if (idealblackholecorecolor == "#ffffff") {
    idealblackholecorecolor = "#ffffff00";
  };
  const anchorVec = useMemo(() => new THREE.Vector3(...anchor), [anchor]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [projectList, setProjectList] = useState<ProjectData[]>(propsProjects ?? []);

  useEffect(() => {
    if (propsProjects) return; // explicit projects passed in — skip fetching
    fetch('/api/projects')
      .then((res) => res.json())
      .then(setProjectList)
      .catch((err) => console.error('Failed to fetch projects:', err));
  }, [propsProjects]);

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

  const projectOrbits = useMemo(() => {
    return projectList.map((project, i) => {
      const radius = 2 + (i % 3) * 1.5;
      const inclination = (Math.PI / 10) * ((i % 5) - 2);
      const speed = (i % 2 === 0 ? 1 : -1) * (0.6 + (i % 3) * 0.2);
      const phase = (i / projectList.length) * Math.PI * 2;
      return { project, radius, inclination, speed, phase } as ProjectOrbit;
    });
  }, [projectList]);

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
        {projectOrbits.map((o, i) => (
          <ProjectPanel
            key={i}
            orbit={o}
            anchor={anchorVec}
            isOpen={focusedIndex === i}
            onOpen={() => setFocusedIndex(i)}
          />
        ))}

        {focusedIndex !== null && (
          <ProjectDetailOverlay
            project={projectOrbits[focusedIndex].project}
            onClose={() => setFocusedIndex(null)}
            onNavigate={onNavigate}
          />
        )}

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