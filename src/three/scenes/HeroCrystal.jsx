import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Hero: kristal obsidian low-poly.
 * - Drag  → memutar dengan inersia (lihat DragGroup)
 * - Hover → wireframe luar mengembang & menyala
 * - Idle  → denyut sangat pelan, tidak mengganggu saat baca teks
 */
function Crystal() {
  const core = useRef()
  const cage = useRef()
  const inner = useRef()
  const [hovered, setHovered] = useState(false)

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.35, 1)
    const pos = geo.attributes.position
    const rand = seededRandom(9187)
    const v = new THREE.Vector3()
    // deformasi ringan supaya facet-nya tidak terlalu "bola sempurna"
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const n = 1 + (rand() - 0.5) * 0.16
      v.multiplyScalar(n)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((frame, delta) => {
    const t = frame.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    if (core.current) {
      core.current.material.emissiveIntensity = THREE.MathUtils.damp(
        core.current.material.emissiveIntensity,
        hovered ? 0.85 : 0.28,
        5,
        dt
      )
    }
    if (cage.current) {
      const target = hovered ? 1.28 : 1.12
      const s = THREE.MathUtils.damp(cage.current.scale.x, target, 5, dt)
      cage.current.scale.setScalar(s)
      cage.current.rotation.y -= dt * 0.22
      cage.current.rotation.x += dt * 0.06
    }
    if (inner.current) {
      inner.current.rotation.x = t * 0.35
      inner.current.rotation.z = t * 0.22
      inner.current.scale.setScalar(0.52 + Math.sin(t * 1.1) * 0.03)
    }
  })

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* badan kristal */}
      <mesh ref={core} geometry={geometry} castShadow>
        <meshStandardMaterial
          color={PALETTE.ink}
          emissive={PALETTE.indigo}
          emissiveIntensity={0.28}
          roughness={0.22}
          metalness={0.85}
          flatShading
        />
      </mesh>

      {/* sangkar wireframe */}
      <mesh ref={cage} scale={1.12}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial
          color={hovered ? PALETTE.teal : PALETTE.steel}
          wireframe
          transparent
          opacity={hovered ? 0.55 : 0.28}
        />
      </mesh>

      {/* inti yang berdenyut */}
      <mesh ref={inner} scale={0.52}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={PALETTE.teal}
          emissive={PALETTE.teal}
          emissiveIntensity={1.4}
          roughness={0.3}
          metalness={0.2}
          flatShading
        />
      </mesh>
    </group>
  )
}

function OrbitShards({ count = 14 }) {
  const group = useRef()
  const shards = useMemo(() => {
    const rand = seededRandom(4471)
    return Array.from({ length: count }, (_, i) => ({
      radius: 2.3 + rand() * 1.4,
      speed: 0.12 + rand() * 0.22,
      offset: rand() * Math.PI * 2,
      y: (rand() - 0.5) * 2.4,
      size: 0.06 + rand() * 0.12,
      tone: i % 3
    }))
  }, [count])

  useFrame((frame, delta) => {
    if (!group.current) return
    const t = frame.clock.elapsedTime
    group.current.rotation.y += Math.min(delta, 0.05) * 0.05
    group.current.children.forEach((child, i) => {
      const s = shards[i]
      const a = t * s.speed + s.offset
      child.position.set(Math.cos(a) * s.radius, s.y + Math.sin(a * 1.6) * 0.18, Math.sin(a) * s.radius)
      child.rotation.x = a * 1.2
      child.rotation.y = a * 0.8
    })
  })

  const tones = [PALETTE.teal, PALETTE.indigo, PALETTE.sand]

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={tones[s.tone]}
            emissive={tones[s.tone]}
            emissiveIntensity={0.7}
            roughness={0.4}
            metalness={0.6}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

export default function HeroCrystal() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 4]} intensity={1.1} color={PALETTE.mist} />
      <pointLight position={[-4, -2, -3]} intensity={22} color={PALETTE.indigo} distance={16} />
      <pointLight position={[3, 2, 4]} intensity={12} color={PALETTE.teal} distance={12} />

      <DragGroup autoSpin={0.7} parallax={0.5} scale={1}>
        <Crystal />
        <OrbitShards />
      </DragGroup>
    </>
  )
}
