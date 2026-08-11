import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Produk: modul vault fisik yang tersusun dari beberapa lapis.
 * - Drag untuk memutar perangkat.
 * - Hover salah satu lapis → lapis itu terangkat & menyala (exploded view parsial).
 * - Klik → kunci lapis, seluruh modul memisah untuk memperlihatkan susunannya.
 */

const LAYERS = [
  { key: 'shell', label: 'Titanium shell', h: 0.2, color: PALETTE.slate, accent: PALETTE.steel },
  { key: 'secure', label: 'Secure element', h: 0.14, color: PALETTE.steel, accent: PALETTE.teal },
  { key: 'logic', label: 'Signing logic', h: 0.16, color: PALETTE.slate, accent: PALETTE.indigo },
  { key: 'power', label: 'Isolated power', h: 0.13, color: PALETTE.steel, accent: PALETTE.amber },
  { key: 'base', label: 'Tamper mesh', h: 0.22, color: PALETTE.slate, accent: PALETTE.teal }
]

function Layer({ layer, index, offsetY, hovered, locked, onHover, onOut, onClick }) {
  const ref = useRef()
  const geometry = useMemo(
    () => roundedBoxGeometry(2.2, layer.h, 1.4, 0.16),
    [layer.h]
  )
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 30), [geometry])

  const isActive = hovered === index || locked === index
  const anyLocked = locked !== null

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)

    const spread = anyLocked ? 0.34 : 0
    const lift = isActive ? 0.2 : 0
    const targetY = offsetY + index * spread * -1 + lift

    m.position.y = THREE.MathUtils.damp(m.position.y, targetY, 7, dt)
    m.position.x = THREE.MathUtils.damp(m.position.x, isActive ? 0.12 : 0, 7, dt)

    const mat = m.children[0].material
    mat.emissiveIntensity = THREE.MathUtils.damp(
      mat.emissiveIntensity,
      isActive ? 0.85 : 0.12,
      7,
      dt
    )
  })

  return (
    <group
      ref={ref}
      position={[0, offsetY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(index)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onOut(index)
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(index)
      }}
    >
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={layer.color}
          emissive={layer.accent}
          emissiveIntensity={0.12}
          roughness={0.38}
          metalness={0.88}
          flatShading
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial
          color={isActive ? layer.accent : PALETTE.steel}
          transparent
          opacity={isActive ? 0.85 : 0.3}
        />
      </lineSegments>
    </group>
  )
}

export default function VaultDevice({ onLayerChange }) {
  const [hovered, setHovered] = useState(null)
  const [locked, setLocked] = useState(null)

  const totalHeight = LAYERS.reduce((sum, l) => sum + l.h, 0)
  let cursor = totalHeight / 2
  const positions = LAYERS.map((l) => {
    const y = cursor - l.h / 2
    cursor -= l.h
    return y
  })

  const report = (index) => {
    onLayerChange?.(index === null ? null : LAYERS[index])
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} color={PALETTE.mist} />
      <directionalLight position={[-4, -3, -2]} intensity={0.45} color={PALETTE.indigo} />
      <spotLight
        position={[0, 5, 2]}
        angle={0.5}
        penumbra={0.9}
        intensity={18}
        color={PALETTE.teal}
      />

      <DragGroup autoSpin={0.35} parallax={0.5} scale={1.25}>
        {LAYERS.map((layer, i) => (
          <Layer
            key={layer.key}
            layer={layer}
            index={i}
            offsetY={positions[i]}
            hovered={hovered}
            locked={locked}
            onHover={(idx) => {
              setHovered(idx)
              report(idx)
            }}
            onOut={(idx) => {
              setHovered((cur) => (cur === idx ? null : cur))
              report(locked)
            }}
            onClick={(idx) => {
              const next = locked === idx ? null : idx
              setLocked(next)
              report(next ?? idx)
            }}
          />
        ))}

        {/* cincin dasar sebagai landasan visual */}
        <mesh position={[0, -totalHeight / 2 - 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.62, 6]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </DragGroup>
    </>
  )
}

export { LAYERS }
