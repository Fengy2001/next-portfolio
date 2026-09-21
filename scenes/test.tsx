'use client';
import { satobj } from '@/components/display_scene'

export default function Test({objects}:{objects : Map<string,satobj>}) {
    
    // objects.forEach((vector, name) => {
    //     console.log("Name:",name, "vector:", vector);
    // })
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            {Array.from(objects.entries()).map(([name, thing]) => (
                <mesh key={name} position={thing.position} scale={[0.5,0.5,0.5]} renderOrder={0}>
                    <sphereGeometry args={[0.75, 32, 32]} />
                    <meshStandardMaterial color={'White'}/>
                </mesh>
            ))}
        </>
    );
}