import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../geo'

/**
 * Ledger grid: bidang blok ter-instanced yang "terangkat" mengikuti pointer.
 * Interaksi langsung ke posisi kursor di atas plane — tanpa drag,
 * jadi aman dilewati saat scroll.
 */

const COLS = 26
const ROWS = 16
const GAP = 0.34
const COUNT = COLS * ROWS

export default function LedgerGrid() {
  const mesh = useRef()
  const pointer = useRef(new THREE.Vector3(0, 0, 999))
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const base = useMemo(() => new THREE.Color(PALETTE.slate), [])
  const hot = useMemo(() => new THREE.Color(PALETTE.teal), [])

  const cells = useMemo(() => {
    const list = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        list.push({
          x: (x - (COLS - 1) / 2) * GAP,
          z: (z - (ROWS - 1) / 2) * GAP,
          phase: (x + z) * 0.35
        })
      }
    }
    return list
  }, [])

  const heights = useRef(new Float32Array(COUNT))

  useFrame((state, delta) => {
    const inst = mesh.current
    if (!inst) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const p = pointer.current

    for (let i = 0; i < COUNT; i++) {
      const c = cells[i]
      const dx = c.x - p.x
      const dz = c.z - p.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      const wave = Math.sin(t * 1.1 - c.phase) * 0.055 + 0.075
      const influence = Math.max(0, 1 - dist / 2.4)
      const target = wave + influence * influence * 1.05

      heights.current[i] = THREE.MathUtils.damp(heights.current[i], target, 7, dt)
      const h = heights.current[i]

      dummy.position.set(c.x, h / 2, c.z)
      dummy.scale.set(1, Math.max(h, 0.02) / 0.1, 1)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)

      color.copy(base).lerp(hot, Math.min(1, influence * 1.3))
      inst.setColorAt(i, color)
    }

    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 3]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 3, 0]} intensity={14} color={PALETTE.indigo} distance={12} />

      <group rotation={[0.15, 0.5, 0]}>
        {/* plane tak terlihat untuk membaca posisi kursor di ruang grid */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          onPointerMove={(e) => {
            e.stopPropagation()
            pointer.current.set(e.point.x, 0, e.point.z)
          }}
          onPointerOut={() => pointer.current.set(0, 0, 999)}
        >
          <planeGeometry args={[COLS * GAP + 2, ROWS * GAP + 2]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
          <boxGeometry args={[0.2, 0.1, 0.2]} />
          <meshStandardMaterial
            roughness={0.4}
            metalness={0.75}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.16}
            flatShading
          />
        </instancedMesh>

        <gridHelper
          args={[COLS * GAP, COLS, PALETTE.steel, PALETTE.slate]}
          position={[0, -0.02, 0]}
        />
      </group>
    </>
  )
}
