import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, damp, fibonacciSphere } from '../geo'

/**
 * HERO — "The Vault Core".
 * Icosahedron low-poly berlapis: inti solid, sangkar wireframe yang berdenyut,
 * dan cincin partikel. Drag untuk memutar, hover untuk membuka lapisan.
 */
function Core({ hovered }) {
  const inner = useRef()
  const cage = useRef()
  const shell = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const open = hovered.current ? 1 : 0

    const s = 1 + Math.sin(t * 1.1) * 0.015
    inner.current.scale.setScalar(s)

    cage.current.rotation.y += dt * 0.25
    cage.current.rotation.z += dt * 0.08
    const cageScale = damp(cage.current.scale.x, 1.32 + open * 0.16, 4, dt)
    cage.current.scale.setScalar(cageScale)

    shell.current.rotation.y -= dt * 0.14
    const shellScale = damp(shell.current.scale.x, 1.72 + open * 0.3, 3, dt)
    shell.current.scale.setScalar(shellScale)
    shell.current.material.opacity = damp(shell.current.material.opacity, 0.1 + open * 0.16, 4, dt)
  })

  return (
    <group>
      <mesh ref={inner} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={PALETTE.panel}
          roughness={0.32}
          metalness={0.85}
          flatShading
          emissive={PALETTE.teal}
          emissiveIntensity={0.14}
        />
      </mesh>

      <mesh ref={cage}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={PALETTE.teal} wireframe transparent opacity={0.4} />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

function OrbitDust({ count = 320 }) {
  const points = useRef()

  const { positions, radii, speeds, phases } = useMemo(() => {
    const pts = fibonacciSphere(count, 1)
    const positions = new Float32Array(count * 3)
    const radii = new Float32Array(count)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)
    pts.forEach((p, i) => {
      const r = 2.5 + (i % 7) * 0.12
      radii[i] = r
      speeds[i] = 0.06 + ((i % 11) / 11) * 0.12
      phases[i] = Math.atan2(p.z, p.x)
      positions[i * 3] = p.x * r
      positions[i * 3 + 1] = p.y * r * 0.55
      positions[i * 3 + 2] = p.z * r
    })
    return { positions, radii, speeds, phases }
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const arr = points.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const angle = phases[i] + t * speeds[i]
      const r = radii[i]
      arr[i * 3] = Math.cos(angle) * r
      arr[i * 3 + 2] = Math.sin(angle) * r
      arr[i * 3 + 1] += Math.sin(t * 0.6 + i) * 0.0012
    }
    points.current.geometry.attributes.position.needsUpdate = true
    points.current.rotation.z = Math.sin(t * 0.15) * 0.12
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color={PALETTE.slate}
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function VaultCore() {
  const hovered = useRef(false)

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color={PALETTE.slate} />
      <pointLight position={[-5, -2, -4]} intensity={22} color={PALETTE.indigo} distance={18} />
      <pointLight position={[3, 2, 4]} intensity={16} color={PALETTE.teal} distance={16} />

      <DragGroup autoSpin={0.12} parallax={0.22}>
        <group
          onPointerOver={() => (hovered.current = true)}
          onPointerOut={() => (hovered.current = false)}
        >
          <Core hovered={hovered} />
          {/* hit-area tak terlihat supaya drag terasa longgar */}
          <mesh visible={false}>
            <sphereGeometry args={[2.1, 12, 12]} />
            <meshBasicMaterial />
          </mesh>
        </group>
      </DragGroup>

      <OrbitDust />
    </>
  )
}
