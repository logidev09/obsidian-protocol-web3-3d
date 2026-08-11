import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, getPerfProfile, randomInBox } from './geo'

/**
 * SECTION 1 - artefak inti.
 * Icosahedron low-poly + cangkang wireframe + pecahan yang mengorbit.
 * Hover memisahkan cangkang, drag memutar seluruh rakitan.
 */

function Shard({ radius, speed, offset, tilt, hot }) {
  const ref = useRef()

  useFrame((frame, delta) => {
    if (!ref.current) return
    const t = frame.clock.elapsedTime * speed + offset
    const dt = Math.min(delta, 0.05)
    const r = hot ? radius * 1.18 : radius
    ref.current.position.set(Math.cos(t) * r, Math.sin(t * 0.7) * 0.5, Math.sin(t) * r)
    ref.current.rotation.x += dt * 0.6
    ref.current.rotation.y += dt * 0.4
  })

  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <tetrahedronGeometry args={[0.18, 0]} />
      <meshStandardMaterial
        color={PALETTE.steel}
        emissive={hot ? PALETTE.copper : PALETTE.teal}
        emissiveIntensity={hot ? 0.8 : 0.35}
        roughness={0.35}
        metalness={0.9}
        flatShading
      />
    </mesh>
  )
}

function Dust() {
  const ref = useRef()
  const { low } = useMemo(getPerfProfile, [])
  const count = low ? 140 : 340
  const positions = useMemo(() => randomInBox(count, 14), [count])

  useFrame((frame, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += Math.min(delta, 0.05) * 0.03
    ref.current.rotation.x = frame.pointer.y * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.026} color={PALETTE.steel} transparent opacity={0.55} sizeAttenuation />
    </points>
  )
}

function Artifact() {
  const [hot, setHot] = useState(false)
  const core = useRef()
  const shell = useRef()

  const shellGeo = useMemo(() => new THREE.IcosahedronGeometry(2.1, 1), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.35, 0)), [])

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime

    if (core.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.015
      const s = THREE.MathUtils.damp(core.current.scale.x, (hot ? 1.06 : 1) * pulse, 5, dt)
      core.current.scale.setScalar(s)
    }
    if (shell.current) {
      shell.current.rotation.y -= dt * 0.12
      shell.current.rotation.z += dt * 0.04
      const s = THREE.MathUtils.damp(shell.current.scale.x, hot ? 1.12 : 1, 4, dt)
      shell.current.scale.setScalar(s)
      shell.current.material.opacity = THREE.MathUtils.damp(
        shell.current.material.opacity,
        hot ? 0.3 : 0.14,
        4,
        dt
      )
    }
  })

  return (
    <DragGroup autoSpin={0.18} parallax={1} maxPitch={0.55}>
      <mesh
        ref={core}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHot(true)
        }}
        onPointerOut={() => setHot(false)}
      >
        <icosahedronGeometry args={[1.35, 0]} />
        <meshStandardMaterial
          color={PALETTE.carbon}
          emissive={PALETTE.teal}
          emissiveIntensity={hot ? 0.42 : 0.2}
          roughness={0.22}
          metalness={0.95}
          flatShading
        />
      </mesh>

      <lineSegments geometry={edges}>
        <lineBasicMaterial color={PALETTE.mist} transparent opacity={0.35} />
      </lineSegments>

      <mesh ref={shell} geometry={shellGeo}>
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.14} />
      </mesh>

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Shard
          key={i}
          radius={2.7 + (i % 3) * 0.35}
          speed={0.28 + i * 0.045}
          offset={(i / 6) * Math.PI * 2}
          tilt={i * 0.4}
          hot={hot}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.3, 0]}>
        <ringGeometry args={[2.6, 2.68, 64]} />
        <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
    </DragGroup>
  )
}

export default function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color={PALETTE.mist} />
      <pointLight position={[-5, -2, 3]} intensity={26} distance={20} color={PALETTE.indigo} />
      <pointLight position={[4, 3, -4]} intensity={18} distance={18} color={PALETTE.copper} />
      <Dust />
      <Artifact />
    </>
  )
}
