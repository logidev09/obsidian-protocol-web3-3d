import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, getPerfProfile } from './geo'

/**
 * LEDGER - bidang blok tersettle.
 * Grid balok yang terangkat mengikuti jarak ke pointer, seperti riak.
 * Digambar dengan InstancedMesh: ratusan blok, satu draw call.
 */
export default function LedgerScene() {
  const mesh = useRef()
  const { low, reducedMotion } = getPerfProfile()
  const size = low ? 12 : 20
  const gap = 0.42

  const { positions, dummy, color } = useMemo(() => {
    const pos = []
    const offset = ((size - 1) * gap) / 2
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        pos.push(new THREE.Vector3(x * gap - offset, 0, z * gap - offset))
      }
    }
    return { positions: pos, dummy: new THREE.Object3D(), color: new THREE.Color() }
  }, [size])

  const heights = useRef(new Float32Array(positions.length))
  const { viewport } = useThree()

  useFrame((state, delta) => {
    const inst = mesh.current
    if (!inst) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    const px = state.pointer.x * (viewport.width / 2.6)
    const pz = -state.pointer.y * (viewport.height / 2.2)

    const cool = new THREE.Color(PALETTE.slate)
    const warm = new THREE.Color(PALETTE.teal)
    const hot = new THREE.Color(PALETTE.copper)

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i]
      const dist = Math.hypot(p.x - px, p.z - pz)
      const wave = reducedMotion ? 0 : Math.sin(t * 0.8 - dist * 1.6) * 0.06
      const lift = Math.max(0, 1 - dist / 2.4)
      const target = lift * lift * 0.9 + wave

      heights.current[i] = THREE.MathUtils.damp(heights.current[i], target, 7, dt)
      const h = Math.max(0.04, heights.current[i])

      dummy.position.set(p.x, h / 2, p.z)
      dummy.scale.set(1, h / 0.3, 1)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)

      const intensity = THREE.MathUtils.clamp(heights.current[i] / 0.9, 0, 1)
      color.copy(cool).lerp(warm, Math.min(1, intensity * 1.6))
      if (intensity > 0.6) color.lerp(hot, (intensity - 0.6) / 0.4)
      inst.setColorAt(i, color)
    }

    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 3]} intensity={1} color="#e2eaf2" />
      <pointLight position={[-3, 4, -3]} intensity={0.5} color={PALETTE.indigo} />

      <group rotation={[0.95, 0.6, 0]} position={[0, -0.6, 0]}>
        <instancedMesh ref={mesh} args={[null, null, positions.length]}>
          <boxGeometry args={[0.26, 0.3, 0.26]} />
          <meshStandardMaterial roughness={0.45} metalness={0.55} flatShading />
        </instancedMesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[size * gap + 1, size * gap + 1]} />
          <meshBasicMaterial color={PALETTE.void} transparent opacity={0.55} />
        </mesh>
      </group>
    </>
  )
}
