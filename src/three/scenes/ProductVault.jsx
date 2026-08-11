import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Product: perangkat vault low-poly — bodi rounded, panel layar, tombol,
 * dan cincin scan yang naik-turun. Klik untuk “membuka” panel.
 */
function Device({ opened }) {
  const bodyGeo = useMemo(() => roundedBoxGeometry(2.5, 3.9, 0.42, 0.28), [])
  const screenGeo = useMemo(() => roundedBoxGeometry(2.05, 2.35, 0.06, 0.16), [])
  const lid = useRef()
  const scan = useRef()
  const screenMat = useRef()

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime

    if (lid.current) {
      lid.current.position.z = THREE.MathUtils.damp(
        lid.current.position.z,
        opened ? 0.72 : 0.24,
        5,
        dt
      )
      lid.current.rotation.x = THREE.MathUtils.damp(
        lid.current.rotation.x,
        opened ? -0.32 : 0,
        5,
        dt
      )
    }
    if (scan.current) {
      scan.current.position.y = Math.sin(t * 1.1) * 1.05
      scan.current.material.opacity = 0.28 + Math.sin(t * 2.2) * 0.1
    }
    if (screenMat.current) {
      screenMat.current.emissiveIntensity = THREE.MathUtils.damp(
        screenMat.current.emissiveIntensity,
        opened ? 1.6 : 0.7,
        5,
        dt
      )
    }
  })

  return (
    <group>
      {/* bodi */}
      <mesh geometry={bodyGeo} castShadow>
        <meshStandardMaterial
          color={PALETTE.ink}
          roughness={0.42}
          metalness={0.78}
          flatShading
        />
      </mesh>

      {/* rusuk bodi — mempertegas siluet poligonal */}
      <lineSegments>
        <edgesGeometry args={[bodyGeo]} />
        <lineBasicMaterial color={PALETTE.steel} transparent opacity={0.7} />
      </lineSegments>

      {/* panel layar yang bisa terangkat */}
      <group ref={lid} position={[0, 0.32, 0.24]}>
        <mesh geometry={screenGeo}>
          <meshStandardMaterial
            ref={screenMat}
            color={PALETTE.slate}
            emissive={PALETTE.teal}
            emissiveIntensity={0.7}
            roughness={0.25}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[1.75, 2.05, 8, 10]} />
          <meshBasicMaterial color={PALETTE.teal} wireframe transparent opacity={0.28} />
        </mesh>
      </group>

      {/* tombol */}
      {[-0.62, 0, 0.62].map((x) => (
        <mesh key={x} position={[x, -1.52, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 6]} />
          <meshStandardMaterial
            color={PALETTE.steel}
            emissive={PALETTE.sand}
            emissiveIntensity={0.25}
            roughness={0.5}
            metalness={0.6}
            flatShading
          />
        </mesh>
      ))}

      {/* cincin pemindai */}
      <mesh ref={scan} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.85, 0.012, 3, 64]} />
        <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

export default function ProductVault({ active = true }) {
  const [opened, setOpened] = useState(false)

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 6]} intensity={1.2} color={PALETTE.mist} />
      <pointLight position={[-4, 1, 3]} intensity={18} color={PALETTE.violet} distance={14} />
      <pointLight position={[4, -2, 2]} intensity={14} color={PALETTE.teal} distance={12} />

      <group onClick={() => setOpened((v) => !v)}>
        <DragGroup autoSpin={active ? 0.5 : 0} parallax={0.35} scale={0.92}>
          <Device opened={opened} />
        </DragGroup>
      </group>
    </>
  )
}
