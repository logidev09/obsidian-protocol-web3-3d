import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, roundedBoxGeometry } from './geo'

/**
 * PRODUK — perangkat vault berbentuk kartu.
 * Setiap komponen (bodi, layar, port, ring NFC) adalah mesh terpisah
 * yang menyala saat hover, jadi produk terasa "bisa diperiksa".
 */

function Part({ children, ...props }) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef()

  useFrame((_, delta) => {
    const m = ref.current?.material
    if (!m) return
    m.emissiveIntensity = THREE.MathUtils.damp(
      m.emissiveIntensity,
      hovered ? 0.9 : 0.15,
      6,
      Math.min(delta, 0.05)
    )
  })

  return (
    <mesh
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      {...props}
    >
      {children}
    </mesh>
  )
}

function Device() {
  const bodyGeo = useRef(roundedBoxGeometry(3.2, 2, 0.22, 0.24)).current
  const screenGeo = useRef(roundedBoxGeometry(2.5, 1.15, 0.04, 0.1)).current
  const ring = useRef()

  useFrame((state, delta) => {
    if (ring.current) {
      ring.current.rotation.z += Math.min(delta, 0.05) * 0.6
      ring.current.material.opacity =
        0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.12
    }
  })

  return (
    <group>
      {/* bodi */}
      <Part geometry={bodyGeo}>
        <meshStandardMaterial
          color="#151b23"
          emissive={PALETTE.indigo}
          emissiveIntensity={0.15}
          roughness={0.35}
          metalness={0.85}
        />
      </Part>

      {/* layar */}
      <Part geometry={screenGeo} position={[0, 0.28, 0.14]}>
        <meshStandardMaterial
          color="#0a1418"
          emissive={PALETTE.teal}
          emissiveIntensity={0.15}
          roughness={0.15}
          metalness={0.4}
        />
      </Part>

      {/* baris data di layar */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.55 + i * 0.02, 0.55 - i * 0.22, 0.17]}>
          <planeGeometry args={[1.2 - i * 0.28, 0.05]} />
          <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.55 - i * 0.13} />
        </mesh>
      ))}

      {/* ring NFC */}
      <mesh ref={ring} position={[0, -0.6, 0.14]}>
        <ringGeometry args={[0.26, 0.32, 6]} />
        <meshBasicMaterial color={PALETTE.sand} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* tombol konfirmasi */}
      <Part position={[1.1, -0.6, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 6]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          emissive={PALETTE.violet}
          emissiveIntensity={0.15}
          roughness={0.4}
          metalness={0.7}
          flatShading
        />
      </Part>

      {/* port bawah */}
      <Part position={[-1.1, -0.6, 0.14]}>
        <boxGeometry args={[0.34, 0.1, 0.08]} />
        <meshStandardMaterial
          color={PALETTE.steel}
          emissive={PALETTE.teal}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.8}
        />
      </Part>

      {/* bayangan lembut */}
      <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

export default function ProductDevice() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} color="#dbe9ff" />
      <pointLight position={[-4, 1, 3]} intensity={18} color={PALETTE.violet} distance={14} />
      <pointLight position={[4, -2, 2]} intensity={14} color={PALETTE.teal} distance={12} />

      <DragGroup autoSpin={0.35} parallax={0.28} scale={0.95}>
        <Device />
      </DragGroup>
    </>
  )
}
