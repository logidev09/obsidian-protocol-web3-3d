import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, explodeShards, getPerfProfile } from './geo'

/**
 * HERO - inti kunci terenkripsi.
 * Icosahedron low-poly yang pecah jadi kepingan saat diklik, lalu menyatu lagi
 * saat diklik ulang. Bisa diputar bebas dengan drag.
 */
function Shard({ shard, open, index }) {
  const ref = useRef()
  const [hot, setHot] = useState(false)

  const target = useMemo(
    () => shard.origin.clone().add(shard.direction.clone().multiplyScalar(0.55)),
    [shard]
  )

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const dest = open ? target : shard.origin
    const float = open ? Math.sin(t * 1.4 + index) * 0.035 : 0

    m.position.x = THREE.MathUtils.damp(m.position.x, dest.x, 6, dt)
    m.position.y = THREE.MathUtils.damp(m.position.y, dest.y + float, 6, dt)
    m.position.z = THREE.MathUtils.damp(m.position.z, dest.z, 6, dt)

    const spin = open ? 0.25 : 0
    m.rotation.x += spin * dt
    m.rotation.z += spin * 0.6 * dt
  })

  return (
    <mesh
      ref={ref}
      geometry={shard.geometry}
      position={shard.origin}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHot(true)
      }}
      onPointerOut={() => setHot(false)}
    >
      <meshStandardMaterial
        color={hot ? PALETTE.copper : PALETTE.slate}
        emissive={hot ? PALETTE.copper : PALETTE.teal}
        emissiveIntensity={hot ? 0.5 : open ? 0.22 : 0.08}
        roughness={0.32}
        metalness={0.78}
        flatShading
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Core({ open }) {
  const ref = useRef()

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 2) * 0.05
    m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, (open ? 0.92 : 0.55) * pulse, 6, dt))
    m.rotation.y += 0.35 * dt
  })

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={PALETTE.teal}
        emissive={PALETTE.teal}
        emissiveIntensity={open ? 1.1 : 0.55}
        roughness={0.2}
        metalness={0.3}
        flatShading
      />
    </mesh>
  )
}

function Halo() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += 0.12 * Math.min(delta, 0.05)
  })
  return (
    <group ref={ref} rotation={[1.2, 0, 0]}>
      <mesh>
        <torusGeometry args={[2.35, 0.012, 3, 64]} />
        <meshBasicMaterial color={PALETTE.steel} transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[0, 0.9, 0]}>
        <torusGeometry args={[2.7, 0.008, 3, 64]} />
        <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

export default function HeroScene() {
  const [open, setOpen] = useState(false)
  const { low } = getPerfProfile()

  const shards = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.9, low ? 1 : 2)
    return explodeShards(geo, low ? 24 : 44)
  }, [low])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#e6edf5" />
      <pointLight position={[-5, -2, -3]} intensity={0.8} color={PALETTE.indigo} />
      <pointLight position={[2, -3, 4]} intensity={0.5} color={PALETTE.copper} />

      <DragGroup autoSpin={0.18} parallax={1.2} hitRadius={3.2}>
        <group onClick={(e) => (e.stopPropagation(), setOpen((v) => !v))}>
          {shards.map((s, i) => (
            <Shard key={i} shard={s} open={open} index={i} />
          ))}
        </group>
        <Core open={open} />
        <Halo />
      </DragGroup>
    </>
  )
}
