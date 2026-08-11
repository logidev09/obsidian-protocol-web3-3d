import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

/**
 * SECTION 2 - perangkat vault fisik.
 * Klik untuk exploded view: lapisan casing, papan, dan elemen aman
 * memisah lalu menyatu lagi. Drag memutar perangkatnya.
 */

const LAYERS = [
  { y: 0.62, size: [2.5, 0.12, 1.55], color: PALETTE.steel, label: 'shell' },
  { y: 0.3, size: [2.35, 0.1, 1.42], color: PALETTE.slate, label: 'board' },
  { y: 0.0, size: [2.2, 0.16, 1.32], color: PALETTE.carbon, label: 'secure element' },
  { y: -0.3, size: [2.35, 0.1, 1.42], color: PALETTE.slate, label: 'battery' },
  { y: -0.62, size: [2.5, 0.12, 1.55], color: PALETTE.steel, label: 'base' }
]

function Layer({ spec, index, open, hot }) {
  const ref = useRef()
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(...spec.size)),
    [spec.size]
  )

  useFrame((frame, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    const target = open ? spec.y * 2.6 : spec.y
    const drift = open ? Math.sin(frame.clock.elapsedTime * 0.8 + index) * 0.02 : 0
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, target + drift, 5, dt)
  })

  const isCore = index === 2

  return (
    <group ref={ref} position={[0, spec.y, 0]}>
      <mesh castShadow={false}>
        <boxGeometry args={spec.size} />
        <meshStandardMaterial
          color={spec.color}
          emissive={isCore ? PALETTE.teal : PALETTE.indigo}
          emissiveIntensity={isCore ? (hot ? 0.55 : 0.3) : 0.06}
          roughness={isCore ? 0.3 : 0.55}
          metalness={0.88}
          flatShading
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          color={isCore ? PALETTE.teal : PALETTE.mist}
          transparent
          opacity={isCore ? 0.5 : 0.16}
        />
      </lineSegments>
    </group>
  )
}

function Device() {
  const [open, setOpen] = useState(false)
  const [hot, setHot] = useState(false)
  const halo = useRef()

  useFrame((frame, delta) => {
    if (!halo.current) return
    const dt = Math.min(delta, 0.05)
    halo.current.rotation.y += dt * 0.25
    halo.current.material.opacity = THREE.MathUtils.damp(
      halo.current.material.opacity,
      open ? 0.4 : 0.14,
      4,
      dt
    )
  })

  return (
    <DragGroup autoSpin={0.22} parallax={0.5} maxPitch={0.45}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          setHot(true)
        }}
        onPointerOut={() => setHot(false)}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {LAYERS.map((spec, i) => (
          <Layer key={spec.label} spec={spec} index={i} open={open} hot={hot} />
        ))}
      </group>

      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
        <ringGeometry args={[1.9, 2.05, 6]} />
        <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
    </DragGroup>
  )
}

export default function ProductScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color={PALETTE.mist} />
      <pointLight position={[-4, 2, 3]} intensity={18} distance={16} color={PALETTE.teal} />
      <pointLight position={[3, -2, -3]} intensity={14} distance={14} color={PALETTE.copper} />
      <Device />
    </>
  )
}
