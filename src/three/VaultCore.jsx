import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, mulberry32 } from './geo'

/**
 * HERO — "Vault Core".
 * Icosahedron low-poly berlapis: inti solid, cangkang wireframe yang bernapas,
 * dan cincin shard yang mengorbit. Semua bisa diputar dengan drag.
 */
function Shards({ count = 22 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const shards = useMemo(() => {
    const rand = mulberry32(7)
    return Array.from({ length: count }, () => {
      const radius = 2.35 + rand() * 0.9
      return {
        radius,
        speed: 0.12 + rand() * 0.22,
        offset: rand() * Math.PI * 2,
        tilt: (rand() - 0.5) * 0.9,
        scale: 0.06 + rand() * 0.13,
        spin: (rand() - 0.5) * 1.4
      }
    })
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    shards.forEach((s, i) => {
      const a = s.offset + t * s.speed
      dummy.position.set(
        Math.cos(a) * s.radius,
        Math.sin(a * 0.8 + s.tilt) * s.radius * 0.42,
        Math.sin(a) * s.radius
      )
      dummy.rotation.set(t * s.spin, a, t * s.spin * 0.5)
      dummy.scale.setScalar(s.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={PALETTE.slate}
        emissive={PALETTE.teal}
        emissiveIntensity={0.25}
        roughness={0.35}
        metalness={0.7}
        flatShading
      />
    </instancedMesh>
  )
}

function Core() {
  const inner = useRef()
  const shell = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pulse = 1 + Math.sin(t * 1.1) * 0.02
    shell.current.scale.setScalar(pulse)
    shell.current.rotation.y = -t * 0.08
    inner.current.rotation.x = t * 0.05
  })

  return (
    <group>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.28, 1]} />
        <meshStandardMaterial
          color="#131a24"
          emissive={PALETTE.indigo}
          emissiveIntensity={0.14}
          roughness={0.25}
          metalness={0.9}
          flatShading
        />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[1.85, 1]} />
        <meshBasicMaterial color={PALETTE.teal} wireframe transparent opacity={0.22} />
      </mesh>

      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.55, 0.012, 3, 96]} />
        <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, 0.5, 0]}>
        <torusGeometry args={[2.9, 0.01, 3, 96]} />
        <meshBasicMaterial color={PALETTE.indigo} transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

function Nodes() {
  const points = useMemo(() => fibonacciSphere(46, 2.05), [])
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap((p) => [p.x, p.y, p.z]), 3))
    return g
  }, [points])

  const ref = useRef()
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.045
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.035} color={PALETTE.sand} transparent opacity={0.65} sizeAttenuation />
    </points>
  )
}

export default function VaultCore() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#cfd8e8" />
      <directionalLight position={[-5, -2, -4]} intensity={0.6} color={PALETTE.indigo} />
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={6} color={PALETTE.teal} />

      <DragGroup autoSpin={0.12} parallax={0.16}>
        <Core />
        <Nodes />
        <Shards />
      </DragGroup>
    </>
  )
}
