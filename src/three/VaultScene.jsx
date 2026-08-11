import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

/**
 * SECTION 2 — Perangkat vault.
 * Drag untuk memutar. Hover / klik untuk "exploded view":
 * lapisan-lapisan perangkat memisah dan menampilkan strukturnya.
 */

const LAYERS = [
  { key: 'shell-top', y: 0.30, size: [2.2, 0.14, 1.3], color: PALETTE.steel, lift: 0.95 },
  { key: 'display', y: 0.14, size: [1.5, 0.06, 0.82], color: PALETTE.slate, lift: 0.55, glow: PALETTE.teal },
  { key: 'logic', y: -0.02, size: [2.0, 0.1, 1.15], color: PALETTE.carbon, lift: 0.18, glow: PALETTE.indigo },
  { key: 'secure-element', y: -0.18, size: [0.7, 0.12, 0.7], color: PALETTE.copper, lift: -0.2, glow: PALETTE.copper },
  { key: 'shell-base', y: -0.34, size: [2.2, 0.16, 1.3], color: PALETTE.steel, lift: -0.65 }
]

function Layer({ layer, open, index }) {
  const ref = useRef()
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(...layer.size)),
    [layer.size]
  )

  useFrame((state, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const target = open ? layer.y + layer.lift : layer.y
    m.position.y = THREE.MathUtils.damp(m.position.y, target, 5, dt)
    const drift = open ? Math.sin(t * 0.8 + index) * 0.05 : 0
    m.rotation.y = THREE.MathUtils.damp(m.rotation.y, drift, 4, dt)
  })

  return (
    <group ref={ref} position={[0, layer.y, 0]}>
      <mesh castShadow={false}>
        <boxGeometry args={layer.size} />
        <meshStandardMaterial
          color={layer.color}
          emissive={layer.glow || '#000000'}
          emissiveIntensity={layer.glow ? (open ? 0.55 : 0.22) : 0}
          roughness={0.34}
          metalness={0.82}
          flatShading
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={PALETTE.mist} transparent opacity={open ? 0.5 : 0.22} />
      </lineSegments>
    </group>
  )
}

function Device() {
  const [open, setOpen] = useState(false)
  const ring = useRef()

  useFrame((state, delta) => {
    if (!ring.current) return
    const dt = Math.min(delta, 0.05)
    ring.current.rotation.z += dt * (open ? 0.5 : 0.18)
    const s = THREE.MathUtils.damp(ring.current.scale.x, open ? 1.18 : 1, 5, dt)
    ring.current.scale.setScalar(s)
  })

  return (
    <DragGroup autoSpin={0.22} parallax={0.6} maxPitch={0.7}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        onPointerOut={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        {LAYERS.map((layer, i) => (
          <Layer key={layer.key} layer={layer} open={open} index={i} />
        ))}

        {/* area tangkap pointer supaya hover terasa stabil */}
        <mesh visible={false}>
          <boxGeometry args={[2.6, 2.2, 1.7]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
        <ringGeometry args={[1.55, 1.58, 6]} />
        <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </DragGroup>
  )
}

export default function VaultScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 7, 4]} intensity={1.1} color={PALETTE.mist} />
      <pointLight position={[-4, 1, 4]} intensity={18} distance={16} color={PALETTE.indigo} />
      <pointLight position={[3, -2, -3]} intensity={14} distance={14} color={PALETTE.copper} />
      <Device />
    </>
  )
}
