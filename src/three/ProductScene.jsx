import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

/**
 * PRODUK - OBSIDIAN Vault K1.
 * Perangkat low-poly yang bisa diputar dengan drag dan "dibongkar" jadi
 * exploded view saat diklik, memperlihatkan lapisan di dalamnya.
 */
const LAYERS = [
  { id: 'shell', label: 'Titanium shell', offset: 1.15, color: PALETTE.slate, metal: 0.9, rough: 0.3 },
  { id: 'board', label: 'Secure element', offset: 0.35, color: PALETTE.carbon, metal: 0.5, rough: 0.6 },
  { id: 'core', label: 'Key core', offset: -0.45, color: PALETTE.teal, metal: 0.2, rough: 0.25 }
]

function Layer({ layer, index, exploded, onHover }) {
  const ref = useRef()
  const [hot, setHot] = useState(false)

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const y = exploded ? layer.offset : 0
    const t = state.clock.elapsedTime
    const drift = exploded ? Math.sin(t * 1.1 + index) * 0.02 : 0
    m.position.y = THREE.MathUtils.damp(m.position.y, y + drift, 6, dt)
  })

  const emissive = layer.id === 'core' ? PALETTE.teal : hot ? PALETTE.copper : PALETTE.indigo

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHot(true)
        onHover(layer.label)
      }}
      onPointerOut={() => {
        setHot(false)
        onHover(null)
      }}
    >
      {layer.id === 'shell' && (
        <mesh>
          <boxGeometry args={[1.5, 0.22, 2.6]} />
          <meshStandardMaterial
            color={layer.color}
            emissive={emissive}
            emissiveIntensity={hot ? 0.35 : 0.06}
            metalness={layer.metal}
            roughness={layer.rough}
            flatShading
          />
        </mesh>
      )}

      {layer.id === 'board' && (
        <group>
          <mesh>
            <boxGeometry args={[1.32, 0.08, 2.4]} />
            <meshStandardMaterial
              color={layer.color}
              emissive={emissive}
              emissiveIntensity={hot ? 0.3 : 0.1}
              metalness={layer.metal}
              roughness={layer.rough}
              flatShading
            />
          </mesh>
          {[-0.7, -0.2, 0.3, 0.8].map((z, i) => (
            <mesh key={i} position={[i % 2 ? 0.35 : -0.35, 0.09, z]}>
              <boxGeometry args={[0.3, 0.06, 0.3]} />
              <meshStandardMaterial
                color={PALETTE.steel}
                emissive={PALETTE.teal}
                emissiveIntensity={0.25}
                metalness={0.7}
                roughness={0.4}
                flatShading
              />
            </mesh>
          ))}
        </group>
      )}

      {layer.id === 'core' && (
        <group>
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <octahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial
              color={layer.color}
              emissive={PALETTE.teal}
              emissiveIntensity={hot ? 1.2 : 0.7}
              metalness={layer.metal}
              roughness={layer.rough}
              flatShading
            />
          </mesh>
          <mesh>
            <boxGeometry args={[1.5, 0.16, 2.6]} />
            <meshStandardMaterial
              color={PALETTE.carbon}
              metalness={0.85}
              roughness={0.35}
              flatShading
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

export default function ProductScene() {
  const [exploded, setExploded] = useState(false)
  const [, setLabel] = useState(null)

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[3, 6, 4]} intensity={1.15} color="#e8eef6" />
      <spotLight position={[-4, 5, -2]} angle={0.5} penumbra={0.8} intensity={0.9} color={PALETTE.indigo} />
      <pointLight position={[0, -2.5, 3]} intensity={0.45} color={PALETTE.copper} />

      <DragGroup autoSpin={0.22} parallax={1} hitRadius={3.4} maxPitch={0.7}>
        <group
          scale={1.05}
          onClick={(e) => (e.stopPropagation(), setExploded((v) => !v))}
        >
          {LAYERS.map((layer, i) => (
            <Layer key={layer.id} layer={layer} index={i} exploded={exploded} onHover={setLabel} />
          ))}
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
          <ringGeometry args={[1.7, 2.5, 6]} />
          <meshBasicMaterial color={PALETTE.steel} transparent opacity={0.16} side={THREE.DoubleSide} />
        </mesh>
      </DragGroup>
    </>
  )
}
