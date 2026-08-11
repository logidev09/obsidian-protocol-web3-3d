import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, getPerfProfile, seededRandom } from './geo'

/**
 * HERO — kristal polygon low-poly.
 * Drag untuk memutar, hover untuk menaikkan emisi, pecahan mengorbit
 * mengikuti jarak pointer.
 */

function Shard({ position, rotation, scale, speed, hovered }) {
  const ref = useRef()
  const base = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const push = hovered ? 1.18 : 1
    m.position.x = THREE.MathUtils.damp(m.position.x, base.x * push, 4, dt)
    m.position.z = THREE.MathUtils.damp(m.position.z, base.z * push, 4, dt)
    m.position.y = base.y + Math.sin(t * speed + base.x) * 0.12
    m.rotation.x += dt * speed * 0.35
    m.rotation.z += dt * speed * 0.2
  })

  return (
    <mesh ref={ref} position={position} rotation={rotation} scale={scale}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={PALETTE.steel}
        emissive={PALETTE.teal}
        emissiveIntensity={hovered ? 0.5 : 0.22}
        roughness={0.35}
        metalness={0.75}
        flatShading
      />
    </mesh>
  )
}

function Crystal() {
  const [hovered, setHovered] = useState(false)
  const core = useRef()
  const halo = useRef()

  const shards = useMemo(() => {
    const rand = seededRandom(7)
    const { low } = getPerfProfile()
    const count = low ? 9 : 16
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      const radius = 2.5 + rand() * 1.1
      return {
        key: i,
        position: [
          Math.cos(angle) * radius,
          (rand() - 0.5) * 2.6,
          Math.sin(angle) * radius
        ],
        rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
        scale: 0.14 + rand() * 0.2,
        speed: 0.4 + rand() * 0.8
      }
    })
  }, [])

  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.55, 1)), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    if (core.current) {
      const target = hovered ? 1.08 : 1
      const s = THREE.MathUtils.damp(core.current.scale.x, target, 6, dt)
      core.current.scale.setScalar(s)
      core.current.material.emissiveIntensity = THREE.MathUtils.damp(
        core.current.material.emissiveIntensity,
        hovered ? 0.75 : 0.3,
        5,
        dt
      )
    }
    if (halo.current) {
      halo.current.rotation.y = -t * 0.12
      halo.current.rotation.x = Math.sin(t * 0.2) * 0.15
    }
  })

  return (
    <DragGroup autoSpin={0.35} parallax={1}>
      <mesh
        ref={core}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[1.55, 1]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          emissive={PALETTE.indigo}
          emissiveIntensity={0.3}
          roughness={0.22}
          metalness={0.9}
          flatShading
        />
      </mesh>

      <lineSegments ref={halo} geometry={edges} scale={1.34}>
        <lineBasicMaterial color={PALETTE.teal} transparent opacity={0.32} />
      </lineSegments>

      <mesh scale={1.9} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.53, 64]} />
        <meshBasicMaterial color={PALETTE.mist} transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {shards.map((s) => (
        <Shard key={s.key} {...s} hovered={hovered} />
      ))}
    </DragGroup>
  )
}

export default function CrystalScene() {
  return (
    <>
      <color attach="background" args={[0, 0, 0]} attachArray={undefined} visible={false} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color={PALETTE.mist} />
      <pointLight position={[-5, -2, -4]} intensity={22} distance={18} color={PALETTE.indigo} />
      <pointLight position={[4, -3, 3]} intensity={16} distance={16} color={PALETTE.teal} />
      <Crystal />
    </>
  )
}
