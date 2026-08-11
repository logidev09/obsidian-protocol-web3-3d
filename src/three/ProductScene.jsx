import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, roundedBoxGeometry } from './geo'

/**
 * PRODUCT — perangkat vault fisik.
 * Interaksi: drag memutar 360°, klik pada tiga "hotspot" membuka label
 * komponen; hotspot ikut berdenyut saat hover.
 */

const HOTSPOTS = [
  { id: 'se', pos: [0.62, 0.42, 0.22], label: 'Secure Element EAL6+' },
  { id: 'nfc', pos: [-0.6, -0.1, 0.22], label: 'Air-gapped NFC' },
  { id: 'seed', pos: [0.1, -0.62, 0.22], label: 'Shamir seed shards' }
]

function Hotspot({ pos, active, onSelect }) {
  const ref = useRef()
  const [hover, setHover] = useState(false)

  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.18
    const s = (active ? 1.5 : hover ? 1.3 : 1) * pulse
    ref.current.scale.setScalar(s)
  })

  return (
    <mesh
      ref={ref}
      position={pos}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ''
      }}
    >
      <sphereGeometry args={[0.055, 16, 16]} />
      <meshBasicMaterial color={active ? PALETTE.sand : PALETTE.teal} />
    </mesh>
  )
}

function Device({ active, setActive }) {
  const body = useMemo(() => roundedBoxGeometry(2.1, 3.2, 0.34, 0.28), [])
  const screen = useMemo(() => roundedBoxGeometry(1.66, 1.5, 0.06, 0.14), [])
  const shell = useRef()

  useFrame((state, delta) => {
    shell.current.material.opacity = THREE.MathUtils.damp(
      shell.current.material.opacity,
      active ? 0.28 : 0.12,
      4,
      Math.min(delta, 0.05)
    )
  })

  return (
    <group>
      <mesh geometry={body} castShadow>
        <meshStandardMaterial
          color={PALETTE.ink}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      <mesh ref={shell} geometry={body} scale={1.04}>
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.12} />
      </mesh>

      <mesh geometry={screen} position={[0, 0.52, 0.19]}>
        <meshStandardMaterial
          color="#0a1418"
          metalness={0.2}
          roughness={0.15}
          emissive={PALETTE.teal}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* tombol fisik */}
      <mesh position={[0, -1.05, 0.19]}>
        <cylinderGeometry args={[0.26, 0.26, 0.06, 6]} />
        <meshStandardMaterial color={PALETTE.steel} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.05, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.012, 8, 32]} />
        <meshBasicMaterial color={PALETTE.sand} transparent opacity={0.8} />
      </mesh>

      {HOTSPOTS.map((h) => (
        <Hotspot
          key={h.id}
          pos={h.pos}
          active={active === h.id}
          onSelect={() => setActive(active === h.id ? null : h.id)}
        />
      ))}
    </group>
  )
}

export default function ProductScene({ onHotspot }) {
  const [active, setActive] = useState(null)

  const select = (id) => {
    setActive(id)
    onHotspot?.(HOTSPOTS.find((h) => h.id === id)?.label ?? null)
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.3} />
      <pointLight position={[-4, 0, 3]} intensity={14} distance={12} color={PALETTE.violet} />
      <pointLight position={[4, -2, 2]} intensity={10} distance={10} color={PALETTE.teal} />

      <DragGroup autoSpin={0.35} parallax={0.14} scale={1.05}>
        <Device active={active} setActive={select} />
      </DragGroup>
    </>
  )
}

export { HOTSPOTS }
