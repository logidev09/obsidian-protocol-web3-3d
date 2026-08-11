import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import DragGroup from '../DragGroup'
import { PALETTE, damp, roundedBoxGeometry } from '../geo'

/**
 * PRODUK — "OBSIDIAN Key", perangkat penyimpan kunci.
 * Dibangun dari primitif + rounded-box hasil extrude (bukan model eksternal),
 * jadi tidak ada aset yang perlu di-load. Klik hotspot untuk memisah bagian.
 */
function Hotspot({ position, label, active, onSelect }) {
  const ring = useRef()
  const [hover, setHover] = useState(false)

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = active || hover ? 1.35 : 1
    const s = damp(ring.current.scale.x, target, 8, dt)
    ring.current.scale.setScalar(s)
    ring.current.rotation.z += dt * (hover ? 1.2 : 0.35)
  })

  return (
    <group position={position}>
      <mesh
        ref={ring}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(label)
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
        <ringGeometry args={[0.09, 0.125, 6]} />
        <meshBasicMaterial
          color={active ? PALETTE.sand : PALETTE.teal}
          transparent
          opacity={active || hover ? 0.95 : 0.55}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[0.045, 6]} />
        <meshBasicMaterial color={active ? PALETTE.sand : PALETTE.teal} />
      </mesh>
    </group>
  )
}

function Device({ exploded, active }) {
  const bodyGeo = useMemo(() => roundedBoxGeometry(2.4, 3.9, 0.42, 0.28), [])
  const plateGeo = useMemo(() => roundedBoxGeometry(2.02, 2.1, 0.06, 0.14), [])

  const shell = useRef()
  const screen = useRef()
  const chip = useRef()
  const dial = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const e = exploded ? 1 : 0

    screen.current.position.z = damp(screen.current.position.z, 0.26 + e * 0.5, 5, dt)
    chip.current.position.z = damp(chip.current.position.z, -0.26 - e * 0.55, 5, dt)
    chip.current.rotation.z += dt * 0.4
    dial.current.position.y = damp(dial.current.position.y, 1.55 + e * 0.35, 5, dt)
    dial.current.rotation.x += dt * (active === 'Secure element' ? 1.6 : 0.5)
    shell.current.rotation.z = Math.sin(t * 0.4) * 0.02
  })

  return (
    <group ref={shell}>
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#0d141c" roughness={0.38} metalness={0.9} flatShading />
      </mesh>

      <mesh ref={screen} geometry={plateGeo} position={[0, 0.35, 0.26]}>
        <meshStandardMaterial
          color="#101a24"
          roughness={0.16}
          metalness={0.5}
          emissive={PALETTE.teal}
          emissiveIntensity={active === 'Display' ? 0.55 : 0.2}
        />
      </mesh>

      <mesh ref={chip} position={[0, -0.2, -0.26]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color={PALETTE.indigo}
          roughness={0.25}
          metalness={0.7}
          flatShading
          emissive={PALETTE.indigo}
          emissiveIntensity={active === 'Secure element' ? 0.6 : 0.22}
        />
      </mesh>

      <mesh ref={dial} position={[0, 1.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.3, 8]} />
        <meshStandardMaterial color="#1a2430" roughness={0.3} metalness={0.95} flatShading />
      </mesh>

      <mesh position={[0, -1.62, 0.05]}>
        <boxGeometry args={[0.72, 0.14, 0.3]} />
        <meshStandardMaterial
          color={PALETTE.sand}
          roughness={0.45}
          metalness={0.6}
          emissive={PALETTE.sand}
          emissiveIntensity={active === 'Air-gapped port' ? 0.4 : 0.08}
        />
      </mesh>
    </group>
  )
}

export default function KeyDevice({ onSelect, active }) {
  const [exploded, setExploded] = useState(false)

  const pick = (label) => {
    setExploded(true)
    onSelect?.(label)
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 6]} intensity={1.7} />
      <pointLight position={[-4, 1, 3]} intensity={18} color={PALETTE.violet} distance={16} />
      <pointLight position={[4, -3, 2]} intensity={12} color={PALETTE.teal} distance={14} />

      <DragGroup autoSpin={0.08} parallax={0.18} clampX={0.5} scale={0.92}>
        <Device exploded={exploded} active={active} />
        <Hotspot position={[0.9, 1.05, 0.55]} label="Display" active={active === 'Display'} onSelect={pick} />
        <Hotspot
          position={[-0.85, -0.25, 0.55]}
          label="Secure element"
          active={active === 'Secure element'}
          onSelect={pick}
        />
        <Hotspot
          position={[0.55, -1.62, 0.5]}
          label="Air-gapped port"
          active={active === 'Air-gapped port'}
          onSelect={pick}
        />
      </DragGroup>
    </>
  )
}
