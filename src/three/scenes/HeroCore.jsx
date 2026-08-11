import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from '../DragGroup'
import { PALETTE, fibonacciSphere } from '../geo'

/**
 * HERO — kristal inti (icosahedron) yang "bernapas", dikelilingi cincin orbit
 * dan debu partikel. Bisa di-drag untuk diputar, hover memicu pemuaian shell.
 */
function Core({ hovered }) {
  const inner = useRef()
  const shell = useRef()
  const ringA = useRef()
  const ringB = useRef()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    const breathe = 1 + Math.sin(t * 0.9) * 0.03
    inner.current.scale.setScalar(breathe)

    const goal = hovered ? 1.28 : 1.12
    shell.current.scale.setScalar(
      THREE.MathUtils.damp(shell.current.scale.x, goal, 4, dt)
    )
    shell.current.rotation.y -= dt * 0.25
    shell.current.rotation.x += dt * 0.1

    ringA.current.rotation.z += dt * 0.35
    ringB.current.rotation.x -= dt * 0.28
  })

  return (
    <group>
      <mesh ref={inner} castShadow>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial
          color="#131e29"
          roughness={0.22}
          metalness={0.95}
          flatShading
          emissive={PALETTE.teal}
          emissiveIntensity={hovered ? 0.5 : 0.22}
        />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial color={PALETTE.indigo} wireframe transparent opacity={0.28} />
      </mesh>

      <mesh ref={ringA} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.95, 0.012, 3, 96]} />
        <meshBasicMaterial color={PALETTE.sand} transparent opacity={0.45} />
      </mesh>

      <mesh ref={ringB} rotation={[0, 0.5, Math.PI / 3]}>
        <torusGeometry args={[2.4, 0.008, 3, 96]} />
        <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

function Dust() {
  const points = useRef()

  const geometry = useMemo(() => {
    const pts = fibonacciSphere(420, 1)
    const arr = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      const r = 2.8 + Math.random() * 2.6
      arr[i * 3] = p.x * r
      arr[i * 3 + 1] = p.y * r * 0.65
      arr[i * 3 + 2] = p.z * r
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])

  useFrame((state, delta) => {
    points.current.rotation.y += delta * 0.05
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.028}
        color={PALETTE.slate}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function HeroCore() {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 5, 5]} intensity={1.25} />
      <pointLight position={[-5, -2, 3]} intensity={22} color={PALETTE.violet} distance={18} />
      <pointLight position={[3, 3, -4]} intensity={16} color={PALETTE.teal} distance={16} />

      <Dust />

      <DragGroup autoSpin={0.16} parallax={0.22} scale={1}>
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <Core hovered={hovered} />
        </group>
      </DragGroup>
    </>
  )
}
