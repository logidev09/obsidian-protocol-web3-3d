import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

/**
 * SECTION 2 - perangkat vault.
 * Hardware key low-poly yang bisa diputar bebas dengan drag, dan bisa
 * "dibongkar": klik untuk memisahkan lapisannya jadi exploded view.
 */

function Layer({ index, exploded, color, size, emissive = 0, children }) {
  const ref = useRef()
  const [hover, setHover] = useState(false)

  useFrame((frame, delta) => {
    const m = ref.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const gap = exploded ? index * 0.62 : 0
    const lift = hover && exploded ? 0.12 : 0
    m.position.y = THREE.MathUtils.damp(m.position.y, gap + lift, 5, dt)
  })

  return (
    <mesh
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
      }}
      onPointerOut={() => setHover(false)}
    >
      {children}
      <meshStandardMaterial
        color={color}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={hover ? emissive + 0.25 : emissive}
        roughness={0.32}
        metalness={0.85}
        flatShading
      />
    </mesh>
  )
}

function Device() {
  const [exploded, setExploded] = useState(false)
  const ring = useRef()

  useFrame((frame, delta) => {
    if (ring.current) ring.current.rotation.z += Math.min(delta, 0.05) * 0.5
  })

  return (
    <DragGroup autoSpin={0.24} parallax={0.7} maxPitch={0.6} hitRadius={3}>
      <group
        onClick={(e) => {
          e.stopPropagation()
          setExploded((v) => !v)
        }}
      >
        <Layer index={-1} exploded={exploded} color={PALETTE.carbon} size={1}>
          <cylinderGeometry args={[1.15, 1.15, 0.28, 6]} />
        </Layer>

        <Layer index={0} exploded={exploded} color={PALETTE.slate}>
          <cylinderGeometry args={[1.05, 1.05, 0.34, 6]} />
        </Layer>

        <Layer index={1} exploded={exploded} color={PALETTE.steel}>
          <cylinderGeometry args={[0.86, 0.86, 0.2, 6]} />
        </Layer>

        <Layer index={2} exploded={exploded} color={PALETTE.teal} emissive={0.4}>
          <octahedronGeometry args={[0.5, 0]} />
        </Layer>
      </group>

      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.75, 0.012, 3, 64]} />
        <meshBasicMaterial color={PALETTE.steel} transparent opacity={0.4} />
      </mesh>

      <mesh rotation={[Math.PI / 2.4, 0.4, 0]}>
        <torusGeometry args={[2.05, 0.008, 3, 64]} />
        <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.3} />
      </mesh>
    </DragGroup>
  )
}

export default function ProductScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 4]} intensity={1.2} color={PALETTE.mist} />
      <pointLight position={[-4, 1, 4]} intensity={20} distance={16} color={PALETTE.copper} />
      <pointLight position={[3, -3, -3]} intensity={16} distance={14} color={PALETTE.indigo} />
      <Device />
    </>
  )
}
