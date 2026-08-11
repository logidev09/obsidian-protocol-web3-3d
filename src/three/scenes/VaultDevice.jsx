import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Product: perangkat vault.
 * Klik untuk membongkar / merapatkan lapisan (exploded view).
 * Setiap lapisan punya jarak sendiri, dianimasikan dengan damp.
 */

const LAYERS = [
  { label: 'Shell', y: 0.0, thickness: 0.16, color: PALETTE.slate, offset: 0.0, metalness: 0.9 },
  { label: 'Secure element', y: 0.0, thickness: 0.09, color: PALETTE.indigo, offset: 0.55, metalness: 0.7 },
  { label: 'Display', y: 0.0, thickness: 0.05, color: PALETTE.mist, offset: 1.05, metalness: 0.3 },
  { label: 'Backplate', y: 0.0, thickness: 0.1, color: PALETTE.steel, offset: -0.55, metalness: 0.85 }
]

function Layer({ layer, exploded, index }) {
  const ref = useRef()
  const geometry = useMemo(
    () => roundedBoxGeometry(1.5, 2.4, layer.thickness, 0.22),
    [layer.thickness]
  )

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const target = exploded ? layer.offset : index * 0.001
    m.position.z = THREE.MathUtils.damp(m.position.z, target, 4, dt)
    m.rotation.z = THREE.MathUtils.damp(
      m.rotation.z,
      exploded ? Math.sin(t * 0.4 + index) * 0.05 : 0,
      3,
      dt
    )
  })

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        color={layer.color}
        roughness={0.34}
        metalness={layer.metalness}
        emissive={PALETTE.indigo}
        emissiveIntensity={exploded ? 0.28 : 0.1}
        flatShading
      />
    </mesh>
  )
}

function ScreenGlyph({ exploded }) {
  const ref = useRef()
  useFrame((state, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, exploded ? 1.14 : 0.09, 4, dt)
    ref.current.rotation.z += dt * 0.5
  })
  return (
    <mesh ref={ref} position={[0, 0.35, 0.09]}>
      <torusGeometry args={[0.3, 0.035, 3, 6]} />
      <meshStandardMaterial
        color={PALETTE.teal}
        emissive={PALETTE.teal}
        emissiveIntensity={1.2}
        roughness={0.2}
        metalness={0.5}
        flatShading
      />
    </mesh>
  )
}

export default function VaultDevice() {
  const [exploded, setExploded] = useState(false)

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.15} color={PALETTE.mist} />
      <directionalLight position={[-4, -1, -2]} intensity={0.45} color={PALETTE.indigo} />
      <pointLight position={[0, 0.5, 3]} intensity={10} color={PALETTE.amber} distance={9} />

      <DragGroup autoSpin={0.6} parallax={0.55} scale={0.95}>
        <group onClick={(e) => { e.stopPropagation(); setExploded((v) => !v) }}>
          {LAYERS.map((layer, i) => (
            <Layer key={layer.label} layer={layer} index={i} exploded={exploded} />
          ))}
          <ScreenGlyph exploded={exploded} />

          {/* bingkai wireframe untuk kesan teknis */}
          <mesh scale={[1.08, 1.05, 1]}>
            <boxGeometry args={[1.5, 2.4, 0.5]} />
            <meshBasicMaterial color={PALETTE.steel} wireframe transparent opacity={0.14} />
          </mesh>
        </group>
      </DragGroup>
    </>
  )
}
