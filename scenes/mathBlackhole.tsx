'use client';
import React, { JSX, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, OrbitControls, Text, useFBO } from '@react-three/drei';
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

export default function AsciiOrbitsScene({
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
          <meshStandardMaterial color={idealblackholecorecolor}/>
        </mesh>
        {sats.map((s, i) => (
          <SatelliteText key={i} sat={s} anchor={anchorVec} />
        ))}
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