import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, getPerfProfile, seededRandom } from '../geo'

const perf = getPerfProfile()

/**
 * Kristal hero — inti ikosahedron low-poly di dalam sangkar wireframe,
 * dikelilingi serpihan orbit. Bisa diputar dengan drag; hover membuat
 * inti "terbuka" dan serpihan mengembang.
 */
export default function HeroCrystal() {
  const core = useRef()
  const cage = useRef()
  const shards = useRef()
  const ring = useRef()
  const [hovered, setHovered] = useState(false)
  const open = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const shardCount = Math.round(34 * perf.particles)

  const shardData = useMemo(() => {
    const rand = seededRandom(7)
    return Array.from({ length: shardCount }, () => {
      const radius = 1.85 + rand() * 1.5
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      return {
        radius,
        theta,
        phi,
        speed: 0.08 + rand() * 0.22,
        scale: 0.045 + rand() * 0.075,
        spin: rand() * Math.PI
      }
    })
  }, [shardCount])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime

    open.current = THREE.MathUtils.damp(open.current, hovered ? 1 : 0, 5, dt)

    if (core.current) {
      const s = 1 + Math.sin(t * 1.1) * 0.02 + open.current * 0.06
      core.current.scale.setScalar(s)
      core.current.material.emissiveIntensity = 0.35 + open.current * 0.55
    }

    if (cage.current) {
      cage.current.rotation.y = t * 0.18
      cage.current.rotation.x = Math.sin(t * 0.24) * 0.14
      cage.current.scale.setScalar(1 + open.current * 0.12)
      cage.current.material.opacity = 0.16 + open.current * 0.2
    }

    if (ring.current) {
      ring.current.rotation.z = t * 0.32
      ring.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.3) * 0.08
    }

    if (shards.current) {
      shardData.forEach((s, i) => {
        const angle = s.theta + t * s.speed
        const r = s.radius + open.current * 0.55
        dummy.position.set(
          Math.sin(s.phi) * Math.cos(angle) * r,
          Math.cos(s.phi) * r * 0.72 + Math.sin(t * 0.6 + i) * 0.06,
          Math.sin(s.phi) * Math.sin(angle) * r
        )
        dummy.rotation.set(t * 0.4 + s.spin, angle, s.spin)
        dummy.scale.setScalar(s.scale * (1 + open.current * 0.3))
        dummy.updateMatrix()
        shards.current.setMatrixAt(i, dummy.matrix)
      })
      shards.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 3]} intensity={1.4} color={PALETTE.mist} />
      <pointLight position={[-3.5, -1.5, 2.5]} intensity={12} color={PALETTE.indigo} distance={14} />
      <pointLight position={[2.5, 1.5, -3]} intensity={9} color={PALETTE.teal} distance={12} />

      <DragGroup autoSpin={0.28} parallax={0.9}>
        <mesh
          ref={core}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
        >
          <icosahedronGeometry args={[1.25, 1]} />
          <meshStandardMaterial
            color={PALETTE.slate}
            emissive={PALETTE.teal}
            emissiveIntensity={0.35}
            metalness={0.92}
            roughness={0.22}
            flatShading
          />
        </mesh>

        <mesh ref={cage}>
          <icosahedronGeometry args={[1.78, 1]} />
          <meshBasicMaterial color={PALETTE.mist} wireframe transparent opacity={0.16} />
        </mesh>

        <mesh ref={ring}>
          <torusGeometry args={[2.3, 0.012, 6, 96]} />
          <meshBasicMaterial color={PALETTE.amber} transparent opacity={0.5} toneMapped={false} />
        </mesh>

        <instancedMesh ref={shards} args={[undefined, undefined, shardCount]}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={PALETTE.steel}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.25}
            metalness={0.9}
            roughness={0.3}
            flatShading
          />
        </instancedMesh>
      </DragGroup>
    </>
  )
}
