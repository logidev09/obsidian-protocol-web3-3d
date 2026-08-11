import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * PRODUK — perangkat vault fisik. Bisa diputar 360° dengan drag.
 * Hover pada bagian tertentu menyalakan indikator dan mengangkat panel belakang.
 */
function Device() {
  const [active, setActive] = useState(null)
  const led = useRef()
  const backplate = useRef()

  const bodyGeo = useMemo(() => roundedBoxGeometry(2.6, 4.2, 0.42, 0.28), [])
  const screenGeo = useMemo(() => roundedBoxGeometry(2.0, 2.2, 0.06, 0.12), [])
  const plateGeo = useMemo(() => roundedBoxGeometry(2.3, 3.8, 0.1, 0.2), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    led.current.material.emissiveIntensity =
      1.2 + Math.sin(t * 2.4) * 0.8 + (active === 'led' ? 2 : 0)

    const z = active === 'plate' ? -0.55 : -0.24
    backplate.current.position.z = THREE.MathUtils.damp(
      backplate.current.position.z,
      z,
      5,
      dt
    )
  })

  return (
    <group rotation={[0.1, -0.35, 0.05]}>
      {/* body */}
      <mesh geometry={bodyGeo}>
        <meshStandardMaterial color="#0e161e" roughness={0.34} metalness={0.92} />
      </mesh>

      {/* rangka aksen */}
      <mesh geometry={bodyGeo} scale={[1.012, 1.006, 0.98]}>
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.18} />
      </mesh>

      {/* layar */}
      <mesh
        geometry={screenGeo}
        position={[0, 0.62, 0.24]}
        onPointerOver={() => setActive('screen')}
        onPointerOut={() => setActive(null)}
      >
        <meshStandardMaterial
          color="#08111a"
          roughness={0.12}
          metalness={0.4}
          emissive={PALETTE.teal}
          emissiveIntensity={active === 'screen' ? 0.55 : 0.2}
        />
      </mesh>

      {/* baris grid di layar */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0, 1.42 - i * 0.24, 0.28]}>
          <planeGeometry args={[1.5 - (i % 3) * 0.35, 0.035]} />
          <meshBasicMaterial
            color={i === 2 ? PALETTE.sand : PALETTE.slate}
            transparent
            opacity={i === 2 ? 0.85 : 0.32}
          />
        </mesh>
      ))}

      {/* indikator LED */}
      <mesh
        ref={led}
        position={[0, -1.05, 0.26]}
        onPointerOver={() => setActive('led')}
        onPointerOut={() => setActive(null)}
      >
        <cylinderGeometry args={[0.13, 0.13, 0.06, 6]} />
        <meshStandardMaterial
          color="#0d1620"
          emissive={PALETTE.sand}
          emissiveIntensity={1.4}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* tombol konfirmasi */}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, -1.62, 0.2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.12, 6]} />
          <meshStandardMaterial color="#18242f" metalness={0.85} roughness={0.35} flatShading />
        </mesh>
      ))}

      {/* panel belakang yang terangkat saat hover */}
      <mesh
        ref={backplate}
        geometry={plateGeo}
        position={[0, 0, -0.24]}
        onPointerOver={() => setActive('plate')}
        onPointerOut={() => setActive(null)}
      >
        <meshStandardMaterial
          color="#141f2a"
          roughness={0.5}
          metalness={0.7}
          flatShading
        />
      </mesh>
    </group>
  )
}

export default function VaultDevice() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-5, -2, -4]} intensity={0.5} color={PALETTE.violet} />
      <pointLight position={[0, -3, 4]} intensity={18} color={PALETTE.teal} distance={14} />
      <DragGroup autoSpin={0.22} parallax={0.14} clampX={0.5} scale={0.82}>
        <Device />
      </DragGroup>
    </>
  )
}
