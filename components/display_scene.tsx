'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, useScroll } from '@react-three/drei'

const scenes: Record<string, React.ComponentType<any>> = {
  mathBlackhole: dynamic(() => import('@/scenes/mathBlackhole'), { ssr: false }),
  aboutMe: dynamic(() => import('@/scenes/aboutMe'), { ssr: false }),
  projects: dynamic(() => import('@/scenes/projects'), { ssr: false }),
  blog: dynamic(() => import('@/scenes/blog'), { ssr: false }),
  test: dynamic(() => import('@/scenes/test'), { ssr: false }),
};

function ScrollWatcher() {
  const scroll = useScroll()
  useFrame(() => {
    console.log(scroll.offset)
  })
  return null
}

type Props = {
  scenename: keyof typeof scenes;
  onNavigate?: (slug: string) => void; // lets a scene (e.g. projects) request a blog post
};

export interface satobj {
    name: string;
    position: [number,number,number];
    color: string;
    size: [number,number,number];
  }

const DisplayScene: React.FC<Props> = ({ scenename, onNavigate }) => {
  const hash = new Map<string,satobj>();
  const thing1 : satobj = {
    name : "thing1",
    position : [-1,0,0],
    color : "white",
    size : [1,1,1]
  }
  hash.set("thing1", thing1)
  const Scene = scenes[scenename];
  if (!Scene) {
    return <div>Scene not found</div>;
  } else {
    return <div className="relative w-full h-screen">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Scene objects={hash} onNavigate={onNavigate}/>
      </Canvas>
    </div>;
  }
};

export default DisplayScene;