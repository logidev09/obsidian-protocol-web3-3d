import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Hero: inti kunci berbentuk kristal.
 * - Drag → memutar seluruh rakitan
 * - Hover → cangkang luar merenggang, inti menyala
 * - Serpihan mengorbit dengan kecepatan berbeda → kesan "terurai"
 */

function Shards({ hovered }) {
  const group = useRef()

  const shards = useMemo(() => {
    const rand = seededRandom(7)
    return Array.from({ length: 14 }, (_, i) => ({
      radius: 1.9 + rand() * 1.1,
      size: 0.09 + rand() * 0.16,
      speed: 0.1 + rand() * 0.25,
      tilt: (rand() - 0.5) * 1.6,
      offset: rand() * Math.PI * 2,
      y: (rand() - 0.5) * 1.8,
      accent: i % 5 === 0
    }))
  }, [])

  useFrame((frame, delta) => {
    const g = group.current
    if (!g) return
    const t = frame.clock.elapsedTime
    g.children.forEach((child, i) => {
      const s = shards[i]
      const spread = hovered ? 1.22 : 1
      const a = t * s.speed + s.offset
      child.position.set(
        Math.cos(a) * s.radius * spread,
        s.y + Math.sin(t * 0.6 + s.offset) * 0.12,
        Math.sin(a) * s.radius * spread
      )
      child.rotation.x += delta * 0.4
      child.rotation.y += delta * 0.25
    })
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <mesh key={i} rotation={[s.tilt, 0, 0]}>
          <tetrahedronGeometry args={[s.size, 0]} />
          <meshStandardMaterial
            color={s.accent ? PALETTE.teal : PALETTE.steel}
            emissive={s.accent ? PALETTE.teal : '#000000'}
            emissiveIntensity={s.accent ? 0.5 : 0}
            roughness={0.3}
            metalness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

function Core({ hovered }) {
  const inner = useRef()
  const shell = useRef()
  const wire = useRef()

  useFrame((frame, delta) => {
    const t = frame.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    if (inner.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.03
      inner.current.scale.setScalar(
        THREE.MathUtils.damp(inner.current.scale.x, (hovered ? 1.08 : 0.94) * pulse, 5, dt)
      )
      inner.current.material.emissiveIntensity = THREE.MathUtils.damp(
        inner.current.material.emissiveIntensity,
        hovered ? 1.35 : 0.55,
        5,
        dt
      )
    }
    if (shell.current) {
      shell.current.rotation.y -= dt * 0.18
      shell.current.rotation.z += dt * 0.06
      shell.current.scale.setScalar(
        THREE.MathUtils.damp(shell.current.scale.x, hovered ? 1.3 : 1.14, 4, dt)
      )
    }
    if (wire.current) {
      wire.current.rotation.y += dt * 0.1
      wire.current.material.opacity = THREE.MathUtils.damp(
        wire.current.material.opacity,
        hovered ? 0.5 : 0.22,
        5,
        dt
      )
    }
  })

  return (
    <group>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={PALETTE.ink}
          emissive={PALETTE.teal}
          emissiveIntensity={0.55}
          roughness={0.18}
          metalness={0.95}
          flatShading
        />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          roughness={0.25}
          metalness={0.9}
          transparent
          opacity={0.34}
          flatShading
          side={THREE.DoubleSide}
        />
      </mesh>

      <lineSegments ref={wire} scale={1.42}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(1, 1)]} />
        <lineBasicMaterial color={PALETTE.indigo} transparent opacity={0.22} />
      </lineSegments>
    </group>
  )
}

export default function KeyCrystal() {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 4]} intensity={1.1} color={PALETTE.mist} />
      <pointLight position={[-5, -2, 2]} intensity={22} color={PALETTE.indigo} distance={16} />
      <pointLight position={[3, 2, -4]} intensity={10} color={PALETTE.teal} distance={14} />

      <DragGroup autoSpin={1} parallax={0.55}>
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <Core hovered={hovered} />
          <Shards hovered={hovered} />
          {/* target hover yang lebih besar dari inti, tak terlihat */}
          <mesh visible={false}>
            <sphereGeometry args={[1.6, 8, 8]} />
            <meshBasicMaterial />
          </mesh>
        </group>
      </DragGroup>
    </>
  )
}
