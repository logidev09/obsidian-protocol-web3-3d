import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../geo'

/**
 * Ledger: bidang blok yang bereaksi terhadap pointer.
 * Pointer mendekat → blok terangkat & menyala ("gelombang settlement").
 * Tidak ada drag di sini — section ini dilewati sambil scroll,
 * jadi interaksinya sengaja pasif dan ringan.
 */
const COLS = 18
const ROWS = 10
const GAP = 0.34
const COUNT = COLS * ROWS

function Blocks() {
  const inst = useRef()
  const pointer = useRef(new THREE.Vector3(999, 999, 0))

  const cells = useMemo(() => {
    const arr = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        arr.push({
          x: (x - (COLS - 1) / 2) * GAP,
          z: (z - (ROWS - 1) / 2) * GAP,
          phase: (x + z) * 0.35
        })
      }
    }
    return arr
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const base = useMemo(() => new THREE.Color(PALETTE.steel), [])
  const hot = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame((frame) => {
    const m = inst.current
    if (!m) return
    const t = frame.clock.elapsedTime
    const p = pointer.current

    cells.forEach((c, i) => {
      const d = Math.hypot(c.x - p.x, c.z - p.z)
      const influence = Math.max(0, 1 - d / 1.6)
      const wave = Math.sin(t * 1.2 - c.phase) * 0.05
      const h = 0.08 + wave + influence * influence * 0.85

      dummy.position.set(c.x, h / 2, c.z)
      dummy.scale.set(0.24, Math.max(h, 0.04), 0.24)
      dummy.rotation.y = influence * 0.6
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      tmp.copy(base).lerp(hot, Math.min(influence * 1.2, 1))
      m.setColorAt(i, tmp)
    })

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <group rotation={[0.5, 0.35, 0]} position={[0, -0.4, 0]}>
      {/* bidang tak terlihat untuk membaca posisi pointer di ruang 3D */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => {
          pointer.current.set(e.point.x, 0, e.point.z)
        }}
        onPointerOut={() => pointer.current.set(999, 0, 999)}
      >
        <planeGeometry args={[COLS * GAP + 1, ROWS * GAP + 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <instancedMesh ref={inst} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.4} metalness={0.75} flatShading toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export default function LedgerGrid() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 6, 3]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 3, 2]} intensity={14} color={PALETTE.indigo} distance={12} />
      <Blocks />
    </>
  )
}
