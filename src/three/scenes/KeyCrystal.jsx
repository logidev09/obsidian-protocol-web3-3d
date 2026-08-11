import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, seededRandom } from '../geo'

/**
 * Kristal kunci — objek hero.
 * Inti icosahedron low-poly, cangkang wireframe yang berputar berlawanan arah,
 * dan serpihan orbit. Hover memicu "charge": emissive naik, cangkang mengembang.
 * Drag memutar seluruh rakitan dengan inersia.
 */
export default function KeyCrystal({ intensity = 1 }) {
  const core = useRef()
  const shell = useRef()
  const shards = useRef()
  const [hovered, setHovered] = useState(false)
  const charge = useRef(0)

  const shardData = useMemo(() => {
    const rand = seededRandom(7)
    return Array.from({ length: 14 }, (_, i) => ({
      radius: 2.35 + rand() * 0.9,
      speed: 0.12 + rand() * 0.22,
      offset: rand() * Math.PI * 2,
      tilt: (rand() - 0.5) * 1.5,
      size: 0.06 + rand() * 0.11,
      spin: (rand() - 0.5) * 1.4,
      key: i
    }))
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    charge.current = THREE.MathUtils.damp(charge.current, hovered ? 1 : 0, 5, dt)
    const c = charge.current

    if (core.current) {
      core.current.rotation.y += dt * 0.18
      core.current.rotation.x = Math.sin(t * 0.35) * 0.12
      const breathe = 1 + Math.sin(t * 0.9) * 0.02
      core.current.scale.setScalar(breathe * (1 + c * 0.06))
      core.current.material.emissiveIntensity = (0.22 + c * 0.85) * intensity
    }

    if (shell.current) {
      shell.current.rotation.y -= dt * 0.26
      shell.current.rotation.z += dt * 0.07
      shell.current.scale.setScalar(1 + c * 0.13 + Math.sin(t * 1.2) * 0.012)
      shell.current.material.opacity = 0.16 + c * 0.3
    }

    if (shards.current) {
      shardData.forEach((s, i) => {
        const a = t * s.speed + s.offset
        dummy.position.set(
          Math.cos(a) * s.radius,
          Math.sin(a * 1.3 + s.tilt) * 0.85,
          Math.sin(a) * s.radius
        )
        const pull = 1 - c * 0.16
        dummy.position.multiplyScalar(pull)
        dummy.rotation.set(a * s.spin, a * 0.8, a * 0.4)
        dummy.scale.setScalar(s.size * (1 + c * 0.5))
        dummy.updateMatrix()
        shards.current.setMatrixAt(i, dummy.matrix)
      })
      shards.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 4]} intensity={1.1} color={PALETTE.mist} />
      <pointLight position={[-4, -2, -2]} intensity={9} color={PALETTE.indigo} distance={14} />
      <pointLight position={[2, 1, 4]} intensity={6} color={PALETTE.teal} distance={12} />

      <DragGroup autoSpin={0.5} parallax={0.9}>
        <mesh
          ref={core}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
        >
          <icosahedronGeometry args={[1.35, 0]} />
          <meshStandardMaterial
            color={PALETTE.slate}
            emissive={PALETTE.teal}
            emissiveIntensity={0.22}
            metalness={0.92}
            roughness={0.22}
            flatShading
          />
        </mesh>

        <mesh ref={shell}>
          <icosahedronGeometry args={[1.95, 1]} />
          <meshBasicMaterial color={PALETTE.teal} wireframe transparent opacity={0.16} />
        </mesh>

        <mesh rotation={[Math.PI / 3, 0, 0.4]}>
          <torusGeometry args={[2.5, 0.012, 3, 64]} />
          <meshBasicMaterial color={PALETTE.amber} transparent opacity={0.35} />
        </mesh>

        <instancedMesh ref={shards} args={[undefined, undefined, shardData.length]}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={PALETTE.mist}
            emissive={PALETTE.amber}
            emissiveIntensity={0.25}
            metalness={0.8}
            roughness={0.35}
            flatShading
          />
        </instancedMesh>
      </DragGroup>
    </>
  )
}
