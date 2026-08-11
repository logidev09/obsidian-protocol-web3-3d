import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE } from '../geo'

/**
 * Hero: kristal icosahedron berfaset dengan inti bercahaya dan sangkar rusuk.
 * Interaksi: drag untuk memutar, hover memperkuat pendar inti.
 */
function Crystal() {
  const shell = useRef()
  const core = useRef()
  const cage = useRef()
  const [hovered, setHovered] = useState(false)

  const shellGeo = useMemo(() => new THREE.IcosahedronGeometry(1.55, 0), [])
  const cageGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.05, 1)),
    []
  )
  const coreGeo = useMemo(() => new THREE.OctahedronGeometry(0.72, 0), [])

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime
    if (cage.current) {
      cage.current.rotation.y -= dt * 0.18
      cage.current.rotation.z += dt * 0.05
    }
    if (core.current) {
      core.current.rotation.y += dt * 0.9
      core.current.rotation.x += dt * 0.35
      const pulse = 1 + Math.sin(t * 1.6) * 0.05
      const target = hovered ? 1.18 : 1
      core.current.scale.setScalar(
        THREE.MathUtils.damp(core.current.scale.x, pulse * target, 6, dt)
      )
      core.current.material.emissiveIntensity = THREE.MathUtils.damp(
        core.current.material.emissiveIntensity,
        hovered ? 2.4 : 1.35,
        6,
        dt
      )
    }
    if (shell.current) {
      shell.current.material.opacity = THREE.MathUtils.damp(
        shell.current.material.opacity,
        hovered ? 0.34 : 0.2,
        6,
        dt
      )
    }
  })

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={cage} geometry={cageGeo}>
        <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.55} />
      </mesh>

      <mesh ref={shell} geometry={shellGeo}>
        <meshPhysicalMaterial
          color={PALETTE.slate}
          transparent
          opacity={0.2}
          roughness={0.15}
          metalness={0.1}
          transmission={0.85}
          thickness={1.4}
          ior={1.4}
          flatShading
        />
      </mesh>

      <mesh ref={core} geometry={coreGeo}>
        <meshStandardMaterial
          color={PALETTE.teal}
          emissive={PALETTE.teal}
          emissiveIntensity={1.35}
          roughness={0.3}
          metalness={0.4}
          flatShading
        />
      </mesh>

      <mesh geometry={shellGeo} scale={1.005}>
        <meshBasicMaterial color={PALETTE.mist} wireframe transparent opacity={0.14} />
      </mesh>
    </group>
  )
}

/** Serpihan kecil yang mengorbit kristal. */
function Shards({ count = 22 }) {
  const group = useRef()
  const shards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 2.6 + (i % 5) * 0.28,
        speed: 0.12 + (i % 7) * 0.02,
        offset: (i / count) * Math.PI * 2,
        y: (Math.sin(i * 12.9898) * 43758.5453) % 1,
        size: 0.05 + ((i * 7) % 5) * 0.02
      })),
    [count]
  )

  useFrame((frame) => {
    const t = frame.clock.elapsedTime
    group.current?.children.forEach((child, i) => {
      const s = shards[i]
      const angle = s.offset + t * s.speed
      child.position.set(
        Math.cos(angle) * s.radius,
        s.y * 2.4 - 1.2 + Math.sin(t * 0.5 + s.offset) * 0.18,
        Math.sin(angle) * s.radius
      )
      child.rotation.x += 0.004
      child.rotation.y += 0.006
    })
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? PALETTE.indigo : PALETTE.mist}
            emissive={i % 3 === 0 ? PALETTE.indigo : PALETTE.steel}
            emissiveIntensity={0.5}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

export default function HeroCrystal({ active = true }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color={PALETTE.mist} />
      <pointLight position={[-4, -2, -3]} intensity={22} color={PALETTE.indigo} distance={14} />
      <pointLight position={[3, -3, 4]} intensity={16} color={PALETTE.teal} distance={12} />

      <DragGroup autoSpin={0.7} parallax={0.45} scale={1}>
        <Crystal />
        {active && <Shards />}
      </DragGroup>
    </>
  )
}
