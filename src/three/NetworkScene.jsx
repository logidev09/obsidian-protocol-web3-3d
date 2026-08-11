import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, getPerfProfile, nearestPairs } from './geo'

/**
 * SECTION 3 - lattice validator.
 * Node di permukaan bola, dihubungkan rusuk. Node yang di-hover membesar
 * dan menyalakan tetangganya; paket data berjalan sepanjang rusuk.
 */

function Packets({ pairs, nodes }) {
  const ref = useRef()
  const { low } = useMemo(getPerfProfile, [])
  const count = low ? 8 : 18

  const routes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        pair: pairs[(i * 7) % pairs.length],
        speed: 0.25 + ((i % 5) * 0.09),
        phase: i / count
      })),
    [pairs, count]
  )

  useFrame((frame) => {
    if (!ref.current) return
    const t = frame.clock.elapsedTime
    ref.current.children.forEach((child, i) => {
      const r = routes[i]
      if (!r) return
      const p = (t * r.speed + r.phase) % 1
      child.position.lerpVectors(nodes[r.pair[0]], nodes[r.pair[1]], p)
      const fade = Math.sin(p * Math.PI)
      child.scale.setScalar(0.035 + fade * 0.03)
    })
  })

  return (
    <group ref={ref}>
      {routes.map((_, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={i % 4 === 0 ? PALETTE.copper : PALETTE.teal} />
        </mesh>
      ))}
    </group>
  )
}

function Lattice() {
  const [active, setActive] = useState(-1)
  const { low } = useMemo(getPerfProfile, [])
  const nodeCount = low ? 26 : 48

  const nodes = useMemo(() => fibonacciSphere(nodeCount, 2.15), [nodeCount])
  const pairs = useMemo(() => nearestPairs(nodes, low ? 1.25 : 0.95), [nodes, low])

  const lineGeo = useMemo(() => {
    const positions = new Float32Array(pairs.length * 6)
    pairs.forEach(([a, b], i) => {
      positions.set([nodes[a].x, nodes[a].y, nodes[a].z], i * 6)
      positions.set([nodes[b].x, nodes[b].y, nodes[b].z], i * 6 + 3)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [pairs, nodes])

  const neighbours = useMemo(() => {
    if (active < 0) return new Set()
    const set = new Set()
    pairs.forEach(([a, b]) => {
      if (a === active) set.add(b)
      if (b === active) set.add(a)
    })
    return set
  }, [active, pairs])

  const group = useRef()
  useFrame((frame, delta) => {
    if (!group.current) return
    const dt = Math.min(delta, 0.05)
    group.current.children.forEach((child, i) => {
      if (!child.isMesh) return
      const want = i === active ? 1.9 : neighbours.has(i) ? 1.35 : 1
      const s = THREE.MathUtils.damp(child.scale.x, want, 6, dt)
      child.scale.setScalar(s)
    })
  })

  return (
    <DragGroup autoSpin={0.16} parallax={0.6} maxPitch={0.6}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.42} />
      </lineSegments>

      <group ref={group}>
        {nodes.map((p, i) => (
          <mesh
            key={i}
            position={p}
            onPointerOver={(e) => {
              e.stopPropagation()
              setActive(i)
            }}
            onPointerOut={() => setActive((v) => (v === i ? -1 : v))}
          >
            <octahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial
              color={i === active ? PALETTE.copper : PALETTE.mist}
              emissive={i === active ? PALETTE.copper : neighbours.has(i) ? PALETTE.teal : PALETTE.indigo}
              emissiveIntensity={i === active ? 1.1 : neighbours.has(i) ? 0.7 : 0.25}
              roughness={0.3}
              metalness={0.8}
              flatShading
            />
          </mesh>
        ))}
      </group>

      <Packets pairs={pairs} nodes={nodes} />
    </DragGroup>
  )
}

export default function NetworkScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 5, 4]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[-4, 0, 4]} intensity={18} distance={18} color={PALETTE.indigo} />
      <Lattice />
    </>
  )
}
