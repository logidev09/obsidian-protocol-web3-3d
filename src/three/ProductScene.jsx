import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

/**
 * SECTION 2 - perangkat vault.
 * Tiga lapis bodi yang "meledak" terpisah saat di-hover / diklik,
 * plus label titik yang menyala mengikuti lapisan aktif.
 */

const LAYERS = [
  { key: 'shell', y: 0.62, label: 'Titanium shell', color: PALETTE.slate },
  { key: 'board', y: 0, label: 'Secure element', color: PALETTE.carbon },
  { key: 'base', y: -0.62, label: 'Air-gap base', color: PALETTE.slate }
]

function Layer({ layer, index, exploded, active, onHover }) {
  const ref = useRef()
  const isActive = active === layer.key

  useFrame((frame, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    const spread = exploded ? 1 : 0.34
    const targetY = layer.y * spread + (isActive ? 0.06 : 0)
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, targetY, 6, dt)
    ref.current.rotation.y = THREE.MathUtils.damp(
      ref.current.rotation.y,
      exploded ? index * 0.12 : 0,
      4,
      dt
    )
  })

  return (
    <group ref={ref}>
      <mesh
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(layer.key)
        }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[2.4, 0.42, 1.5]} />
        <meshStandardMaterial
          color={layer.color}
          emissive={isActive ? PALETTE.teal : PALETTE.ink}
          emissiveIntensity={isActive ? 0.5 : 0.08}
          roughness={0.36}
          metalness={0.88}
        />
      </mesh>

      {/* garis tepi tegas khas render produk */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.4, 0.42, 1.5)]} />
        <lineBasicMaterial color={PALETTE.mist} transparent opacity={isActive ? 0.6 : 0.22} />
      </lineSegments>

      {layer.key === 'board' && (
        <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 0.9]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function Device() {
  const [active, setActive] = useState(null)
  const [exploded, setExploded] = useState(false)
  const ringRef = useRef()

  useFrame((frame, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += Math.min(delta, 0.05) * 0.15
  })

  return (
    <DragGroup autoSpin={0.22} parallax={0.7} maxPitch={0.42}>
      <group
        onClick={(e) => {
          e.stopPropagation()
          setExploded((v) => !v)
        }}
      >
        {LAYERS.map((layer, i) => (
          <Layer
            key={layer.key}
            layer={layer}
            index={i}
            exploded={exploded || active !== null}
            active={active}
            onHover={setActive}
          />
        ))}
      </group>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <ringGeometry args={[1.9, 1.94, 6]} />
        <meshBasicMaterial color={PALETTE.copper} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </DragGroup>
  )
}

export default function ProductScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.3} color={PALETTE.mist} />
      <spotLight position={[-4, 5, 2]} angle={0.5} penumbra={0.8} intensity={40} color={PALETTE.indigo} />
      <pointLight position={[0, -3, 3]} intensity={14} distance={14} color={PALETTE.teal} />
      <Device />
    </>
  )
}
