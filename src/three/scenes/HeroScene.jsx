import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE } from '../geo'

/**
 * Hero — kristal ikosahedron berlapis.
 * Interaksi: drag memutar, hover memekarkan cangkang luar,
 * klik memicu denyut yang menjalar ke seluruh shard.
 */
function Crystal() {
  const core = useRef()
  const shell = useRef()
  const [hovered, setHovered] = useState(false)
  const pulse = useRef(0)

  const shards = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.55, 0)
    const pos = geo.attributes.position
    const out = []
    for (let i = 0; i < pos.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(pos, i)
      const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1)
      const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2)
      const centroid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3)
      out.push({
        dir: centroid.clone().normalize(),
        dist: centroid.length(),
        phase: (i / pos.count) * Math.PI * 2
      })
    }
    geo.dispose()
    return out
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    pulse.current = Math.max(0, pulse.current - dt * 1.4)

    if (core.current) {
      core.current.rotation.x = t * 0.12
      core.current.rotation.z = t * -0.08
      const s = 1 + pulse.current * 0.18 + Math.sin(t * 1.4) * 0.015
      core.current.scale.setScalar(s)
    }

    if (shell.current) {
      const target = hovered ? 1.22 : 1
      shell.current.children.forEach((mesh, i) => {
        const shard = shards[i]
        if (!shard) return
        const breathe = Math.sin(t * 0.9 + shard.phase) * 0.04
        const goal = shard.dist * (target + breathe + pulse.current * 0.35)
        const p = mesh.position
        const want = shard.dir.clone().multiplyScalar(goal)
        p.x = THREE.MathUtils.damp(p.x, want.x, 4, dt)
        p.y = THREE.MathUtils.damp(p.y, want.y, 4, dt)
        p.z = THREE.MathUtils.damp(p.z, want.z, 4, dt)
        mesh.lookAt(0, 0, 0)
      })
      shell.current.rotation.y = t * 0.06
    }
  })

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => (pulse.current = 1)}
    >
      {/* inti solid */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshStandardMaterial
          color={PALETTE.ink}
          roughness={0.28}
          metalness={0.85}
          emissive={PALETTE.teal}
          emissiveIntensity={hovered ? 0.4 : 0.18}
          flatShading
        />
      </mesh>

      {/* rangka kawat */}
      <mesh scale={1.02}>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshBasicMaterial color={PALETTE.steel} wireframe transparent opacity={0.22} />
      </mesh>

      {/* cangkang pecahan yang memekar saat hover */}
      <group ref={shell}>
        {shards.map((s, i) => (
          <mesh key={i} position={s.dir.clone().multiplyScalar(s.dist)}>
            <circleGeometry args={[0.3, 3]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? PALETTE.indigo : PALETTE.slate}
              roughness={0.4}
              metalness={0.6}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Cincin orbit tipis di sekeliling kristal. */
function Orbits() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.05
  })
  return (
    <group ref={ref} rotation={[Math.PI / 2.6, 0, 0]}>
      {[2.6, 3.15, 3.7].map((r, i) => (
        <mesh key={r} rotation={[0, 0, i * 0.5]}>
          <torusGeometry args={[r, 0.006, 6, 128]} />
          <meshBasicMaterial
            color={i === 1 ? PALETTE.teal : PALETTE.steel}
            transparent
            opacity={0.3 - i * 0.06}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#dce6ee" />
      <pointLight position={[-5, -2, -4]} intensity={22} color={PALETTE.indigo} distance={16} />
      <pointLight position={[4, -3, 3]} intensity={14} color={PALETTE.teal} distance={14} />
      <DragGroup autoSpin={0.8} parallax={0.25}>
        <Crystal />
        <Orbits />
      </DragGroup>
    </>
  )
}
