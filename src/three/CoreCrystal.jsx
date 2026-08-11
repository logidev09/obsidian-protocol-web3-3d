import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import DragGroup from './DragGroup'
import { PALETTE } from './geo'

function Shard({ radius, speed, tilt, offset, size, color }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const t = clock.getElapsedTime() * speed + offset
    m.position.set(Math.cos(t) * radius, Math.sin(t * 0.8) * radius * 0.3, Math.sin(t) * radius)
    m.rotation.x = t * 0.7
    m.rotation.y = t * 0.45
  })

  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <tetrahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={color}
        flatShading
        metalness={0.85}
        roughness={0.32}
        emissive={color}
        emissiveIntensity={0.12}
      />
    </mesh>
  )
}

function Ring({ radius, tilt, speed, color, opacity }) {
  const ref = useRef()
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.z += speed * Math.min(d, 0.05)
  })
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.006, 3, 96]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

/**
 * Inti hero: kristal ikosahedron low-poly di dalam sangkar wireframe,
 * dikelilingi pecahan yang mengorbit. Drag untuk memutar, gerakkan mouse
 * untuk parallax halus.
 */
export default function CoreCrystal() {
  const core = useRef()
  const cage = useRef()

  const shards = useMemo(
    () => [
      { radius: 2.35, speed: 0.42, tilt: 0.3, offset: 0, size: 0.17, color: PALETTE.indigo },
      { radius: 2.7, speed: -0.31, tilt: 0.9, offset: 1.9, size: 0.13, color: PALETTE.teal },
      { radius: 2.05, speed: 0.55, tilt: -0.5, offset: 3.4, size: 0.11, color: PALETTE.sand },
      { radius: 3.05, speed: -0.24, tilt: 0.15, offset: 4.8, size: 0.15, color: PALETTE.steel },
      { radius: 2.5, speed: 0.36, tilt: -1.1, offset: 2.6, size: 0.1, color: PALETTE.indigo }
    ],
    []
  )

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const dt = Math.min(delta, 0.05)

    if (core.current) {
      core.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.035)
      core.current.rotation.y += dt * 0.16
    }
    if (cage.current) {
      cage.current.rotation.y -= dt * 0.1
      cage.current.rotation.x = Math.sin(t * 0.35) * 0.12
    }
  })

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color="#dfe6f5" />
      <pointLight position={[-5, -2, 3]} intensity={26} distance={16} color={PALETTE.indigo} />
      <pointLight position={[4.5, -3.5, -4]} intensity={20} distance={16} color={PALETTE.teal} />

      <DragGroup autoSpin={0.16} parallax={0.22}>
        <mesh ref={core}>
          <icosahedronGeometry args={[1.15, 0]} />
          <meshStandardMaterial color={PALETTE.deep} flatShading metalness={0.95} roughness={0.24} />
        </mesh>

        <mesh scale={1.02}>
          <icosahedronGeometry args={[1.15, 0]} />
          <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.3} />
        </mesh>

        <mesh ref={cage}>
          <icosahedronGeometry args={[1.95, 1]} />
          <meshBasicMaterial color="#4b5670" wireframe transparent opacity={0.2} />
        </mesh>

        <mesh>
          <octahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial
            color={PALETTE.teal}
            emissive={PALETTE.teal}
            emissiveIntensity={0.9}
            flatShading
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>

        <Ring radius={2.62} tilt={[Math.PI / 2.1, 0, 0]} speed={0.12} color="#56628a" opacity={0.35} />
        <Ring radius={3.15} tilt={[Math.PI / 2.6, 0.4, 0]} speed={-0.08} color="#3d4759" opacity={0.28} />

        {shards.map((s, i) => (
          <Shard key={i} {...s} />
        ))}
      </DragGroup>
    </>
  )
}
