import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, nearestPairs, getPerfProfile } from './geo'

/**
 * JARINGAN - topologi validator.
 * Node tersebar di permukaan bola dan tersambung garis. Hover pada satu node
 * memicu pulse: node itu dan tetangga langsungnya membesar dan menyala.
 */
function Node({ position, index, hovered, setHovered, neighbours }) {
  const ref = useRef()
  const isHot = hovered === index
  const isNear = hovered !== null && neighbours.has(hovered)

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 1.2 + index * 0.7) * 0.06
    const target = (isHot ? 2.1 : isNear ? 1.5 : 1) * pulse
    m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, target, 8, dt))
  })

  const color = isHot ? PALETTE.copper : isNear ? PALETTE.teal : PALETTE.steel

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(index)
      }}
      onPointerOut={() => setHovered((h) => (h === index ? null : h))}
    >
      <octahedronGeometry args={[0.085, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isHot ? 0.8 : isNear ? 0.4 : 0.12}
        roughness={0.4}
        metalness={0.6}
        flatShading
      />
    </mesh>
  )
}

function Links({ points, pairs }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(pairs.length * 6)
    pairs.forEach(([a, b], i) => {
      positions.set([points[a].x, points[a].y, points[a].z], i * 6)
      positions.set([points[b].x, points[b].y, points[b].z], i * 6 + 3)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [points, pairs])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={PALETTE.teal} transparent opacity={0.22} />
    </lineSegments>
  )
}

export default function NetworkScene() {
  const [hovered, setHovered] = useState(null)
  const { low } = getPerfProfile()
  const count = low ? 42 : 84

  const { points, pairs, neighbourMap } = useMemo(() => {
    const pts = fibonacciSphere(count, 2.15)
    const prs = nearestPairs(pts, 0.34)
    const map = pts.map(() => new Set())
    prs.forEach(([a, b]) => {
      map[a].add(b)
      map[b].add(a)
    })
    return { points: pts, pairs: prs, neighbourMap: map }
  }, [count])

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} color="#dde6ee" />
      <pointLight position={[-4, -3, -2]} intensity={0.5} color={PALETTE.indigo} />

      <DragGroup autoSpin={0.14} parallax={0.8} hitRadius={2.9}>
        <Links points={points} pairs={pairs} />
        {points.map((p, i) => (
          <Node
            key={i}
            index={i}
            position={p}
            hovered={hovered}
            setHovered={setHovered}
            neighbours={neighbourMap[i]}
          />
        ))}
        <mesh>
          <sphereGeometry args={[2.02, 24, 16]} />
          <meshBasicMaterial color={PALETTE.carbon} transparent opacity={0.25} />
        </mesh>
      </DragGroup>
    </>
  )
}
