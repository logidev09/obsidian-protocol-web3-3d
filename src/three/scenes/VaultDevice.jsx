import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Product: perangkat vault fisik.
 * Klik perangkat → lapisan terpisah (exploded view) dan label muncul.
 * Drag → putar. Semua transisi memakai damp, tidak ada lompatan.
 */

const LAYERS = [
  { key: 'shell', label: 'Titanium shell', offset: 0.85, color: PALETTE.steel, metalness: 0.95, roughness: 0.3 },
  { key: 'board', label: 'Secure element', offset: 0.0, color: PALETTE.slate, metalness: 0.6, roughness: 0.5 },
  { key: 'core', label: 'Key enclave', offset: -0.85, color: PALETTE.ink, metalness: 0.4, roughness: 0.6 }
]

function Layer({ geometry, layer, expanded, index }) {
  const ref = useRef()

  useFrame((_, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const targetY = expanded ? layer.offset : 0
    m.position.y = THREE.MathUtils.damp(m.position.y, targetY, 5, dt)
    m.material.opacity = THREE.MathUtils.damp(
      m.material.opacity,
      expanded && index !== 1 ? 0.55 : 1,
      5,
      dt
    )
  })

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        color={layer.color}
        roughness={layer.roughness}
        metalness={layer.metalness}
        transparent
        opacity={1}
      />
    </mesh>
  )
}

function ScreenGlow({ expanded }) {
  const ref = useRef()
  useFrame((state, delta) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.material.opacity = THREE.MathUtils.damp(
      ref.current.material.opacity,
      expanded ? 0.15 : 0.5 + Math.sin(t * 1.4) * 0.12,
      5,
      Math.min(delta, 0.05)
    )
  })
  return (
    <mesh ref={ref} position={[0, 0.18, 0.19]}>
      <planeGeometry args={[0.95, 0.62]} />
      <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.5} toneMapped={false} />
    </mesh>
  )
}

function Ports() {
  return (
    <group position={[0, -0.62, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.42, 12]} />
        <meshStandardMaterial color={PALETTE.mist} metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  )
}

export default function VaultDevice() {
  const [expanded, setExpanded] = useState(false)

  const geometries = useMemo(
    () => [
      roundedBoxGeometry(1.35, 2.15, 0.34, 0.16),
      roundedBoxGeometry(1.12, 1.9, 0.16, 0.08),
      roundedBoxGeometry(0.72, 1.2, 0.12, 0.06)
    ],
    []
  )

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} color={PALETTE.mist} />
      <pointLight position={[-3, 1, 3]} intensity={18} color={PALETTE.indigo} distance={14} />
      <pointLight position={[2, -2, 2]} intensity={10} color={PALETTE.teal} distance={10} />

      <DragGroup autoSpin={0.6} parallax={0.5} scale={1.05}>
        <group onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}>
          {LAYERS.map((layer, i) => (
            <Layer key={layer.key} geometry={geometries[i]} layer={layer} expanded={expanded} index={i} />
          ))}
          <ScreenGlow expanded={expanded} />
          <Ports />
        </group>

        <mesh position={[0, 0, -0.6]}>
          <ringGeometry args={[1.55, 1.58, 64]} />
          <meshBasicMaterial color={PALETTE.steel} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </DragGroup>
    </>
  )
}
