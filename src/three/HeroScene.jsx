import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import DragGroup from './DragGroup'
import { PALETTE, fibonacciSphere } from './geo'

/**
 * HERO — inti kristal ikosahedral.
 * Interaksi: drag memutar, hover memicu "fracture" (shell pecah menjauh),
 * pointer juga menggeser highlight rim light.
 */

function CoreCrystal() {
  const inner = useRef()
  const shell = useRef()
  const [hot, setHot] = useState(false)

  const geo = useMemo(() => new THREE.IcosahedronGeometry(1.35, 0), [])
  const shellGeo = useMemo(() => new THREE.IcosahedronGeometry(1.9, 1), [])

  // simpan posisi asli tiap vertex shell untuk efek fracture
  const base = useMemo(() => shellGeo.attributes.position.array.slice(), [shellGeo])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    inner.current.rotation.x += dt * 0.25
    inner.current.rotation.z -= dt * 0.18

    const target = hot ? 1 : 0
    shell.current.userData.k = THREE.MathUtils.damp(
      shell.current.userData.k ?? 0,
      target,
      3.5,
      dt
    )
    const k = shell.current.userData.k

    const pos = shell.current.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3
      const bx = base[ix]
      const by = base[ix + 1]
      const bz = base[ix + 2]
      const wobble = Math.sin(t * 1.4 + i * 0.35) * 0.05
      const push = 1 + k * 0.28 + wobble * (0.4 + k)
      pos.array[ix] = bx * push
      pos.array[ix + 1] = by * push
      pos.array[ix + 2] = bz * push
    }
    pos.needsUpdate = true
    shell.current.rotation.y += dt * 0.08
  })

  return (
    <group
      onPointerOver={() => setHot(true)}
      onPointerOut={() => setHot(false)}
    >
      <mesh ref={inner} geometry={geo}>
        <meshStandardMaterial
          color={PALETTE.steel}
          metalness={0.85}
          roughness={0.22}
          emissive={PALETTE.teal}
          emissiveIntensity={hot ? 0.5 : 0.22}
          flatShading
        />
      </mesh>

      <mesh ref={shell} geometry={shellGeo}>
        <meshBasicMaterial
          color={hot ? PALETTE.teal : PALETTE.indigo}
          wireframe
          transparent
          opacity={0.32}
        />
      </mesh>
    </group>
  )
}

function OrbitField({ count = 90 }) {
  const ref = useRef()
  const points = useMemo(() => fibonacciSphere(count, 3.1), [count])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const arr = new Float32Array(points.length * 3)
    points.forEach((p, i) => {
      arr[i * 3] = p.x
      arr[i * 3 + 1] = p.y
      arr[i * 3 + 2] = p.z
    })
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [points])

  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.06
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.045}
        color={PALETTE.slate}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  )
}

function Rings() {
  const a = useRef()
  const b = useRef()

  useFrame((state, delta) => {
    a.current.rotation.z += delta * 0.12
    b.current.rotation.z -= delta * 0.09
  })

  return (
    <group>
      <mesh ref={a} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.5, 0.012, 3, 96]} />
        <meshBasicMaterial color={PALETTE.violet} transparent opacity={0.5} />
      </mesh>
      <mesh ref={b} rotation={[Math.PI / 1.7, 0.4, 0]}>
        <torusGeometry args={[2.9, 0.01, 3, 96]} />
        <meshBasicMaterial color={PALETTE.teal} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

export default function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color={PALETTE.slate} />
      <pointLight position={[-5, -2, 3]} intensity={18} distance={14} color={PALETTE.indigo} />
      <pointLight position={[3, 2, -4]} intensity={12} distance={12} color={PALETTE.teal} />

      <DragGroup autoSpin={0.18} parallax={0.22}>
        <CoreCrystal />
        <Rings />
        <OrbitField />
      </DragGroup>
    </>
  )
}
