import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, roundedBoxGeometry } from '../geo'

/**
 * Product: perangkat vault fisik.
 * - Drag → memutar perangkat
 * - Prop `exploded` (dikontrol tombol di UI) → lapisan memisah
 *   sehingga tiap komponen terlihat: casing, papan, elemen aman, layar
 */

function Layer({ y, target, children }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.position.y = THREE.MathUtils.damp(
      ref.current.position.y,
      y + target,
      4,
      Math.min(delta, 0.05)
    )
  })
  return <group ref={ref}>{children}</group>
}

function Device({ exploded }) {
  const shellGeo = useMemo(() => roundedBoxGeometry(2.1, 3.4, 0.22, 0.28), [])
  const boardGeo = useMemo(() => roundedBoxGeometry(1.8, 3.0, 0.06, 0.12), [])
  const screenGeo = useMemo(() => roundedBoxGeometry(1.6, 1.05, 0.04, 0.1), [])
  const glow = useRef()

  useFrame((frame) => {
    if (!glow.current) return
    const t = frame.clock.elapsedTime
    glow.current.material.emissiveIntensity = 0.85 + Math.sin(t * 2) * 0.18
  })

  const gap = exploded ? 1 : 0

  return (
    <group rotation={[0.12, 0, 0]}>
      {/* casing belakang */}
      <Layer y={0} target={-gap * 0.75}>
        <mesh geometry={shellGeo} position={[0, 0, -0.18]}>
          <meshStandardMaterial color={PALETTE.ink} roughness={0.42} metalness={0.85} />
        </mesh>
      </Layer>

      {/* papan sirkuit + secure element */}
      <Layer y={0} target={-gap * 0.25}>
        <group>
          <mesh geometry={boardGeo}>
            <meshStandardMaterial color={PALETTE.slate} roughness={0.55} metalness={0.5} />
          </mesh>
          {/* secure element — satu-satunya bagian yang benar-benar menyala */}
          <mesh ref={glow} position={[0, -0.75, 0.08]}>
            <boxGeometry args={[0.42, 0.42, 0.08]} />
            <meshStandardMaterial
              color={PALETTE.ink}
              emissive={PALETTE.teal}
              emissiveIntensity={0.9}
              roughness={0.3}
              metalness={0.8}
              toneMapped={false}
            />
          </mesh>
          {[-0.55, 0, 0.55].map((x) => (
            <mesh key={x} position={[x, 0.35, 0.06]}>
              <boxGeometry args={[0.22, 0.5, 0.05]} />
              <meshStandardMaterial color={PALETTE.steel} roughness={0.5} metalness={0.7} />
            </mesh>
          ))}
        </group>
      </Layer>

      {/* layar */}
      <Layer y={0} target={gap * 0.35}>
        <mesh geometry={screenGeo} position={[0, 0.72, 0.14]}>
          <meshStandardMaterial
            color="#04070a"
            emissive={PALETTE.indigo}
            emissiveIntensity={0.28}
            roughness={0.12}
            metalness={0.6}
          />
        </mesh>
      </Layer>

      {/* bezel depan */}
      <Layer y={0} target={gap * 0.95}>
        <lineSegments position={[0, 0, 0.22]}>
          <edgesGeometry args={[shellGeo]} />
          <lineBasicMaterial color={PALETTE.teal} transparent opacity={0.4} />
        </lineSegments>
      </Layer>
    </group>
  )
}

export default function VaultDevice({ exploded = false }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 5]} intensity={1.2} color={PALETTE.mist} />
      <pointLight position={[-4, 1, 3]} intensity={18} color={PALETTE.indigo} distance={14} />
      <spotLight position={[0, 4, 4]} angle={0.5} penumbra={1} intensity={20} color={PALETTE.teal} />

      <DragGroup autoSpin={0.7} parallax={0.5} scale={0.95}>
        <Device exploded={exploded} />
      </DragGroup>
    </>
  )
}
