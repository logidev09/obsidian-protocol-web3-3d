import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry, seededRandom } from '../geo'

/**
 * Product: perangkat OBSIDIAN VAULT.
 * Klik perangkat → "exploded view": lapisan terpisah dan label komponen muncul.
 * Klik lagi → menyatu kembali. Drag tetap memutar seperti scene lain.
 */
const LAYERS = [
  { id: 'shell', label: 'Titanium shell', offset: 0.95, color: PALETTE.steel, thickness: 0.16 },
  { id: 'board', label: 'Secure element', offset: 0.0, color: PALETTE.slate, thickness: 0.1 },
  { id: 'cell', label: 'Air-gap module', offset: -0.95, color: PALETTE.ink, thickness: 0.16 }
]

function Layer({ layer, open, index }) {
  const ref = useRef()
  const geo = useMemo(
    () => roundedBoxGeometry(2.5, 1.55, layer.thickness, 0.22),
    [layer.thickness]
  )

  useFrame((frame, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime
    const targetZ = open ? layer.offset : 0
    const float = open ? Math.sin(t * 1.4 + index) * 0.02 : 0
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, targetZ, 5, dt)
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, float, 5, dt)
  })

  return (
    <group ref={ref}>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={layer.color}
          roughness={0.34}
          metalness={0.9}
          flatShading
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geo]} />
        <lineBasicMaterial
          color={open ? PALETTE.teal : PALETTE.mist}
          transparent
          opacity={open ? 0.75 : 0.3}
        />
      </lineSegments>
    </group>
  )
}

/** Jejak sirkuit di atas papan — murni garis, sangat murah dirender. */
function Traces() {
  const geo = useMemo(() => {
    const rand = seededRandom(3312)
    const pts = []
    for (let i = 0; i < 26; i++) {
      let x = (rand() - 0.5) * 2.1
      let y = (rand() - 0.5) * 1.25
      let prev = new THREE.Vector3(x, y, 0.07)
      const steps = 2 + Math.floor(rand() * 3)
      for (let s = 0; s < steps; s++) {
        const horizontal = rand() > 0.5
        const len = 0.14 + rand() * 0.4
        x += horizontal ? len * (rand() > 0.5 ? 1 : -1) : 0
        y += horizontal ? 0 : len * (rand() > 0.5 ? 1 : -1)
        const next = new THREE.Vector3(
          THREE.MathUtils.clamp(x, -1.1, 1.1),
          THREE.MathUtils.clamp(y, -0.65, 0.65),
          0.07
        )
        pts.push(prev.clone(), next.clone())
        prev = next
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  const ref = useRef()
  useFrame((frame) => {
    if (ref.current) {
      ref.current.material.opacity = 0.35 + Math.sin(frame.clock.elapsedTime * 2) * 0.12
    }
  })

  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial color={PALETTE.teal} transparent opacity={0.4} />
    </lineSegments>
  )
}

function Device({ open, setOpen }) {
  const screen = useRef()

  useFrame((frame) => {
    if (screen.current) {
      const t = frame.clock.elapsedTime
      screen.current.material.emissiveIntensity = 0.6 + Math.sin(t * 1.8) * 0.18
    }
  })

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        setOpen((v) => !v)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {LAYERS.map((l, i) => (
        <Layer key={l.id} layer={l} open={open} index={i} />
      ))}

      <group position={[0, 0, open ? 0 : 0]}>
        <Traces />
      </group>

      {/* layar e-ink kecil di shell depan */}
      <mesh ref={screen} position={[0, 0.28, open ? 1.04 : 0.09]}>
        <planeGeometry args={[1.5, 0.62]} />
        <meshStandardMaterial
          color={PALETTE.void}
          emissive={PALETTE.teal}
          emissiveIntensity={0.6}
          roughness={0.6}
        />
      </mesh>
    </group>
  )
}

export default function ProductDevice({ onToggle }) {
  const [open, setOpen] = useState(false)

  const handle = (updater) => {
    setOpen((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      onToggle?.(next)
      return next
    })
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} color={PALETTE.mist} />
      <pointLight position={[-4, 1, 2]} intensity={18} color={PALETTE.indigo} distance={14} />
      <pointLight position={[2, -2, 3]} intensity={10} color={PALETTE.sand} distance={10} />

      <DragGroup autoSpin={0.5} parallax={0.35} scale={1.02}>
        <Device open={open} setOpen={handle} />
      </DragGroup>
    </>
  )
}
