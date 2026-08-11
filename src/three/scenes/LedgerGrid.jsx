import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, seededRandom } from '../geo'

/**
 * Ledger: grid batang yang bereaksi terhadap pointer.
 * Batang di dekat kursor terangkat dan menyala — seperti blok
 * yang sedang di-settle. Semua gerakan lewat damp, jadi tidak ada kejut.
 */

const COLS = 16
const ROWS = 16
const SPACING = 0.28

export default function LedgerGrid() {
  const mesh = useRef()
  const pointer3d = useRef(new THREE.Vector3(999, 999, 0))

  const { positions, phases, count } = useMemo(() => {
    const rand = seededRandom(19)
    const positions = []
    const phases = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        positions.push(
          new THREE.Vector3((x - COLS / 2 + 0.5) * SPACING, 0, (z - ROWS / 2 + 0.5) * SPACING)
        )
        phases.push(rand() * Math.PI * 2)
      }
    }
    return { positions, phases, count: positions.length }
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const baseColor = useMemo(() => new THREE.Color(PALETTE.slate), [])
  const hotColor = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const heights = useRef(new Float32Array(count))

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // proyeksikan pointer ke bidang grid (y = 0)
    pointer3d.current.set(state.pointer.x * 2.6, 0, -state.pointer.y * 2.6)

    for (let i = 0; i < count; i++) {
      const p = positions[i]
      const dist = Math.hypot(p.x - pointer3d.current.x, p.z - pointer3d.current.z)
      const influence = Math.max(0, 1 - dist / 1.25)
      const wave = Math.sin(t * 1.1 + phases[i]) * 0.05 + 0.06
      const targetH = wave + influence * influence * 0.85

      heights.current[i] = THREE.MathUtils.damp(heights.current[i], targetH, 7, dt)
      const h = Math.max(heights.current[i], 0.02)

      dummy.position.set(p.x, h / 2, p.z)
      dummy.scale.set(1, h / 0.2, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      color.copy(baseColor).lerp(hotColor, Math.min(1, influence * 1.4))
      m.setColorAt(i, color)
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 6, 3]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 2.5, 0]} intensity={14} color={PALETTE.indigo} distance={10} />

      <group rotation={[0.5, 0.6, 0]} position={[0, -0.4, 0]}>
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
          <meshStandardMaterial roughness={0.45} metalness={0.7} flatShading />
        </instancedMesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[COLS * SPACING + 0.6, ROWS * SPACING + 0.6]} />
          <meshBasicMaterial color={PALETTE.ink} transparent opacity={0.65} />
        </mesh>
      </group>
    </>
  )
}
