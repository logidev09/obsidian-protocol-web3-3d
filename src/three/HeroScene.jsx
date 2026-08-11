import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, getPerfProfile } from './geo'

/**
 * HERO — "the vault core".
 * Inti icosahedron padat, dikelilingi cangkang wireframe dan enam pecahan
 * yang mengorbit. Hover pada pecahan membuatnya terangkat + menyala tembaga.
 */
function Shard({ index, total, hovered, setHovered }) {
  const mesh = useRef()
  const isHot = hovered === index

  const base = useMemo(() => {
    const angle = (index / total) * Math.PI * 2
    const tilt = Math.sin(index * 1.7) * 0.6
    return { angle, tilt, radius: 2.35 + Math.cos(index * 2.1) * 0.18 }
  }, [index, total])

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    const radius = base.radius + (isHot ? 0.45 : 0) + Math.sin(t * 0.6 + index) * 0.05
    const angle = base.angle + t * 0.12

    m.position.x = THREE.MathUtils.damp(m.position.x, Math.cos(angle) * radius, 6, dt)
    m.position.z = THREE.MathUtils.damp(m.position.z, Math.sin(angle) * radius, 6, dt)
    m.position.y = THREE.MathUtils.damp(m.position.y, base.tilt + (isHot ? 0.25 : 0), 6, dt)

    m.rotation.x += dt * 0.4
    m.rotation.z += dt * 0.25

    const scale = isHot ? 1.35 : 1
    m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, scale, 8, dt))
  })

  return (
    <mesh
      ref={mesh}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(index)
      }}
      onPointerOut={() => setHovered((h) => (h === index ? null : h))}
    >
      <tetrahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial
        color={isHot ? PALETTE.copper : PALETTE.steel}
        emissive={isHot ? PALETTE.copper : PALETTE.teal}
        emissiveIntensity={isHot ? 0.55 : 0.12}
        roughness={0.35}
        metalness={0.7}
        flatShading
      />
    </mesh>
  )
}

function Core() {
  const inner = useRef()
  const shell = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    if (inner.current) {
      inner.current.rotation.y += dt * 0.15
      inner.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.015)
    }
    if (shell.current) {
      shell.current.rotation.y -= dt * 0.08
      shell.current.rotation.x += dt * 0.03
    }
  })

  return (
    <group>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          emissive={PALETTE.teal}
          emissiveIntensity={0.22}
          roughness={0.28}
          metalness={0.85}
          flatShading
        />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[1.75, 1]} />
        <meshBasicMaterial color={PALETTE.teal} wireframe transparent opacity={0.16} />
      </mesh>

      <mesh>
        <icosahedronGeometry args={[2.55, 0]} />
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.07} />
      </mesh>
    </group>
  )
}

export default function HeroScene() {
  const [hovered, setHovered] = useState(null)
  const { low } = getPerfProfile()
  const shardCount = low ? 4 : 7

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#dfe8f0" />
      <pointLight position={[-5, -2, -4]} intensity={0.7} color={PALETTE.indigo} />
      <pointLight position={[3, -3, 4]} intensity={0.45} color={PALETTE.copper} />

      <DragGroup autoSpin={0.18} hitRadius={3.4}>
        <Core />
        {Array.from({ length: shardCount }, (_, i) => (
          <Shard key={i} index={i} total={shardCount} hovered={hovered} setHovered={setHovered} />
        ))}
      </DragGroup>
    </>
  )
}
