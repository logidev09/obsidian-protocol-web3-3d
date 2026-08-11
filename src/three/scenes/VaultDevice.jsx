import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Produk: perangkat vault yang tersusun dari 4 lapis.
 * - Drag memutar perangkat.
 * - Hover salah satu lapis akan mengangkatnya (exploded view) dan
 *   memunculkan label lapisan tersebut lewat callback onFocus.
 */

const LAYERS = [
  { key: 'shell',   label: 'Titanium shell',      y: 0.72,  h: 0.16, color: PALETTE.steel,  accent: PALETTE.mist },
  { key: 'secure',  label: 'Secure element',      y: 0.30,  h: 0.22, color: PALETTE.slate,  accent: PALETTE.teal },
  { key: 'compute', label: 'Signing co-processor', y: -0.14, h: 0.22, color: PALETTE.indigo, accent: PALETTE.teal },
  { key: 'power',   label: 'Isolated power rail',  y: -0.58, h: 0.16, color: PALETTE.slate,  accent: PALETTE.amber }
]

function Layer({ layer, index, focused, setFocused }) {
  const ref = useRef()
  const geometry = useMemo(
    () => roundedBoxGeometry(2.1, layer.h, 1.35, 0.12),
    [layer.h]
  )
  const isFocused = focused === layer.key
  const anyFocused = focused !== null

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // saat ada lapis yang di-hover, lapis lain merenggang menjauh
    const spread = anyFocused ? (index - 1.5) * 0.22 : 0
    const lift = isFocused ? 0.14 : 0
    const float = Math.sin(t * 0.6 + index * 0.8) * 0.012

    m.position.y = THREE.MathUtils.damp(m.position.y, layer.y + spread + lift + float, 5, dt)
    m.position.z = THREE.MathUtils.damp(m.position.z, isFocused ? 0.12 : 0, 5, dt)

    m.material.emissiveIntensity = THREE.MathUtils.damp(
      m.material.emissiveIntensity,
      isFocused ? 0.9 : 0.14,
      6,
      dt
    )
  })

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      position={[0, layer.y, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setFocused(layer.key) }}
      onPointerOut={(e) => { e.stopPropagation(); setFocused(null) }}
    >
      <meshStandardMaterial
        color={layer.color}
        emissive={layer.accent}
        emissiveIntensity={0.14}
        roughness={0.34}
        metalness={0.86}
        flatShading
      />
    </mesh>
  )
}

function Frame() {
  const ref = useRef()
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += Math.min(delta, 0.05) * 0.15
  })
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <torusGeometry args={[1.6, 0.008, 3, 6]} />
        <meshBasicMaterial color={PALETTE.steel} transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.15, 0]}>
        <torusGeometry args={[1.35, 0.008, 3, 6]} />
        <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

export default function VaultDevice({ onFocus }) {
  const [focused, setFocusedState] = useState(null)

  const setFocused = (key) => {
    setFocusedState(key)
    onFocus?.(key ? LAYERS.find((l) => l.key === key) : null)
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.15} color={PALETTE.mist} />
      <directionalLight position={[-4, -1, -2]} intensity={0.45} color={PALETTE.indigo} />
      <spotLight position={[0, 4, 3]} angle={0.6} penumbra={1} intensity={12} color={PALETTE.teal} distance={14} />

      <DragGroup autoSpin={0.45} parallax={0.5} scale={1.05}>
        {LAYERS.map((layer, i) => (
          <Layer key={layer.key} layer={layer} index={i} focused={focused} setFocused={setFocused} />
        ))}
        <Frame />
      </DragGroup>
    </>
  )
}

export { LAYERS }
