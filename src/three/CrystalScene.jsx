import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, facetedGeometry, getPerfProfile } from './geo'

/**
 * SECTION 1 (hero) - inti kunci terenkripsi.
 * Inti low-poly dipahat, dikurung sangkar wireframe, dikelilingi pecahan
 * kunci yang mengorbit. Drag memutar; hover menaikkan cahaya dan
 * mengembangkan sangkar.
 */

function Shards({ hot }) {
  const ref = useRef()
  const { low } = useMemo(getPerfProfile, [])
  const count = low ? 9 : 16

  const shards = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 2.1 + (i % 4) * 0.28,
        speed: 0.12 + (i % 5) * 0.045,
        offset: (i / count) * Math.PI * 2,
        tilt: (i % 3) * 0.42 - 0.42,
        scale: 0.09 + (i % 3) * 0.045
      })),
    [count]
  )

  useFrame((frame, delta) => {
    if (!ref.current) return
    const t = frame.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    ref.current.children.forEach((child, i) => {
      const s = shards[i]
      const spread = hot ? 1.16 : 1
      const a = t * s.speed + s.offset
      child.position.set(
        Math.cos(a) * s.radius * spread,
        Math.sin(a * 1.3 + s.tilt) * 0.72,
        Math.sin(a) * s.radius * spread
      )
      child.rotation.x += dt * 0.5
      child.rotation.y += dt * 0.32
    })
  })

  return (
    <group ref={ref}>
      {shards.map((s, i) => (
        <mesh key={i} scale={s.scale}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? PALETTE.copper : PALETTE.mist}
            emissive={i % 3 === 0 ? PALETTE.copper : PALETTE.teal}
            emissiveIntensity={hot ? 0.6 : 0.25}
            roughness={0.35}
            metalness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Core() {
  const [hot, setHot] = useState(false)
  const core = useRef()
  const cage = useRef()
  const { low } = useMemo(getPerfProfile, [])

  const coreGeo = useMemo(() => facetedGeometry(1.35, low ? 1 : 2, 0.14, 1.2), [low])
  const cageEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.05, 1)),
    []
  )

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime

    if (core.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.015
      const s = THREE.MathUtils.damp(core.current.scale.x, (hot ? 1.06 : 1) * pulse, 5, dt)
      core.current.scale.setScalar(s)
      core.current.material.emissiveIntensity = THREE.MathUtils.damp(
        core.current.material.emissiveIntensity,
        hot ? 0.85 : 0.35,
        4,
        dt
      )
    }

    if (cage.current) {
      cage.current.rotation.y -= dt * 0.14
      cage.current.rotation.z += dt * 0.05
      const s = THREE.MathUtils.damp(cage.current.scale.x, hot ? 1.12 : 1, 4, dt)
      cage.current.scale.setScalar(s)
    }
  })

  return (
    <DragGroup autoSpin={0.18} parallax={0.7} maxPitch={0.5}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          setHot(true)
        }}
        onPointerOut={() => setHot(false)}
      >
        <mesh ref={core} geometry={coreGeo}>
          <meshStandardMaterial
            color={PALETTE.slate}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.35}
            roughness={0.28}
            metalness={0.92}
            flatShading
          />
        </mesh>

        <lineSegments ref={cage} geometry={cageEdges}>
          <lineBasicMaterial color={PALETTE.teal} transparent opacity={hot ? 0.45 : 0.22} />
        </lineSegments>

        <mesh visible={false}>
          <sphereGeometry args={[2.2, 12, 12]} />
          <meshBasicMaterial />
        </mesh>
      </group>

      <Shards hot={hot} />
    </DragGroup>
  )
}

export default function CrystalScene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} color={PALETTE.mist} />
      <pointLight position={[-5, -1, 3]} intensity={22} distance={18} color={PALETTE.indigo} />
      <pointLight position={[4, 3, -4]} intensity={16} distance={16} color={PALETTE.copper} />
      <Core />
    </>
  )
}
