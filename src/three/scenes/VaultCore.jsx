import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Hero: inti vault berbentuk kristal low-poly.
 * - Drag untuk memutar, lepas → berputar bebas dengan inersia.
 * - Hover → cangkang wireframe mengembang, inti menyala.
 * - Serpihan orbit bergerak mengelilingi inti.
 */

function Shards({ count = 26, radius = 2.6 }) {
  const group = useRef()
  const shards = useMemo(() => {
    const rand = seededRandom(7)
    return Array.from({ length: count }, () => ({
      radius: radius * (0.7 + rand() * 0.55),
      speed: 0.08 + rand() * 0.22,
      offset: rand() * Math.PI * 2,
      tilt: (rand() - 0.5) * 1.1,
      y: (rand() - 0.5) * 2.4,
      size: 0.045 + rand() * 0.09,
      spin: (rand() - 0.5) * 1.2
    }))
  }, [count, radius])

  const refs = useRef([])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    shards.forEach((s, i) => {
      const m = refs.current[i]
      if (!m) return
      const a = t * s.speed + s.offset
      m.position.set(
        Math.cos(a) * s.radius,
        s.y + Math.sin(a * 1.4) * 0.22,
        Math.sin(a) * s.radius * Math.cos(s.tilt)
      )
      m.rotation.x += dt * s.spin
      m.rotation.z += dt * s.spin * 0.7
    })
    if (group.current) group.current.rotation.y = t * 0.04
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={PALETTE.steel}
            emissive={PALETTE.teal}
            emissiveIntensity={0.35}
            roughness={0.35}
            metalness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

export default function VaultCore() {
  const shell = useRef()
  const core = useRef()
  const inner = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    if (shell.current) {
      const target = hovered ? 1.34 : 1.16
      const s = THREE.MathUtils.damp(shell.current.scale.x, target, 5, dt)
      shell.current.scale.setScalar(s)
      shell.current.rotation.y -= dt * 0.12
      shell.current.rotation.x += dt * 0.05
    }
    if (core.current) {
      core.current.material.emissiveIntensity = THREE.MathUtils.damp(
        core.current.material.emissiveIntensity,
        hovered ? 0.95 : 0.42 + Math.sin(t * 1.2) * 0.06,
        5,
        dt
      )
    }
    if (inner.current) {
      inner.current.rotation.y += dt * 0.4
      inner.current.rotation.z -= dt * 0.25
      const s = 0.52 + Math.sin(t * 1.6) * 0.03
      inner.current.scale.setScalar(s)
    }
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 4]} intensity={1.1} color={PALETTE.mist} />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color={PALETTE.indigo} />
      <pointLight position={[0, 0, 0]} intensity={7} color={PALETTE.teal} distance={6} />

      <DragGroup autoSpin={0.5} parallax={0.9}>
        <group
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHovered(false)
          }}
        >
          <mesh ref={core}>
            <icosahedronGeometry args={[1.35, 1]} />
            <meshStandardMaterial
              color={PALETTE.slate}
              emissive={PALETTE.teal}
              emissiveIntensity={0.42}
              roughness={0.22}
              metalness={0.95}
              flatShading
            />
          </mesh>

          <mesh ref={shell} scale={1.16}>
            <icosahedronGeometry args={[1.35, 1]} />
            <meshBasicMaterial
              color={hovered ? PALETTE.amber : PALETTE.steel}
              wireframe
              transparent
              opacity={hovered ? 0.5 : 0.28}
            />
          </mesh>

          <mesh ref={inner} scale={0.52}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={PALETTE.mist}
              emissive={PALETTE.amber}
              emissiveIntensity={0.7}
              roughness={0.15}
              metalness={1}
              flatShading
            />
          </mesh>
        </group>

        <Shards />
      </DragGroup>
    </>
  )
}
