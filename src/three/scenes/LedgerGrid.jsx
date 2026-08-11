import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../geo'

/**
 * Ledger: grid balok yang naik-turun mengikuti kursor.
 * Digambar dengan satu InstancedMesh (900 instance, 1 draw call) supaya
 * tetap ringan. Tinggi tiap balok = riak sinus + dorongan dari jarak kursor.
 */

const GRID = 30
const SPACING = 0.26
const COUNT = GRID * GRID

export default function LedgerGrid() {
  const mesh = useRef()
  const { viewport } = useThree()
  const pointer = useRef(new THREE.Vector2(0, 0))
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const heights = useMemo(() => new Float32Array(COUNT), [])

  const offsets = useMemo(() => {
    const arr = []
    const half = (GRID - 1) / 2
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        arr.push([(x - half) * SPACING, (z - half) * SPACING])
      }
    }
    return arr
  }, [])

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // pointer dalam satuan dunia
    pointer.current.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2
    )

    const color = new THREE.Color()
    const base = new THREE.Color(PALETTE.slate)
    const hot = new THREE.Color(PALETTE.teal)

    for (let i = 0; i < COUNT; i++) {
      const [x, z] = offsets[i]
      const wave = Math.sin(x * 1.6 + t * 0.9) * Math.cos(z * 1.6 + t * 0.6) * 0.16
      const dist = Math.hypot(x - pointer.current.x, z + pointer.current.y)
      const push = Math.max(0, 1 - dist / 1.6) ** 2 * 0.85
      const target = 0.08 + wave + push

      heights[i] = THREE.MathUtils.damp(heights[i], target, 7, dt)
      const h = Math.max(heights[i], 0.02)

      dummy.position.set(x, h / 2, z)
      dummy.scale.set(1, h / 0.2, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      color.copy(base).lerp(hot, THREE.MathUtils.clamp((h - 0.08) / 0.8, 0, 1))
      m.setColorAt(i, color)
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 2]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 2, 2]} intensity={8} color={PALETTE.indigo} distance={12} />

      <group rotation={[-0.62, 0.42, 0]} position={[0, -0.7, 0]}>
        <instancedMesh ref={mesh} args={[null, null, COUNT]}>
          <boxGeometry args={[0.14, 0.2, 0.14]} />
          <meshStandardMaterial roughness={0.4} metalness={0.75} flatShading />
        </instancedMesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[GRID * SPACING, GRID * SPACING]} />
          <meshBasicMaterial color={PALETTE.void} transparent opacity={0.55} />
        </mesh>
      </group>
    </>
  )
}
