import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

/**
 * PRODUK — modul vault perangkat keras.
 * Klik untuk membongkar (exploded view): tiga lapis bergeser terpisah dan
 * label teknis muncul. Klik lagi untuk merapatkan kembali.
 */
function Layer({ offset, exploded, children }) {
  const ref = useRef()

  useFrame((_, delta) => {
    const g = ref.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const target = exploded ? offset : 0
    g.position.y = THREE.MathUtils.damp(g.position.y, target, 5, dt)
  })

  return <group ref={ref}>{children}</group>
}

function Chassis() {
  return (
    <mesh castShadow>
      <boxGeometry args={[2.6, 0.32, 1.7]} />
      <meshStandardMaterial
        color={PALETTE.carbon}
        roughness={0.42}
        metalness={0.8}
        flatShading
      />
    </mesh>
  )
}

function SecureElement({ hot }) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.material.emissiveIntensity = THREE.MathUtils.damp(
      ref.current.material.emissiveIntensity,
      hot ? 0.9 : 0.3 + Math.sin(t * 1.4) * 0.08,
      6,
      Math.min(delta, 0.05)
    )
  })

  return (
    <group>
      <mesh>
        <boxGeometry args={[2.3, 0.18, 1.45]} />
        <meshStandardMaterial color={PALETTE.slate} roughness={0.5} metalness={0.6} flatShading />
      </mesh>
      <mesh ref={ref} position={[0, 0.14, 0]}>
        <boxGeometry args={[0.75, 0.1, 0.75]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          emissive={PALETTE.teal}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.12, 0]}>
          <boxGeometry args={[0.32, 0.06, 0.9]} />
          <meshStandardMaterial color={PALETTE.copper} roughness={0.35} metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Faceplate({ hot }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[2.6, 0.16, 1.7]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          roughness={0.28}
          metalness={0.9}
          flatShading
        />
      </mesh>
      {/* jendela display */}
      <mesh position={[0, 0.09, -0.25]}>
        <boxGeometry args={[1.5, 0.02, 0.62]} />
        <meshStandardMaterial
          color="#080c10"
          emissive={PALETTE.teal}
          emissiveIntensity={hot ? 0.5 : 0.2}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>
      {/* tombol konfirmasi fisik */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.11, 0.52]}>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 6]} />
          <meshStandardMaterial color={PALETTE.copper} roughness={0.4} metalness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

export default function ProductScene() {
  const [exploded, setExploded] = useState(false)
  const [hot, setHot] = useState(false)

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 7, 4]} intensity={1.2} color="#e6edf3" />
      <pointLight position={[-4, 2, -3]} intensity={0.6} color={PALETTE.indigo} />
      <spotLight position={[0, 6, 2]} angle={0.5} penumbra={0.8} intensity={0.8} color={PALETTE.teal} />

      <DragGroup autoSpin={0.22} parallax={0.6} hitRadius={3}>
        <group
          rotation={[0.42, 0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            setExploded((v) => !v)
          }}
          onPointerOver={() => setHot(true)}
          onPointerOut={() => setHot(false)}
        >
          <Layer offset={-0.75} exploded={exploded}>
            <Chassis />
          </Layer>
          <Layer offset={0} exploded={exploded}>
            <SecureElement hot={hot} />
          </Layer>
          <Layer offset={0.85} exploded={exploded}>
            <Faceplate hot={hot} />
          </Layer>

          {/* bingkai orientasi */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
            <ringGeometry args={[1.85, 1.9, 6]} />
            <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </DragGroup>
    </>
  )
}
