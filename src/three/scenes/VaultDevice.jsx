import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Perangkat vault — tampilan produk yang bisa "dibongkar".
 * Empat lapisan: sasis, papan logika, elemen aman, dan panel kaca.
 * Klik/tap objek → lapisan memisah (exploded view) dan label muncul.
 * Drag → memutar perangkat.
 */

const LAYERS = [
  { key: 'chassis', label: '01 · Titanium chassis', w: 2.4, h: 0.16, d: 1.5, y: -0.42, color: PALETTE.steel, spread: -0.75 },
  { key: 'logic', label: '02 · Logic board', w: 2.1, h: 0.1, d: 1.25, y: -0.14, color: PALETTE.slate, spread: -0.25 },
  { key: 'secure', label: '03 · Secure element', w: 0.72, h: 0.14, d: 0.72, y: 0.12, color: PALETTE.teal, spread: 0.3 },
  { key: 'glass', label: '04 · Sapphire panel', w: 2.35, h: 0.07, d: 1.45, y: 0.42, color: PALETTE.mist, spread: 0.95 }
]

function Layer({ layer, exploded, hovered, onHover, onOut, onClick }) {
  const ref = useRef()
  const geometry = useMemo(
    () => roundedBoxGeometry(layer.w, layer.h, layer.d, 0.09),
    [layer.w, layer.h, layer.d]
  )

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    const targetY = layer.y + (exploded ? layer.spread : 0)
    m.position.y = THREE.MathUtils.damp(m.position.y, targetY, 6, dt)

    const lift = hovered ? 0.06 : 0
    m.position.z = THREE.MathUtils.damp(m.position.z, lift, 8, dt)

    if (layer.key === 'secure') {
      m.material.emissiveIntensity = 0.5 + Math.sin(t * 2.2) * 0.25 + (hovered ? 0.5 : 0)
      m.rotation.y = THREE.MathUtils.damp(m.rotation.y, exploded ? t * 0.4 : 0, 3, dt)
    }
  })

  const isGlass = layer.key === 'glass'

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      position={[0, layer.y, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(layer.key)
      }}
      onPointerOut={() => onOut(layer.key)}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <meshStandardMaterial
        color={layer.color}
        metalness={isGlass ? 0.2 : 0.9}
        roughness={isGlass ? 0.08 : 0.32}
        transparent={isGlass}
        opacity={isGlass ? 0.35 : 1}
        emissive={layer.key === 'secure' ? PALETTE.teal : PALETTE.void}
        emissiveIntensity={layer.key === 'secure' ? 0.6 : 0}
        flatShading={!isGlass}
      />
    </mesh>
  )
}

export default function VaultDevice({ onExplodeChange }) {
  const [exploded, setExploded] = useState(false)
  const [hovered, setHovered] = useState(null)

  const toggle = () => {
    setExploded((v) => {
      const next = !v
      onExplodeChange?.(next)
      return next
    })
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 4]} intensity={1.2} color={PALETTE.mist} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color={PALETTE.indigo} />
      <pointLight position={[0, 1.5, 2.5]} intensity={7} color={PALETTE.teal} distance={10} />

      <DragGroup autoSpin={0.35} parallax={0.5} scale={1.1}>
        {LAYERS.map((layer) => (
          <Layer
            key={layer.key}
            layer={layer}
            exploded={exploded}
            hovered={hovered === layer.key}
            onHover={setHovered}
            onOut={(k) => setHovered((cur) => (cur === k ? null : cur))}
            onClick={toggle}
          />
        ))}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
          <ringGeometry args={[1.55, 1.62, 6]} />
          <meshBasicMaterial color={PALETTE.amber} transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 6]} position={[0, -1.36, 0]}>
          <ringGeometry args={[1.9, 1.93, 6]} />
          <meshBasicMaterial color={PALETTE.steel} transparent opacity={0.25} />
        </mesh>
      </DragGroup>
    </>
  )
}

export { LAYERS }
