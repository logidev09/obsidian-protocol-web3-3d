import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, fibonacciSphere } from '../geo'

/**
 * Network: mesh validator berbentuk bola.
 * - Node terdekat saling terhubung garis (dihitung sekali, bukan tiap frame)
 * - Klik node → node terkunci menyala dan mengirim "pulsa" ke tetangganya
 * - Drag → memutar seluruh jaringan
 */

const NODE_COUNT = 42
const LINK_DISTANCE = 1.15

function Node({ position, index, active, onSelect }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((frame, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime
    const base = active ? 1.9 : hovered ? 1.5 : 1
    const breathe = 1 + Math.sin(t * 1.6 + index) * 0.06
    m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, base * breathe, 7, dt))
    m.material.emissiveIntensity = THREE.MathUtils.damp(
      m.material.emissiveIntensity,
      active ? 1.6 : hovered ? 0.9 : 0.25,
      7,
      dt
    )
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(index)
      }}
    >
      <octahedronGeometry args={[0.075, 0]} />
      <meshStandardMaterial
        color={active ? PALETTE.teal : PALETTE.mist}
        emissive={active ? PALETTE.teal : PALETTE.indigo}
        emissiveIntensity={0.25}
        roughness={0.3}
        metalness={0.7}
        flatShading
      />
    </mesh>
  )
}

function Links({ nodes, pairs, activeIndex }) {
  const ref = useRef()

  const geometry = useMemo(() => {
    const positions = new Float32Array(pairs.length * 6)
    pairs.forEach(([a, b], i) => {
      nodes[a].toArray(positions, i * 6)
      nodes[b].toArray(positions, i * 6 + 3)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [nodes, pairs])

  useFrame((frame, delta) => {
    if (!ref.current) return
    const target = activeIndex === null ? 0.16 : 0.3
    ref.current.material.opacity = THREE.MathUtils.damp(
      ref.current.material.opacity,
      target,
      5,
      Math.min(delta, 0.05)
    )
  })

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.16} />
    </lineSegments>
  )
}

function Pulse({ from, to }) {
  const ref = useRef()
  const progress = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current) return
    progress.current = (progress.current + delta * 0.8) % 1
    ref.current.position.lerpVectors(from, to, progress.current)
    const fade = Math.sin(progress.current * Math.PI)
    ref.current.material.opacity = fade
    ref.current.scale.setScalar(0.5 + fade * 0.8)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshBasicMaterial color={PALETTE.teal} transparent opacity={0} toneMapped={false} />
    </mesh>
  )
}

export default function NetworkMesh() {
  const [active, setActive] = useState(null)

  const nodes = useMemo(() => fibonacciSphere(NODE_COUNT, 2.1), [])

  const pairs = useMemo(() => {
    const list = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < LINK_DISTANCE) list.push([i, j])
      }
    }
    return list
  }, [nodes])

  const pulses = useMemo(() => {
    if (active === null) return []
    return pairs
      .filter(([a, b]) => a === active || b === active)
      .slice(0, 6)
      .map(([a, b]) => (a === active ? [nodes[a], nodes[b]] : [nodes[b], nodes[a]]))
  }, [active, pairs, nodes])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[-4, 2, 3]} intensity={16} color={PALETTE.indigo} distance={14} />

      <DragGroup autoSpin={0.85} parallax={0.45}>
        <Links nodes={nodes} pairs={pairs} activeIndex={active} />
        {nodes.map((p, i) => (
          <Node key={i} index={i} position={p} active={active === i} onSelect={setActive} />
        ))}
        {pulses.map(([from, to], i) => (
          <Pulse key={`${active}-${i}`} from={from} to={to} />
        ))}

        <mesh>
          <icosahedronGeometry args={[2.08, 1]} />
          <meshBasicMaterial color={PALETTE.slate} transparent opacity={0.07} wireframe />
        </mesh>
      </DragGroup>
    </>
  )
}
