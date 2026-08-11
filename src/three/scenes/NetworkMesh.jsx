import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, fibonacciSphere } from '../geo'

/**
 * Network: bola node yang saling terhubung.
 * - Drag memutar seluruh jaringan.
 * - Hover pada satu node menyalakan node itu dan menebalkan garis sekitarnya.
 * Semua garis digambar sebagai satu LineSegments -> satu draw call.
 */

const NODE_COUNT = 42
const LINK_DISTANCE = 1.15

function Node({ position, index, active, setActive }) {
  const ref = useRef()
  const isActive = active === index

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const target = isActive ? 1.9 : 1
    const s = THREE.MathUtils.damp(m.scale.x, target, 6, dt)
    m.scale.setScalar(s)
    m.material.emissiveIntensity = THREE.MathUtils.damp(
      m.material.emissiveIntensity,
      isActive ? 2.2 : 0.4 + Math.sin(t * 1.2 + index) * 0.12,
      6,
      dt
    )
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setActive(index) }}
      onPointerOut={(e) => { e.stopPropagation(); setActive(null) }}
    >
      <octahedronGeometry args={[0.075, 0]} />
      <meshStandardMaterial
        color={isActive ? PALETTE.amber : PALETTE.mist}
        emissive={isActive ? PALETTE.amber : PALETTE.teal}
        emissiveIntensity={0.4}
        roughness={0.3}
        metalness={0.6}
        flatShading
      />
    </mesh>
  )
}

export default function NetworkMesh() {
  const [active, setActive] = useState(null)

  const nodes = useMemo(() => fibonacciSphere(NODE_COUNT, 1.75), [])

  const { geometry, pairs } = useMemo(() => {
    const positions = []
    const pairs = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < LINK_DISTANCE) {
          positions.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z)
          pairs.push([i, j])
        }
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const colors = new Float32Array(positions.length)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry: geo, pairs }
  }, [nodes])

  const lines = useRef()

  useFrame((state, delta) => {
    const geo = lines.current?.geometry
    if (!geo) return
    const dt = Math.min(delta, 0.05)
    const attr = geo.attributes.color
    const base = new THREE.Color(PALETTE.indigo)
    const hot = new THREE.Color(PALETTE.amber)
    const t = state.clock.elapsedTime

    for (let p = 0; p < pairs.length; p++) {
      const [i, j] = pairs[p]
      const isHot = active !== null && (i === active || j === active)
      const pulse = 0.55 + Math.sin(t * 0.8 + p * 0.4) * 0.12
      const target = isHot ? hot : base
      const intensity = isHot ? 1 : pulse
      for (let v = 0; v < 2; v++) {
        const idx = p * 2 + v
        attr.setXYZ(
          idx,
          THREE.MathUtils.damp(attr.getX(idx), target.r * intensity, 8, dt),
          THREE.MathUtils.damp(attr.getY(idx), target.g * intensity, 8, dt),
          THREE.MathUtils.damp(attr.getZ(idx), target.b * intensity, 8, dt)
        )
      }
    }
    attr.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[0, 0, 0]} intensity={6} color={PALETTE.teal} distance={6} />

      <DragGroup autoSpin={0.8} parallax={0.5}>
        <lineSegments ref={lines} geometry={geometry}>
          <lineBasicMaterial vertexColors transparent opacity={0.75} />
        </lineSegments>

        {nodes.map((p, i) => (
          <Node key={i} index={i} position={p} active={active} setActive={setActive} />
        ))}

        <mesh>
          <icosahedronGeometry args={[1.72, 1]} />
          <meshBasicMaterial color={PALETTE.slate} wireframe transparent opacity={0.08} />
        </mesh>
      </DragGroup>
    </>
  )
}
