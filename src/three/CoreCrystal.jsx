import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup.jsx'

/**
 * SCENE 1 — "Obsidian Core"
 * Kristal polihedral: solid faceted + wireframe luar + cincin orbit.
 * Drag untuk memutar, hover untuk mengembang.
 */

function Facets() {
  const mesh = useRef()
  const [hovered, setHovered] = useState(false)

  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.32, 1)
    // sedikit dorong tiap vertex supaya facet terasa "dipahat", bukan bola sempurna
    const pos = g.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const n = 1 + Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) * 0.075
      v.multiplyScalar(n)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])

  useFrame((state, dt) => {
    if (!mesh.current) return
    const target = hovered ? 1.07 : 1
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), Math.min(dt * 5, 0.2))
  })

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial
        color="#131a26"
        roughness={0.28}
        metalness={0.85}
        flatShading
        emissive="#4d5ba8"
        emissiveIntensity={hovered ? 0.4 : 0.2}
      />
    </mesh>
  )
}

function Shell() {
  const ref = useRef()
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.78, 1), [])

  useFrame((state, dt) => {
    if (!ref.current) return
    ref.current.rotation.y -= dt * 0.09
    ref.current.rotation.z += dt * 0.03
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.7) * 0.012
    ref.current.scale.setScalar(s)
  })

  return (
    <lineSegments ref={ref}>
      <edgesGeometry args={[geometry]} />
      <lineBasicMaterial color="#7c8cff" transparent opacity={0.34} />
    </lineSegments>
  )
}

function OrbitRing({ radius, tilt, speed, color, opacity }) {
  const ref = useRef()
  useFrame((state, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed
  })
  return (
    <group rotation={tilt}>
      <mesh ref={ref}>
        <torusGeometry args={[radius, 0.0055, 3, 128]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  )
}

function Shards({ count = 14 }) {
  const group = useRef()
  const shards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        r: 2.3 + Math.random() * 1.5,
        a: (i / count) * Math.PI * 2,
        y: (Math.random() - 0.5) * 2.2,
        s: 0.035 + Math.random() * 0.075,
        rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3]
      })),
    [count]
  )

  useFrame((state, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.055
  })

  return (
    <group ref={group}>
      {shards.map((s) => (
        <mesh
          key={s.key}
          position={[Math.cos(s.a) * s.r, s.y, Math.sin(s.a) * s.r]}
          rotation={s.rot}
        >
          <tetrahedronGeometry args={[s.s, 0]} />
          <meshStandardMaterial
            color="#8e9ac4"
            flatShading
            roughness={0.35}
            metalness={0.7}
            emissive="#3b4470"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function CoreCrystal() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#c9d2ff" />
      <directionalLight position={[-6, -3, -4]} intensity={0.7} color="#3fbfae" />
      <pointLight position={[0, 0, 2.6]} intensity={9} color="#7c8cff" distance={9} />

      <DragGroup autoSpin={0.16}>
        <Facets />
        <Shell />
        <Shards />
        <OrbitRing radius={2.15} tilt={[1.5, 0.2, 0]} speed={0.18} color="#7c8cff" opacity={0.5} />
        <OrbitRing radius={2.62} tilt={[1.1, -0.5, 0.4]} speed={-0.12} color="#3fbfae" opacity={0.34} />
        <OrbitRing radius={3.05} tilt={[1.9, 0.6, -0.3]} speed={0.08} color="#c9a86a" opacity={0.2} />
      </DragGroup>
    </>
  )
}
