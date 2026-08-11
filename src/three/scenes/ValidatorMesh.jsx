import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, spherePoints, nearestPairs } from '../geo'

/**
 * Network: mesh validator.
 * Node menyala saat di-hover, dan denyut cahaya berjalan
 * di sepanjang garis koneksi.
 */

function Node({ position, index, onHover, active }) {
  const ref = useRef()

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 1.6 + index) * 0.06
    const s = THREE.MathUtils.damp(m.scale.x, (active ? 2.1 : 1) * pulse, 6, Math.min(delta, 0.05))
    m.scale.setScalar(s)
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); onHover(index) }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null) }}
    >
      <octahedronGeometry args={[0.075, 0]} />
      <meshStandardMaterial
        color={active ? PALETTE.teal : PALETTE.mist}
        emissive={active ? PALETTE.teal : PALETTE.indigo}
        emissiveIntensity={active ? 1.4 : 0.45}
        roughness={0.3}
        metalness={0.7}
        flatShading
      />
    </mesh>
  )
}

function Links({ points, pairs, activeNode }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(pairs.length * 6)
    pairs.forEach(([a, b], i) => {
      positions.set([points[a].x, points[a].y, points[a].z, points[b].x, points[b].y, points[b].z], i * 6)
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [points, pairs])

  const ref = useRef()
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.material.opacity = THREE.MathUtils.damp(
      ref.current.material.opacity,
      activeNode === null ? 0.16 : 0.28,
      4,
      Math.min(delta, 0.05)
    )
  })

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.16} />
    </lineSegments>
  )
}

function Packets({ points, pairs }) {
  const group = useRef()

  const routes = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      pair: pairs[(i * 7) % pairs.length],
      speed: 0.25 + (i % 5) * 0.08,
      offset: i / 10
    })),
    [pairs]
  )

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.children.forEach((child, i) => {
      const r = routes[i]
      if (!r?.pair) return
      const p = (t * r.speed + r.offset) % 1
      child.position.lerpVectors(points[r.pair[0]], points[r.pair[1]], p)
      const fade = Math.sin(p * Math.PI)
      child.material.opacity = fade * 0.9
      child.scale.setScalar(0.6 + fade * 0.6)
    })
  })

  return (
    <group ref={group}>
      {routes.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function ValidatorMesh() {
  const [active, setActive] = useState(null)
  const points = useMemo(() => spherePoints(46, 1.9, 11), [])
  const pairs = useMemo(() => nearestPairs(points, 1.15), [points])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[0, 0, 0]} intensity={12} color={PALETTE.indigo} distance={8} />

      <DragGroup autoSpin={1.2} parallax={0.5}>
        <Links points={points} pairs={pairs} activeNode={active} />
        <Packets points={points} pairs={pairs} />
        {points.map((p, i) => (
          <Node key={i} position={p} index={i} active={active === i} onHover={setActive} />
        ))}
        <mesh>
          <sphereGeometry args={[1.86, 24, 24]} />
          <meshBasicMaterial color={PALETTE.slate} transparent opacity={0.06} />
        </mesh>
      </DragGroup>
    </>
  )
}
