import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import DragGroup from './DragGroup'
import { roundedBoxGeometry, PALETTE } from './geo'

function Hotspot({ position, label, onPick, active }) {
  const ref = useRef()
  const [hover, setHover] = useState(false)

  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.4) * 0.14
    const target = hover || active ? 1.45 : 1
    m.scale.setScalar(pulse * target)
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        onPick(label)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        onPick(null)
        document.body.style.cursor = ''
      }}
    >
      <octahedronGeometry args={[0.075, 0]} />
      <meshStandardMaterial
        color={active || hover ? PALETTE.teal : PALETTE.sand}
        emissive={active || hover ? PALETTE.teal : PALETTE.sand}
        emissiveIntensity={active || hover ? 1.4 : 0.55}
        flatShading
      />
    </mesh>
  )
}

/**
 * Perangkat vault low-poly. Drag untuk memutar 360°, arahkan mouse ke titik
 * emas untuk membaca komponennya.
 */
export default function VaultDevice({ onHotspot = () => {} }) {
  const [active, setActive] = useState(null)
  const shellGeo = useMemo(() => roundedBoxGeometry(1.85, 3.05, 0.42, 0.22), [])
  const screenGeo = useMemo(() => roundedBoxGeometry(1.5, 1.42, 0.04, 0.1), [])
  const glow = useRef()

  const pick = (label) => {
    setActive(label)
    onHotspot(label)
  }

  useFrame(({ clock }) => {
    if (glow.current) {
      glow.current.material.opacity = 0.42 + Math.sin(clock.getElapsedTime() * 1.6) * 0.14
    }
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 6]} intensity={1.3} color="#e6ecf8" />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color={PALETTE.indigo} />
      <pointLight position={[0, 0, 3]} intensity={12} distance={9} color={PALETTE.teal} />

      <DragGroup autoSpin={0.2} parallax={0.14} clampX={0.6}>
        <mesh geometry={shellGeo}>
          <meshStandardMaterial color="#1b212c" metalness={0.92} roughness={0.34} flatShading />
        </mesh>

        <mesh geometry={shellGeo} scale={[1.012, 1.008, 1.02]}>
          <meshBasicMaterial color="#5a6party" wireframe transparent opacity={0.16} />
        </mesh>

        <mesh geometry={screenGeo} position={[0, 0.52, 0.235]}>
          <meshStandardMaterial
            color="#0d131c"
            metalness={0.3}
            roughness={0.15}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.28}
          />
        </mesh>

        <mesh ref={glow} position={[0, 0.52, 0.262]}>
          <planeGeometry args={[1.34, 1.26]} />
          <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.45} />
        </mesh>

        <mesh position={[0, -0.72, 0.235]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 6]} />
          <meshStandardMaterial color={PALETTE.steel} metalness={0.95} roughness={0.28} flatShading />
        </mesh>

        <mesh position={[0, -0.72, 0.268]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.03, 6]} />
          <meshStandardMaterial
            color={PALETTE.teal}
            emissive={PALETTE.teal}
            emissiveIntensity={0.7}
            flatShading
          />
        </mesh>

        <mesh position={[0, -1.25, 0.235]}>
          <boxGeometry args={[0.9, 0.06, 0.03]} />
          <meshStandardMaterial color="#39424f" metalness={0.8} roughness={0.4} />
        </mesh>

        <mesh position={[0.98, 0.35, 0]}>
          <boxGeometry args={[0.09, 0.55, 0.2]} />
          <meshStandardMaterial color="#39424f" metalness={0.85} roughness={0.35} flatShading />
        </mesh>

        <mesh position={[-0.98, -0.15, 0]}>
          <boxGeometry args={[0.09, 0.34, 0.2]} />
          <meshStandardMaterial color="#39424f" metalness={0.85} roughness={0.35} flatShading />
        </mesh>

        <Hotspot
          position={[0.62, 1.28, 0.28]}
          label="SE-01 — secure element, EAL6+"
          onPick={pick}
          active={active === 'SE-01 — secure element, EAL6+'}
        />
        <Hotspot
          position={[-0.72, 0.1, 0.28]}
          label="OLED — verifikasi transaksi on-device"
          onPick={pick}
          active={active === 'OLED — verifikasi transaksi on-device'}
        />
        <Hotspot
          position={[0, -0.72, 0.33]}
          label="Biometric ring — unlock 0.3s"
          onPick={pick}
          active={active === 'Biometric ring — unlock 0.3s'}
        />
        <Hotspot
          position={[1.02, -0.6, 0.12]}
          label="Air-gap port — USB-C, data-blocked"
          onPick={pick}
          active={active === 'Air-gap port — USB-C, data-blocked'}
        />
      </DragGroup>
    </>
  )
}
