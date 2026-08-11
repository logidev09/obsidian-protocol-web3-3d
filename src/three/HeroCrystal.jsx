import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

/**
 * HERO — kristal obsidian low-poly.
 * Inti icosahedron + kulit wireframe yang "bernapas", dikelilingi
 * shard oktahedron yang mengorbit. Bisa di-drag untuk diputar.
 */

function Shards({ count = 14 }) {
  const ref = useRef()
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 2.1 + (i % 4) * 0.28,
        speed: 0.12 + (i % 5) * 0.035,
        offset: (i / count) * Math.PI * 2,
        tilt: (i % 3) * 0.5 - 0.5,
        size: 0.1 + ((i * 7) % 5) * 0.035
      })),
    [count]
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    ref.current?.children.forEach((child, i) => {
      const s = seeds[i]
      const a = t * s.speed + s.offset
      child.position.set(
        Math.cos(a) * s.radius,
        Math.sin(a * 1.3 + s.tilt) * 0.75,
        Math.sin(a) * s.radius
      )
      child.rotation.x = a * 0.8
      child.rotation.z = a * 0.5
    })
  })

  return (
    <group ref={ref}>
      {seeds.map((s, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? PALETTE.teal : PALETTE.steel}
            emissive={i % 3 === 0 ? PALETTE.teal : PALETTE.indigo}
            emissiveIntensity={0.25}
            roughness={0.35}
            metalness={0.6}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Core() {
  const inner = useRef()
  const shell = useRef()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    if (inner.current) {
      inner.current.rotation.y += dt * 0.15
      const pulse = 1 + Math.sin(t * 1.1) * 0.02
      inner.current.scale.setScalar(pulse)
    }
    if (shell.current) {
      shell.current.rotation.y -= dt * 0.08
      shell.current.rotation.x = Math.sin(t * 0.3) * 0.12
      shell.current.material.opacity = 0.22 + Math.sin(t * 1.6) * 0.06
    }
  })

  return (
    <group>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.35, 0]} />
        <meshStandardMaterial
          color={PALETTE.ink}
          emissive={PALETTE.indigo}
          emissiveIntensity={0.18}
          roughness={0.18}
          metalness={0.95}
          flatShading
        />
      </mesh>

      <mesh ref={shell} scale={1.55}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial
          color={PALETTE.teal}
          wireframe
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={2.4}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color={PALETTE.indigo}
          transparent
          opacity={0.045}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default function HeroCrystal() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#cfe6ff" />
      <pointLight position={[-5, -2, -4]} intensity={22} color={PALETTE.violet} distance={16} />
      <pointLight position={[3, -3, 4]} intensity={16} color={PALETTE.teal} distance={14} />

      <DragGroup autoSpin={0.9} parallax={0.35}>
        <Core />
        <Shards />
      </DragGroup>
    </>
  )
}
