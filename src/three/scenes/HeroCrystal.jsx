import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Hero: kristal ikosahedron berlapis.
 * - Inti padat low-poly dengan flat shading.
 * - Kulit wireframe yang "bernapas".
 * - Serpihan tetrahedron mengorbit; hover di kristal menariknya mendekat.
 * Seluruh grup bisa diputar dengan drag.
 */

function Shards({ hovered }) {
  const group = useRef()

  const shards = useMemo(() => {
    const rand = seededRandom(7)
    return Array.from({ length: 22 }, () => {
      const radius = 2.3 + rand() * 1.5
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(rand() * 2 - 1)
      return {
        radius,
        theta,
        phi,
        speed: 0.08 + rand() * 0.18,
        size: 0.07 + rand() * 0.13,
        tilt: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
        warm: rand() > 0.72
      }
    })
  }, [])

  const refs = useRef([])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const pull = hovered ? 0.72 : 1

    shards.forEach((s, i) => {
      const m = refs.current[i]
      if (!m) return
      const angle = s.theta + t * s.speed
      const r = s.radius * pull
      const x = Math.sin(s.phi) * Math.cos(angle) * r
      const y = Math.cos(s.phi) * r * 0.65 + Math.sin(t * 0.5 + i) * 0.1
      const z = Math.sin(s.phi) * Math.sin(angle) * r

      m.position.x = THREE.MathUtils.damp(m.position.x, x, 3, dt)
      m.position.y = THREE.MathUtils.damp(m.position.y, y, 3, dt)
      m.position.z = THREE.MathUtils.damp(m.position.z, z, 3, dt)
      m.rotation.x += dt * 0.4
      m.rotation.y += dt * 0.25
    })
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} rotation={s.tilt}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={s.warm ? PALETTE.amber : PALETTE.steel}
            emissive={s.warm ? PALETTE.amber : PALETTE.teal}
            emissiveIntensity={s.warm ? 0.7 : 0.35}
            roughness={0.35}
            metalness={0.7}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Core({ hovered, setHovered }) {
  const inner = useRef()
  const shell = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    if (inner.current) {
      const target = hovered ? 1.08 : 1
      const s = THREE.MathUtils.damp(inner.current.scale.x, target, 5, dt)
      inner.current.scale.setScalar(s)
      inner.current.material.emissiveIntensity = THREE.MathUtils.damp(
        inner.current.material.emissiveIntensity,
        hovered ? 1.15 : 0.45,
        5,
        dt
      )
    }

    if (shell.current) {
      const breathe = 1.28 + Math.sin(t * 0.7) * 0.035
      shell.current.scale.setScalar(breathe)
      shell.current.rotation.y -= dt * 0.12
      shell.current.rotation.z += dt * 0.05
    }
  })

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
    >
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          emissive={PALETTE.teal}
          emissiveIntensity={0.45}
          roughness={0.22}
          metalness={0.92}
          flatShading
        />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshBasicMaterial color={PALETTE.mist} wireframe transparent opacity={0.22} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.85, 0.012, 3, 96]} />
        <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2.6, 0.5, 0]}>
        <torusGeometry args={[2.15, 0.01, 3, 96]} />
        <meshBasicMaterial color={PALETTE.steel} transparent opacity={0.32} />
      </mesh>
    </group>
  )
}

export default function HeroCrystal() {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} color={PALETTE.mist} />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color={PALETTE.indigo} />
      <pointLight position={[0, 0, 2.5]} intensity={9} color={PALETTE.teal} distance={9} />

      <DragGroup autoSpin={0.5} parallax={0.8}>
        <Core hovered={hovered} setHovered={setHovered} />
        <Shards hovered={hovered} />
      </DragGroup>
    </>
  )
}
