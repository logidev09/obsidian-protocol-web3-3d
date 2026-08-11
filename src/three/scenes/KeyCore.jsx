import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Hero: inti kunci kriptografis.
 * Icosahedron low-poly yang dideformasi manual (bukan noise library),
 * dibungkus sangkar wireframe dan cincin orbit shard.
 * Drag → putar. Diam → berputar pelan sendiri.
 */

function useFacetedGeometry() {
  return useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.35, 1)
    const pos = geo.attributes.position
    const rand = seededRandom(7)
    const v = new THREE.Vector3()
    const seen = new Map()

    // deformasi konsisten per-vertex agar facet tidak pecah
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const key = `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`
      let offset = seen.get(key)
      if (offset === undefined) {
        offset = 0.86 + rand() * 0.3
        seen.set(key, offset)
      }
      v.multiplyScalar(offset)
      pos.setXYZ(i, v.x, v.y, v.z)
    }

    geo.computeVertexNormals()
    return geo
  }, [])
}

function Core() {
  const geometry = useFacetedGeometry()
  const ref = useRef()

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.material.emissiveIntensity = 0.35 + Math.sin(t * 0.9) * 0.12
  })

  return (
    <mesh ref={ref} geometry={geometry} castShadow>
      <meshStandardMaterial
        color={PALETTE.slate}
        emissive={PALETTE.indigo}
        emissiveIntensity={0.35}
        roughness={0.28}
        metalness={0.92}
        flatShading
      />
    </mesh>
  )
}

function Cage() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= Math.min(delta, 0.05) * 0.08
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.95, 1]} />
      <meshBasicMaterial color={PALETTE.steel} wireframe transparent opacity={0.22} />
    </mesh>
  )
}

function Shards() {
  const group = useRef()

  const shards = useMemo(() => {
    const rand = seededRandom(31)
    return Array.from({ length: 14 }, (_, i) => ({
      angle: (i / 14) * Math.PI * 2,
      radius: 2.35 + rand() * 0.5,
      y: (rand() - 0.5) * 1.5,
      size: 0.07 + rand() * 0.1,
      speed: 0.15 + rand() * 0.2,
      tilt: rand() * Math.PI
    }))
  }, [])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.children.forEach((child, i) => {
      const s = shards[i]
      const a = s.angle + t * s.speed
      child.position.set(Math.cos(a) * s.radius, s.y + Math.sin(t * 0.6 + i) * 0.12, Math.sin(a) * s.radius)
      child.rotation.x = t * 0.4 + s.tilt
      child.rotation.z = t * 0.3
    })
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? PALETTE.teal : PALETTE.mist}
            emissive={i % 3 === 0 ? PALETTE.teal : PALETTE.steel}
            emissiveIntensity={0.5}
            roughness={0.25}
            metalness={0.8}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

export default function KeyCore() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 3]} intensity={1.15} color={PALETTE.mist} />
      <pointLight position={[-4, -1, 2]} intensity={22} color={PALETTE.indigo} distance={16} />
      <pointLight position={[3, 2, -4]} intensity={16} color={PALETTE.teal} distance={14} />

      <DragGroup autoSpin={1} parallax={0.7}>
        <Core />
        <Cage />
        <Shards />
      </DragGroup>
    </>
  )
}
