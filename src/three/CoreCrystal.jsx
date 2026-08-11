import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, damp, mulberry32 } from './geo'

/** Icosahedron yang di-displace per-vertex — low poly, terasa "dipahat". */
function facetedGeometry(radius, detail, amount, seed) {
  const geo = new THREE.IcosahedronGeometry(radius, detail)
  const rand = mulberry32(seed)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const k = 1 + (rand() - 0.5) * amount
    v.multiplyScalar(k)
    pos.setXYZ(i, v.x, v.y, v.z)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

function Shard({ radius, speed, tilt, offset, size, color }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset
    const m = ref.current
    if (!m) return
    m.position.set(Math.cos(t) * radius, Math.sin(t * 0.7) * tilt, Math.sin(t) * radius)
    m.rotation.x = t * 0.9
    m.rotation.z = t * 0.6
  })

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={color}
        flatShading
        roughness={0.25}
        metalness={0.7}
        emissive={color}
        emissiveIntensity={0.18}
      />
    </mesh>
  )
}

function Crystal() {
  const core = useRef()
  const shell = useRef()
  const hovered = useRef(false)
  const scale = useRef(1)

  const geo = useMemo(() => facetedGeometry(1.5, 1, 0.34, 7), [])
  const wire = useMemo(() => facetedGeometry(1.72, 1, 0.22, 12), [])

  useFrame(({ clock }, dt) => {
    const step = Math.min(dt, 0.05)
    const t = clock.getElapsedTime()

    scale.current = damp(scale.current, hovered.current ? 1.09 : 1, 6, step)

    if (core.current) {
      core.current.scale.setScalar(scale.current)
      core.current.position.y = Math.sin(t * 0.6) * 0.08
    }
    if (shell.current) {
      shell.current.rotation.y = -t * 0.12
      shell.current.rotation.x = t * 0.05
      shell.current.scale.setScalar(scale.current)
    }
  })

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        hovered.current = true
        document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        hovered.current = false
        document.body.style.cursor = ''
      }}
    >
      <mesh ref={core} geometry={geo} castShadow>
        <meshStandardMaterial
          color={PALETTE.slate}
          flatShading
          roughness={0.18}
          metalness={0.92}
          emissive={PALETTE.indigo}
          emissiveIntensity={0.22}
        />
      </mesh>

      <lineSegments ref={shell}>
        <edgesGeometry args={[wire]} />
        <lineBasicMaterial color={PALETTE.teal} transparent opacity={0.32} />
      </lineSegments>

      <Shard radius={2.5} speed={0.5} tilt={0.5} offset={0} size={0.17} color={PALETTE.teal} />
      <Shard radius={2.9} speed={-0.36} tilt={0.85} offset={2.1} size={0.13} color={PALETTE.sand} />
      <Shard radius={2.2} speed={0.62} tilt={1.2} offset={4.3} size={0.1} color={PALETTE.violet} />
    </group>
  )
}

export default function CoreCrystal() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#cfd8e6" />
      <pointLight position={[-5, -3, -4]} intensity={38} distance={16} color={PALETTE.indigo} />
      <pointLight position={[4, -2, 3]} intensity={20} distance={14} color={PALETTE.teal} />

      <DragGroup autoSpin={0.12} parallax={0.16}>
        <Crystal />
      </DragGroup>
    </>
  )
}
