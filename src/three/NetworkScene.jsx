import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, getPerfProfile, nearestPairs } from './geo'

/**
 * JARINGAN - node validator.
 * Bola wireframe dari titik + rusuk. Node terdekat kursor menyala dan
 * sedikit terangkat, seolah "terbangun" saat disentuh mouse.
 */
function Nodes({ points }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorA = useMemo(() => new THREE.Color(PALETTE.steel), [])
  const colorB = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const tmp = useMemo(() => new THREE.Color(), [])
  const world = useMemo(() => new THREE.Vector3(), [])
  const ray = useMemo(() => new THREE.Vector3(), [])

  useFrame((frame, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime

    // arah kursor diproyeksikan ke ruang scene
    ray.set(frame.pointer.x * 3.2, frame.pointer.y * 3.2, 2.4)

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      world.copy(p)
      m.localToWorld(world)

      const dist = world.distanceTo(ray)
      const heat = THREE.MathUtils.clamp(1 - dist / 2.6, 0, 1)
      const pulse = 1 + Math.sin(t * 2 + i * 0.35) * 0.12
      const scale = (0.05 + heat * 0.08) * pulse

      dummy.position.copy(p).multiplyScalar(1 + heat * 0.07)
      dummy.scale.setScalar(THREE.MathUtils.damp(scale, scale, 8, dt))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      tmp.copy(colorA).lerp(colorB, heat)
      m.setColorAt(i, tmp)
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, points.length]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        roughness={0.3}
        metalness={0.6}
        emissive={PALETTE.teal}
        emissiveIntensity={0.35}
        flatShading
      />
    </instancedMesh>
  )
}

function Edges({ points, pairs }) {
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
      <lineBasicMaterial color={PALETTE.indigo} transparent opacity={0.3} />
    </lineSegments>
  )
}

function Pulse({ points, pairs }) {
  const ref = useRef()
  const route = useRef({ pair: pairs[0] || [0, 0], t: 0 })

  useFrame((_, delta) => {
    const m = ref.current
    if (!m || !pairs.length) return
    const r = route.current
    r.t += Math.min(delta, 0.05) * 0.9

    if (r.t >= 1) {
      r.t = 0
      r.pair = pairs[Math.floor(Math.random() * pairs.length)]
    }
    m.position.lerpVectors(points[r.pair[0]], points[r.pair[1]], r.t)
    m.scale.setScalar(0.07 * Math.sin(r.t * Math.PI))
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={PALETTE.copper} />
    </mesh>
  )
}

export default function NetworkScene() {
  const { low } = getPerfProfile()
  const count = low ? 60 : 120

  const points = useMemo(() => fibonacciSphere(count, 2.1), [count])
  const pairs = useMemo(() => nearestPairs(points, low ? 0.14 : 0.11), [points, low])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} color="#dde6f0" />
      <pointLight position={[-4, -2, 2]} intensity={0.6} color={PALETTE.indigo} />

      <DragGroup autoSpin={0.12} parallax={0.8} hitRadius={3}>
        <Nodes points={points} />
        <Edges points={points} pairs={pairs} />
        <Pulse points={points} pairs={pairs} />
      </DragGroup>
    </>
  )
}
