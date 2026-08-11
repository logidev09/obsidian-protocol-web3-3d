import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Jaringan validator: node oktahedron yang saling terhubung.
 * - Hover sebuah node → node itu membesar dan jalur ke tetangganya menyala.
 * - Klik node → mengunci highlight (pulse berjalan sepanjang koneksi).
 * - Seluruh konstelasi bisa diputar dengan drag.
 */

const NODE_COUNT = 20
const LINK_DISTANCE = 2.1

function useNetwork() {
  return useMemo(() => {
    const rand = seededRandom(21)
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
      // distribusi fibonacci sphere agar merata, sedikit diacak
      const k = i + 0.5
      const phi = Math.acos(1 - (2 * k) / NODE_COUNT)
      const theta = Math.PI * (1 + Math.sqrt(5)) * k
      const r = 1.9 + rand() * 0.35
      return {
        base: new THREE.Vector3(
          Math.cos(theta) * Math.sin(phi) * r,
          Math.cos(phi) * r * 0.8,
          Math.sin(theta) * Math.sin(phi) * r
        ),
        size: 0.09 + rand() * 0.07,
        speed: 0.4 + rand() * 0.7,
        phase: rand() * Math.PI * 2
      }
    })

    const links = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].base.distanceTo(nodes[j].base) < LINK_DISTANCE) links.push([i, j])
      }
    }
    return { nodes, links }
  }, [])
}

function Links({ nodes, links, positions, activeIndex }) {
  const geoRef = useRef()
  const array = useMemo(() => new Float32Array(links.length * 6), [links.length])
  const colors = useMemo(() => new Float32Array(links.length * 6), [links.length])

  const dim = useMemo(() => new THREE.Color(PALETTE.steel), [])
  const hot = useMemo(() => new THREE.Color(PALETTE.teal), [])

  useFrame(() => {
    const geo = geoRef.current
    if (!geo) return

    links.forEach(([a, b], i) => {
      const pa = positions[a]
      const pb = positions[b]
      array.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], i * 6)

      const lit = activeIndex === a || activeIndex === b
      const c = lit ? hot : dim
      colors.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6)
    })

    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
  })

  return (
    <lineSegments>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[array, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.42} />
    </lineSegments>
  )
}

function Nodes({ nodes, positions, activeIndex, setActive, locked, setLocked }) {
  const refs = useRef([])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    nodes.forEach((n, i) => {
      const m = refs.current[i]
      if (!m) return
      const drift = Math.sin(t * n.speed + n.phase) * 0.07
      positions[i].set(
        n.base.x + drift,
        n.base.y + Math.cos(t * n.speed * 0.8 + n.phase) * 0.07,
        n.base.z + drift * 0.5
      )
      m.position.copy(positions[i])
      m.rotation.y += dt * 0.5
      m.rotation.x += dt * 0.3

      const lit = activeIndex === i
      const target = lit ? 1.9 : 1
      m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, target, 8, dt))
      m.material.emissiveIntensity = THREE.MathUtils.damp(
        m.material.emissiveIntensity,
        lit ? 1.4 : 0.3 + Math.sin(t * 1.5 + n.phase) * 0.1,
        8,
        dt
      )
    })
  })

  return nodes.map((n, i) => (
    <mesh
      key={i}
      ref={(el) => (refs.current[i] = el)}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (locked === null) setActive(i)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        if (locked === null) setActive(null)
      }}
      onClick={(e) => {
        e.stopPropagation()
        const next = locked === i ? null : i
        setLocked(next)
        setActive(next)
      }}
    >
      <octahedronGeometry args={[n.size, 0]} />
      <meshStandardMaterial
        color={locked === i ? PALETTE.amber : PALETTE.mist}
        emissive={locked === i ? PALETTE.amber : PALETTE.teal}
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.8}
        flatShading
      />
    </mesh>
  ))
}

export default function NetworkMesh() {
  const { nodes, links } = useNetwork()
  const positions = useMemo(() => nodes.map((n) => n.base.clone()), [nodes])
  const [active, setActive] = useState(null)
  const [locked, setLocked] = useState(null)

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[0, 0, 0]} intensity={6} color={PALETTE.indigo} distance={7} />

      <DragGroup autoSpin={0.6} parallax={0.7}>
        <Links nodes={nodes} links={links} positions={positions} activeIndex={active} />
        <Nodes
          nodes={nodes}
          positions={positions}
          activeIndex={active}
          setActive={setActive}
          locked={locked}
          setLocked={setLocked}
        />
        <mesh>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial
            color={PALETTE.slate}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.5}
            roughness={0.25}
            metalness={0.9}
            flatShading
          />
        </mesh>
      </DragGroup>
    </>
  )
}
