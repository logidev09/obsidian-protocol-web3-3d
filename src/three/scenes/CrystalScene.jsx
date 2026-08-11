import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, getPerfProfile, seededRandom } from '../geo'

const perf = getPerfProfile()

/** Pecahan kristal yang mengorbit inti dan memuai saat pointer mendekat. */
function Shards({ open }) {
  const ref = useRef()
  const count = Math.round((perf.low ? 14 : 26) * 1)

  const shards = useMemo(() => {
    const rand = seededRandom(7)
    return new Array(count).fill(0).map(() => {
      const dir = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize()
      return {
        dir,
        base: 1.25 + rand() * 0.5,
        size: 0.05 + rand() * 0.12,
        spin: (rand() * 2 - 1) * 0.6,
        phase: rand() * Math.PI * 2
      }
    })
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const spread = useRef(0)

  useFrame((state, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    spread.current = THREE.MathUtils.damp(spread.current, open ? 0.55 : 0, 4, dt)

    shards.forEach((s, i) => {
      const dist = s.base + spread.current + Math.sin(t * 0.6 + s.phase) * 0.05
      dummy.position.copy(s.dir).multiplyScalar(dist)
      dummy.rotation.set(t * s.spin * 0.4 + s.phase, t * s.spin * 0.3, s.phase)
      dummy.scale.setScalar(s.size)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={PALETTE.mist}
        emissive={PALETTE.teal}
        emissiveIntensity={0.35}
        roughness={0.25}
        metalness={0.6}
        flatShading
      />
    </instancedMesh>
  )
}

/** Inti kristal: icosahedron low-poly berlapis wireframe. */
function Core({ hovered }) {
  const solid = useRef()
  const wire = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const target = hovered ? 1.08 : 1
    if (solid.current) {
      solid.current.scale.setScalar(THREE.MathUtils.damp(solid.current.scale.x, target, 5, dt))
      solid.current.material.emissiveIntensity = THREE.MathUtils.damp(
        solid.current.material.emissiveIntensity,
        hovered ? 0.9 : 0.42,
        4,
        dt
      )
    }
    if (wire.current) {
      wire.current.rotation.y = t * 0.12
      wire.current.rotation.z = Math.sin(t * 0.2) * 0.1
      wire.current.scale.setScalar(THREE.MathUtils.damp(wire.current.scale.x, target * 1.22, 5, dt))
    }
  })

  return (
    <group>
      <mesh ref={solid} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          emissive={PALETTE.teal}
          emissiveIntensity={0.42}
          roughness={0.18}
          metalness={0.85}
          flatShading
        />
      </mesh>

      <mesh ref={wire}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.22} />
      </mesh>

      <mesh scale={1.9}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color={PALETTE.teal}
          transparent
          opacity={0.045}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/**
 * Scene hero — kristal kunci.
 * Drag untuk memutar, hover untuk memuaikan pecahannya.
 */
export default function CrystalScene() {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color={PALETTE.mist} />
      <pointLight position={[-4, -2, -3]} intensity={22} color={PALETTE.indigo} distance={14} />
      <pointLight position={[3, -3, 4]} intensity={14} color={PALETTE.teal} distance={12} />

      <DragGroup autoSpin={0.35} parallax={1.1} scale={1.15}>
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <Core hovered={hovered} />
          <Shards open={hovered} />
        </group>
      </DragGroup>
    </>
  )
}
