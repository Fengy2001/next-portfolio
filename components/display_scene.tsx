'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, useScroll } from '@react-three/drei'

const scenes: Record<string, React.ComponentType<any>> = {
  mathBlackhole: dynamic(() => import('@/scenes/mathBlackhole'), { ssr: false })
};

function ScrollWatcher() {
  const scroll = useScroll()
  useFrame(() => {
    // scroll.offset is between 0 and 1
    console.log(scroll.offset)
    // You can use this value to drive animations, camera movement, etc.
  })

  return null
}

type Props = {
  scenename: keyof typeof scenes;
};

const DisplayScene: React.FC<Props> = ({ scenename }) => {
  const Scene = scenes[scenename];
  if (!Scene) {
    return <div>Scene not found</div>;
  } else {
    return <div className="relative w-full h-screen">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>;
  }
};

export default DisplayScene;