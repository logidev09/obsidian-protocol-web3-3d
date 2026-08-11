import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import Lights from './Lights'
import { PALETTE, lerp } from './geo'

const PARTS = [
  { id: 'shell', label: 'Titanium shell', offset: [0, 0.9, 0] },
  { id: 'board', label: 'Secure element', offset: [0, 0, 0] },
  { id: 'screen', label: 'E-ink display', offset: [0, 0.32, 0.55] },
  { id: 'port', label: 'Air-gap port', offset: [0, -0.85, 0] }
]

/**
 * Perangkat vault: drag untuk memutar, klik untuk membongkar
 * (exploded view), hover tiap bagian untuk melihat namanya.
 */
export default function ProductScene({ exploded, onToggle, onHoverPart }) {
  const [active, setActive] = useState(null)
  const refs = useRef({})
  const glow = useRef()

  const materials = useMemo(
    () => ({
      metal: new THREE.MeshStandardMaterial({
        color: '#161d25',
        metalness: 0.92,
        roughness: 0.32
      }),
      inner: new THREE.MeshStandardMaterial({
        color: '#0d141b',
        metalness: 0.6,
        roughness: 0.5,
        flatShading: true
      }),
      screen: new THREE.MeshStandardMaterial({
        color: '#0a0f14',
        emissive: PALETTE.teal,
        emissiveIntensity: 0.5,
        metalness: 0.2,
        roughness: 0.6
      })
    }),
    []
  )

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05) * 4
    const t = state.clock.elapsedTime

    PARTS.forEach((part) => {
      const mesh = refs.current[part.id]
      if (!mesh) return
      const factor = exploded ? 1 : 0
      const lift = active === part.id ? 0.12 : 0
      mesh.position.x = lerp(mesh.position.x, part.offset[0] * factor, step)
      mesh.position.y = lerp(mesh.position.y, part.offset[1] * factor + lift, step)
      mesh.position.z = lerp(mesh.position.z, part.offset[2] * factor, step)
    })

    if (glow.current) {
      glow.current.material.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.12
    }
  })

  const bind = (id) => ({
    ref: (el) => (refs.current[id] = el),
    onPointerOver: (e) => {
      e.stopPropagation()
      setActive(id)
      onHoverPart?.(PARTS.find((p) => p.id === id)?.label ?? null)
    },
    onPointerOut: () => {
      setActive((prev) => (prev === id ? null : prev))
      onHoverPart?.(null)
    },
    onClick: (e) => {
      e.stopPropagation()
      onToggle()
    }
  })

  return (
    <>
      <Lights intensity={1.05} />
      <DragGroup autoSpin={0.22} sensitivity={0.006}>
        {/* badan atas */}
        <mesh {...bind('shell')} material={materials.metal}>
          <boxGeometry args={[1.5, 0.42, 2.6]} />
        </mesh>

        {/* papan internal */}
        <group {...bind('board')}>
          <mesh material={materials.inner}>
            <boxGeometry args={[1.34, 0.2, 2.4]} />
          </mesh>
          <mesh ref={glow} position={[0, 0.16, -0.3]}>
            <boxGeometry args={[0.5, 0.1, 0.5]} />
            <meshStandardMaterial
              color="#111820"
              emissive={PALETTE.indigo}
              emissiveIntensity={0.4}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0.42, 0.14, 0.6]}>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 6]} />
            <meshStandardMaterial
              color="#1b242e"
              emissive={PALETTE.amber}
              emissiveIntensity={0.35}
              metalness={0.8}
              roughness={0.3}
              flatShading
            />
          </mesh>
        </group>

        {/* layar */}
        <mesh {...bind('screen')} material={materials.screen} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[1.05, 1.3, 0.06]} />
        </mesh>

        {/* port bawah */}
        <group {...bind('port')}>
          <mesh material={materials.metal}>
            <boxGeometry args={[1.5, 0.34, 2.6]} />
          </mesh>
          <mesh position={[0, -0.2, 1.28]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.16, 8]} />
            <meshStandardMaterial color="#0e151c" metalness={0.9} roughness={0.25} flatShading />
          </mesh>
        </group>

        {/* bingkai wireframe sebagai aksen teknis */}
        <mesh scale={[1.05, 1.6, 1.05]}>
          <boxGeometry args={[1.6, 0.9, 2.75]} />
          <meshBasicMaterial color={PALETTE.steel} wireframe transparent opacity={0.16} />
        </mesh>
      </DragGroup>
    </>
  )
}
