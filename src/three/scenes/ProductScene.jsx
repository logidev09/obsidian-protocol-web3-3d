import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Product — perangkat vault low-poly.
 * Interaksi: drag memutar 360°, dan tiap hotspot bisa di-hover/klik
 * untuk memunculkan label komponennya.
 */
const HOTSPOTS = [
  { id: 'se', label: 'Secure element EAL6+', pos: [0.62, 0.42, 0.19] },
  { id: 'air', label: 'Air-gapped signing', pos: [-0.6, -0.1, 0.19] },
  { id: 'bio', label: 'Biometric shard unlock', pos: [0.1, -0.72, 0.19] }
]

function Device({ active, setActive }) {
  const body = useMemo(() => roundedBoxGeometry(2.5, 3.9, 0.34, 0.34), [])
  const screen = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (screen.current) {
      screen.current.material.emissiveIntensity = 0.32 + Math.sin(t * 1.6) * 0.08
    }
  })

  return (
    <group>
      {/* bodi */}
      <mesh geometry={body} castShadow>
        <meshStandardMaterial color="#141a21" roughness={0.42} metalness={0.9} flatShading />
      </mesh>

      {/* garis tepi */}
      <lineSegments>
        <edgesGeometry args={[body]} />
        <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.35} />
      </lineSegments>

      {/* layar */}
      <mesh ref={screen} position={[0, 0.55, 0.185]}>
        <planeGeometry args={[1.9, 1.5]} />
        <meshStandardMaterial
          color="#0d1418"
          emissive={PALETTE.teal}
          emissiveIntensity={0.32}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {/* baris data di layar */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.35 + i * 0.02, 1.05 - i * 0.28, 0.192]}>
          <planeGeometry args={[1.1 - i * 0.18, 0.055]} />
          <meshBasicMaterial
            color={i === 0 ? PALETTE.sand : PALETTE.slate}
            transparent
            opacity={0.55 - i * 0.1}
          />
        </mesh>
      ))}

      {/* roda navigasi */}
      <mesh position={[0, -1.1, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.07, 6]} />
        <meshStandardMaterial color="#1c242c" roughness={0.35} metalness={0.95} flatShading />
      </mesh>
      <mesh position={[0, -1.1, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 6]} />
        <meshStandardMaterial
          color={PALETTE.ink}
          emissive={PALETTE.violet}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* port USB-C */}
      <mesh position={[0, -1.96, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.16]} />
        <meshStandardMaterial color="#0a0e12" metalness={1} roughness={0.25} />
      </mesh>

      {/* hotspot interaktif */}
      {HOTSPOTS.map((h) => {
        const on = active === h.id
        return (
          <group key={h.id} position={h.pos}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation()
                setActive(h.id)
              }}
              onPointerOut={() => setActive(null)}
            >
              <sphereGeometry args={[on ? 0.11 : 0.075, 12, 12]} />
              <meshStandardMaterial
                color={on ? PALETTE.sand : PALETTE.teal}
                emissive={on ? PALETTE.sand : PALETTE.teal}
                emissiveIntensity={on ? 1.6 : 0.7}
                toneMapped={false}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[0.16, 0.175, 24]} />
              <meshBasicMaterial
                color={on ? PALETTE.sand : PALETTE.steel}
                transparent
                opacity={on ? 0.8 : 0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function ProductScene({ onHotspot }) {
  const [active, setActive] = useState(null)

  const handle = (id) => {
    setActive(id)
    onHotspot?.(id ? HOTSPOTS.find((h) => h.id === id)?.label : null)
  }

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 6]} intensity={1.7} color="#e2ebf2" />
      <pointLight position={[-4, 1, -3]} intensity={20} color={PALETTE.violet} distance={14} />
      <pointLight position={[3, -4, 2]} intensity={12} color={PALETTE.teal} distance={12} />
      <DragGroup autoSpin={0.5} parallax={0.12} scale={0.95}>
        <Device active={active} setActive={handle} />
      </DragGroup>
    </>
  )
}

export { HOTSPOTS }
