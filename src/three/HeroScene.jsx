import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import Lights from './Lights'
import { PALETTE, getPerfProfile, lerp, mulberry32 } from './geo'

/**
 * Scene hero: inti kunci berbentuk polihedron yang dikelilingi pecahan
 * (key shards). Hover → pecahan mengembang. Klik → status "sealed",
 * pecahan mengunci rapat dan warna bergeser ke amber.
 */
function Artifact({ sealed, onToggle }) {
  const perf = useMemo(() => getPerfProfile(), [])
  const core = useRef()
  const shell = useRef()
  const shards = useRef([])
  const [hovered, setHovered] = useState(false)

  const pieces = useMemo(() => {
    const rand = mulberry32(20260731)
    const count = Math.round(16 * perf.density) + 6
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.4
      const radius = 1.7 + rand() * 0.9
      const height = (rand() - 0.5) * 2.4
      return {
        base: new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ),
        scale: 0.14 + rand() * 0.22,
        spin: 0.3 + rand() * 0.9,
        phase: rand() * Math.PI * 2,
        tone: rand() > 0.7 ? PALETTE.indigo : PALETTE.teal
      }
    })
  }, [perf.density])

  const targetSpread = sealed ? 0.62 : hovered ? 1.28 : 1
  const spread = useRef(1)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const step = Math.min(delta, 0.05)
    spread.current = lerp(spread.current, targetSpread, step * 4)

    if (core.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.02
      core.current.scale.setScalar(pulse * (sealed ? 1.05 : 1))
      core.current.rotation.x = t * 0.12
      core.current.material.emissiveIntensity = lerp(
        core.current.material.emissiveIntensity,
        sealed ? 1.15 : hovered ? 0.85 : 0.45,
        step * 5
      )
    }

    if (shell.current) {
      shell.current.rotation.y = -t * 0.18
      shell.current.rotation.z = t * 0.06
    }

    shards.current.forEach((mesh, i) => {
      if (!mesh) return
      const piece = pieces[i]
      const float = Math.sin(t * piece.spin + piece.phase) * 0.16
      mesh.position.set(
        piece.base.x * spread.current,
        piece.base.y * spread.current + float,
        piece.base.z * spread.current
      )
      mesh.rotation.x += step * piece.spin * 0.5
      mesh.rotation.y += step * piece.spin * 0.35
    })
  })

  return (
    <DragGroup autoSpin={0.18}>
      {/* inti */}
      <mesh
        ref={core}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial
          color={PALETTE.surface}
          emissive={sealed ? PALETTE.amber : PALETTE.teal}
          emissiveIntensity={0.45}
          metalness={0.85}
          roughness={0.28}
          flatShading
        />
      </mesh>

      {/* cangkang wireframe */}
      <mesh ref={shell} scale={1.85}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={sealed ? PALETTE.amber : PALETTE.steel}
          wireframe
          transparent
          opacity={hovered ? 0.4 : 0.22}
        />
      </mesh>

      {/* cincin orbit */}
      <mesh rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[2.5, 0.012, 8, 96]} />
        <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, Math.PI / 5, 0]}>
        <torusGeometry args={[2.9, 0.008, 8, 96]} />
        <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.28} />
      </mesh>

      {/* pecahan kunci */}
      {pieces.map((piece, i) => (
        <mesh
          key={i}
          ref={(el) => (shards.current[i] = el)}
          scale={piece.scale}
          castShadow={false}
        >
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={PALETTE.surface}
            emissive={sealed ? PALETTE.amber : piece.tone}
            emissiveIntensity={sealed ? 0.7 : 0.35}
            metalness={0.7}
            roughness={0.35}
            flatShading
          />
        </mesh>
      ))}
    </DragGroup>
  )
}

function Dust({ count = 320 }) {
  const points = useRef()
  const positions = useMemo(() => {
    const rand = mulberry32(7)
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 16
      arr[i * 3 + 1] = (rand() - 0.5) * 10
      arr[i * 3 + 2] = (rand() - 0.5) * 10 - 2
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={PALETTE.steel}
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  )
}

function PointerRig({ children, strength = 0.35 }) {
  const group = useRef()
  useFrame((state, delta) => {
    if (!group.current) return
    const step = Math.min(delta, 0.05) * 3
    group.current.rotation.y = lerp(
      group.current.rotation.y,
      state.pointer.x * strength,
      step
    )
    group.current.rotation.x = lerp(
      group.current.rotation.x,
      -state.pointer.y * strength * 0.6,
      step
    )
  })
  return <group ref={group}>{children}</group>
}

export default function HeroScene({ sealed, onToggle }) {
  return (
    <>
      <Lights />
      <fog attach="fog" args={[PALETTE.base, 9, 010]} />
      <PointerRig>
        <Artifact sealed={sealed} onToggle={onToggle} />
        <Dust />
      </PointerRig>
    </>
  )
}
