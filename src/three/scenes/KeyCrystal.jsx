import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Hero: inti kunci berbentuk kristal ikosahedron.
 * - Drag untuk memutar (inersia).
 * - Hover membuka cangkang luar dan menyalakan inti.
 * - Serpihan orbit bergerak pelan supaya tidak mengganggu keterbacaan teks.
 */

function Shards({ open }) {
  const group = useRef()

  const shards = useMemo(() => {
    const rand = seededRandom(7)
    return Array.from({ length: 18 }, () => {
      const radius = 1.9 + rand() * 1.1
      const phi = Math.acos(2 * rand() - 1)
      const theta = rand() * Math.PI * 2
      return {
        base: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) * 0.65,
          radius * Math.sin(phi) * Math.sin(theta)
        ),
        size: 0.06 + rand() * 0.13,
        speed: 0.15 + rand() * 0.35,
        tilt: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI]
      }
    })
  }, [])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    g.children.forEach((child, i) => {
      const s = shards[i]
      const spread = open ? 1.16 : 1
      child.position.x = THREE.MathUtils.damp(child.position.x, s.base.x * spread, 3, dt)
      child.position.z = THREE.MathUtils.damp(child.position.z, s.base.z * spread, 3, dt)
      child.position.y = s.base.y * spread + Math.sin(t * s.speed + i) * 0.12
      child.rotation.x += dt * s.speed * 0.4
      child.rotation.y += dt * s.speed * 0.3
    })
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i} position={s.base} rotation={s.tilt}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={i % 4 === 0 ? PALETTE.amber : PALETTE.steel}
            emissive={i % 4 === 0 ? PALETTE.amber : PALETTE.indigo}
            emissiveIntensity={0.25}
            roughness={0.35}
            metalness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

export default function KeyCrystal() {
  const [hovered, setHovered] = useState(false)
  const shell = useRef()
  const core = useRef()
  const wire = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    if (shell.current) {
      const s = THREE.MathUtils.damp(shell.current.scale.x, hovered ? 1.28 : 1.06, 4, dt)
      shell.current.scale.setScalar(s)
      shell.current.material.opacity = THREE.MathUtils.damp(
        shell.current.material.opacity,
        hovered ? 0.1 : 0.22,
        4,
        dt
      )
      shell.current.rotation.y -= dt * 0.15
    }

    if (core.current) {
      core.current.rotation.x += dt * 0.18
      const pulse = 0.9 + Math.sin(t * 1.4) * 0.06
      core.current.material.emissiveIntensity = THREE.MathUtils.damp(
        core.current.material.emissiveIntensity,
        (hovered ? 1.5 : 0.55) * pulse,
        4,
        dt
      )
    }

    if (wire.current) {
      wire.current.rotation.y += dt * 0.22
      wire.current.rotation.z -= dt * 0.08
    }
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} color={PALETTE.mist} />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color={PALETTE.indigo} />
      <pointLight position={[0, 0, 2.5]} intensity={9} color={PALETTE.teal} distance={9} />

      <DragGroup autoSpin={1} parallax={0.7}>
        <group
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
        >
          {/* inti */}
          <mesh ref={core}>
            <icosahedronGeometry args={[0.92, 0]} />
            <meshStandardMaterial
              color={PALETTE.slate}
              emissive={PALETTE.teal}
              emissiveIntensity={0.55}
              roughness={0.22}
              metalness={0.95}
              flatShading
            />
          </mesh>

          {/* rangka kawat */}
          <mesh ref={wire} scale={1.42}>
            <icosahedronGeometry args={[0.92, 1]} />
            <meshBasicMaterial color={PALETTE.steel} wireframe transparent opacity={0.3} />
          </mesh>

          {/* cangkang luar */}
          <mesh ref={shell} scale={1.06}>
            <icosahedronGeometry args={[1.35, 0]} />
            <meshStandardMaterial
              color={PALETTE.indigo}
              transparent
              opacity={0.22}
              roughness={0.1}
              metalness={0.6}
              side={THREE.DoubleSide}
              flatShading
            />
          </mesh>
        </group>

        <Shards open={hovered} />
      </DragGroup>
    </>
  )
}
