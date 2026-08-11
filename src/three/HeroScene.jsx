import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere, getPerfProfile } from './geo'

/**
 * SECTION 1 - artefak inti.
 * Icosahedron low-poly berlapis: badan solid flat-shaded, sangkar wireframe
 * berputar berlawanan arah, dan pecahan kunci yang mengorbit.
 * Klik badan untuk mengunci / membuka vault.
 */

function Shards({ locked }) {
  const ref = useRef()
  const { low } = useMemo(getPerfProfile, [])
  const points = useMemo(() => fibonacciSphere(low ? 10 : 18, 2.55), [low])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((frame, delta) => {
    const m = ref.current
    if (!m) return
    const t = frame.clock.elapsedTime
    const pull = locked ? 0.82 : 1.12

    points.forEach((p, i) => {
      const wobble = Math.sin(t * 1.3 + i) * 0.08
      dummy.position.set(p.x * pull, p.y * pull + wobble, p.z * pull)
      dummy.rotation.set(t * 0.4 + i, t * 0.3, t * 0.2)
      dummy.scale.setScalar(0.09 + Math.sin(t * 2 + i * 0.7) * 0.02)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.rotation.y += Math.min(delta, 0.05) * 0.1
  })

  return (
    <instancedMesh ref={ref} args={[null, null, points.length]}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={PALETTE.copper}
        emissive={PALETTE.copper}
        emissiveIntensity={0.35}
        roughness={0.4}
        metalness={0.7}
        flatShading
      />
    </instancedMesh>
  )
}

function Artifact() {
  const [locked, setLocked] = useState(true)
  const [hover, setHover] = useState(false)
  const cage = useRef()
  const core = useRef()

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime

    if (cage.current) {
      cage.current.rotation.y -= dt * 0.28
      cage.current.rotation.x += dt * 0.06
      const target = locked ? 1.34 : 1.62
      const s = THREE.MathUtils.damp(cage.current.scale.x, target, 4, dt)
      cage.current.scale.setScalar(s)
    }

    if (core.current) {
      const pulse = 1 + Math.sin(t * 1.6) * 0.02
      core.current.scale.setScalar(THREE.MathUtils.damp(core.current.scale.x, pulse, 6, dt))
    }
  })

  return (
    <DragGroup autoSpin={0.18} parallax={1} maxPitch={0.55}>
      <mesh
        ref={core}
        onClick={(e) => {
          e.stopPropagation()
          setLocked((v) => !v)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={() => setHover(false)}
      >
        <icosahedronGeometry args={[1.75, 0]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          emissive={locked ? PALETTE.indigo : PALETTE.teal}
          emissiveIntensity={hover ? 0.55 : 0.3}
          roughness={0.28}
          metalness={0.92}
          flatShading
        />
      </mesh>

      <mesh ref={cage} scale={1.34}>
        <icosahedronGeometry args={[1.75, 1]} />
        <meshBasicMaterial color={PALETTE.steel} wireframe transparent opacity={0.28} />
      </mesh>

      <mesh scale={0.52}>
        <icosahedronGeometry args={[1.75, 0]} />
        <meshBasicMaterial color={locked ? PALETTE.indigo : PALETTE.teal} transparent opacity={0.5} />
      </mesh>

      <Shards locked={locked} />
    </DragGroup>
  )
}

export default function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 5]} intensity={1.1} color={PALETTE.mist} />
      <pointLight position={[-5, -2, 3]} intensity={26} distance={18} color={PALETTE.indigo} />
      <pointLight position={[4, 3, -4]} intensity={18} distance={16} color={PALETTE.teal} />
      <Artifact />
    </>
  )
}
