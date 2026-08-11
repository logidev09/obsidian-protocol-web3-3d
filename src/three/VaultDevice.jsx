import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, damp, roundedBoxGeometry } from './geo'

const HOTSPOTS = [
  { id: 'se', label: 'Secure element', position: [0.62, 0.42, 0.19], color: PALETTE.teal },
  { id: 'air', label: 'Air-gapped link', position: [-0.62, 0.02, 0.19], color: PALETTE.indigo },
  { id: 'shard', label: 'Shard backup', position: [0.1, -0.72, 0.19], color: PALETTE.sand }
]

function Hotspot({ node, active, onEnter, onLeave }) {
  const ring = useRef()

  useFrame(({ clock }, dt) => {
    const step = Math.min(dt, 0.05)
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.4) * 0.12
    const target = active ? 1.5 : pulse
    if (ring.current) {
      const s = damp(ring.current.scale.x, target, 8, step)
      ring.current.scale.setScalar(s)
    }
  })

  return (
    <group position={node.position}>
      <mesh
        ref={ring}
        onPointerOver={(e) => {
          e.stopPropagation()
          onEnter(node.id)
        }}
        onPointerOut={() => onLeave(node.id)}
      >
        <torusGeometry args={[0.07, 0.018, 8, 24]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={active ? 1.4 : 0.5}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[0.028, 16]} />
        <meshBasicMaterial color={node.color} />
      </mesh>
    </group>
  )
}

function Device({ onHotspot }) {
  const body = useMemo(() => roundedBoxGeometry(1.7, 2.6, 0.34, 0.22), [])
  const screen = useMemo(() => roundedBoxGeometry(1.34, 1.5, 0.04, 0.1), [])
  const [active, setActive] = useState(null)
  const glow = useRef()

  useFrame(({ clock }, dt) => {
    const step = Math.min(dt, 0.05)
    if (!glow.current) return
    const target = active ? 0.9 : 0.4 + Math.sin(clock.getElapsedTime() * 1.6) * 0.08
    glow.current.material.emissiveIntensity = damp(
      glow.current.material.emissiveIntensity,
      target,
      6,
      step
    )
  })

  const enter = (id) => {
    setActive(id)
    onHotspot?.(HOTSPOTS.find((h) => h.id === id)?.label ?? null)
    document.body.style.cursor = 'pointer'
  }

  const leave = () => {
    setActive(null)
    onHotspot?.(null)
    document.body.style.cursor = ''
  }

  return (
    <group>
      <mesh geometry={body}>
        <meshStandardMaterial color="#161c26" roughness={0.42} metalness={0.85} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[body]} />
        <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.55} />
      </lineSegments>

      <mesh ref={glow} geometry={screen} position={[0, 0.36, 0.18]}>
        <meshStandardMaterial
          color="#0b1017"
          emissive={PALETTE.indigo}
          emissiveIntensity={0.4}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.45 + i * 0.3, -0.02, 0.205]}>
          <boxGeometry args={[0.16, 0.02, 0.006]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.35 + i * 0.12} />
        </mesh>
      ))}

      <mesh position={[0, -1.04, 0.19]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 6]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#0e131b" roughness={0.3} metalness={0.9} />
      </mesh>

      {HOTSPOTS.map((node) => (
        <Hotspot
          key={node.id}
          node={node}
          active={active === node.id}
          onEnter={enter}
          onLeave={leave}
        />
      ))}
    </group>
  )
}

export default function VaultDevice({ onHotspot }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 6]} intensity={1.3} color="#dbe3f0" />
      <pointLight position={[-4, 2, 3]} intensity={26} distance={14} color={PALETTE.violet} />
      <pointLight position={[3, -3, 2]} intensity={18} distance={12} color={PALETTE.teal} />

      <DragGroup autoSpin={0.08} parallax={0.1} clampX={0.6}>
        <Device onHotspot={onHotspot} />
      </DragGroup>
    </>
  )
}
