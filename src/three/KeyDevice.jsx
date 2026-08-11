import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import DragGroup from './DragGroup'
import { PALETTE, damp, roundedBoxGeometry } from './geo'

/**
 * PRODUCT — device hardware key.
 * Body low-poly rounded, layar yang menyala saat hover, dan port/tombol
 * yang bisa di-klik untuk memicu highlight.
 */
const bodyGeometry = roundedBoxGeometry(2.1, 3.4, 0.42, 0.28)

function Device({ onPart }) {
  const group = useRef()
  const screen = useRef()
  const [hovered, setHovered] = useState(null)

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.getElapsedTime()
    group.current.position.y = Math.sin(t * 0.9) * 0.06
    const target = hovered === 'screen' ? 1.15 : 0.4
    screen.current.material.emissiveIntensity = damp(
      screen.current.material.emissiveIntensity,
      target,
      6,
      dt
    )
  })

  const enter = (part) => (e) => {
    e.stopPropagation()
    setHovered(part)
    document.body.style.cursor = 'pointer'
  }
  const leave = (e) => {
    e.stopPropagation()
    setHovered(null)
    document.body.style.cursor = ''
  }

  return (
    <group ref={group}>
      <mesh
        geometry={bodyGeometry}
        onPointerOver={enter('body')}
        onPointerOut={leave}
        onClick={() => onPart('body')}
      >
        <meshStandardMaterial color="#171d27" roughness={0.42} metalness={0.85} flatShading />
      </mesh>

      {/* layar */}
      <mesh
        ref={screen}
        position={[0, 0.55, 0.25]}
        onPointerOver={enter('screen')}
        onPointerOut={leave}
        onClick={() => onPart('screen')}
      >
        <planeGeometry args={[1.5, 1.05]} />
        <meshStandardMaterial
          color="#0b1016"
          emissive={PALETTE.teal}
          emissiveIntensity={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* garis-garis data di layar */}
      {[0.28, 0.1, -0.08].map((y, i) => (
        <mesh key={y} position={[-0.1 - i * 0.06, 0.55 + y, 0.253]}>
          <planeGeometry args={[0.9 - i * 0.22, 0.035]} />
          <meshBasicMaterial color={PALETTE.slate} transparent opacity={0.5 - i * 0.12} />
        </mesh>
      ))}

      {/* tombol konfirmasi */}
      <mesh
        position={[0, -0.85, 0.24]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={enter('button')}
        onPointerOut={leave}
        onClick={() => onPart('button')}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.1, 6]} />
        <meshStandardMaterial
          color={hovered === 'button' ? PALETTE.sand : '#2a3240'}
          emissive={hovered === 'button' ? PALETTE.sand : '#000000'}
          emissiveIntensity={hovered === 'button' ? 0.5 : 0}
          roughness={0.35}
          metalness={0.7}
          flatShading
        />
      </mesh>

      {/* port bawah */}
      <mesh position={[0, -1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.22, 6]} />
        <meshStandardMaterial color="#39434f" roughness={0.4} metalness={0.8} flatShading />
      </mesh>

      {/* garis chassis */}
      <mesh position={[0, 0, 0.215]}>
        <ringGeometry args={[0.94, 0.96, 6]} />
        <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

export default function KeyDevice({ onPart = () => {} }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#dfe6f2" />
      <directionalLight position={[-4, 1, -3]} intensity={0.7} color={PALETTE.violet} />
      <spotLight position={[0, 3, 4]} angle={0.6} penumbra={1} intensity={1.2} color={PALETTE.teal} />

      <DragGroup autoSpin={0.22} parallax={0.2} clampX={0.55}>
        <Device onPart={onPart} />
      </DragGroup>
    </>
  )
}
