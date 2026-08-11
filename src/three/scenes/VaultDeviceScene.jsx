import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

const BODY = roundedBoxGeometry(2.6, 0.34, 1.7, 0.26)
const PLATE = roundedBoxGeometry(2.3, 0.12, 1.45, 0.2)
const SCREEN = roundedBoxGeometry(1.5, 0.06, 0.72, 0.1)

/** Satu lapisan perangkat — naik terpisah saat mode "exploded". */
function Layer({ geometry, y, open, color, emissive, emissiveIntensity = 0.2, offset = 0 }) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const target = open ? y + offset : y
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, target, 5, dt)
    ref.current.rotation.y = THREE.MathUtils.damp(
      ref.current.rotation.y,
      open ? Math.sin(t * 0.4 + offset) * 0.08 : 0,
      3,
      dt
    )
  })

  return (
    <mesh ref={ref} geometry={geometry} position={[0, y, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        emissive={emissive || '#000000'}
        emissiveIntensity={emissiveIntensity}
        roughness={0.34}
        metalness={0.9}
      />
    </mesh>
  )
}

/** Deretan pin konektor — detail kecil yang bikin siluetnya terasa "hardware". */
function Pins() {
  return (
    <group position={[0, -0.02, 0.9]}>
      {new Array(9).fill(0).map((_, i) => (
        <mesh key={i} position={[(i - 4) * 0.16, 0, 0]}>
          <boxGeometry args={[0.06, 0.05, 0.12]} />
          <meshStandardMaterial color={PALETTE.amber} metalness={1} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Scene produk — vault fisik.
 * Klik untuk membongkar lapisannya, drag untuk memutar.
 */
export default function VaultDeviceScene() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const halo = useRef()

  useFrame((state, delta) => {
    if (!halo.current) return
    const dt = Math.min(delta, 0.05)
    halo.current.material.opacity = THREE.MathUtils.damp(
      halo.current.material.opacity,
      hovered || open ? 0.3 : 0.12,
      4,
      dt
    )
    halo.current.rotation.z = state.clock.elapsedTime * 0.15
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 7, 4]} intensity={1.6} castShadow />
      <pointLight position={[-4, 2, -4]} intensity={18} color={PALETTE.indigo} distance={16} />
      <pointLight position={[2, -3, 3]} intensity={10} color={PALETTE.teal} distance={12} />

      <DragGroup autoSpin={0.22} parallax={0.8} scale={1}>
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => setOpen((v) => !v)}
          rotation={[0.25, 0, 0]}
        >
          <Layer geometry={BODY} y={-0.35} open={open} color={PALETTE.slate} offset={-0.45} />
          <Layer
            geometry={PLATE}
            y={-0.05}
            open={open}
            color={PALETTE.steel}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.18}
            offset={0.1}
          />
          <Layer
            geometry={SCREEN}
            y={0.16}
            open={open}
            color="#0b1116"
            emissive={PALETTE.teal}
            emissiveIntensity={0.7}
            offset={0.6}
          />
          <Pins />

          <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
            <ringGeometry args={[1.5, 2.25, 6]} />
            <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.12} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </DragGroup>
    </>
  )
}
