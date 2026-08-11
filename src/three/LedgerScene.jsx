import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, getPerfProfile } from './geo'

/**
 * SECTION 4 - grid ledger.
 * Bidang kolom yang tingginya bereaksi terhadap jarak pointer,
 * seperti gelombang blok yang tersettle. Tidak bisa di-drag
 * supaya area lebar ini tetap aman untuk scroll.
 */

function Grid() {
  const { low } = useMemo(getPerfProfile, [])
  const cols = low ? 14 : 22
  const rows = low ? 8 : 12
  const gap = 0.42
  const total = cols * rows

  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const pointer3d = useRef(new THREE.Vector2(0, 0))

  const cells = useMemo(() => {
    const arr = []
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        arr.push({
          x: (x - (cols - 1) / 2) * gap,
          z: (z - (rows - 1) / 2) * gap,
          seed: Math.random()
        })
      }
    }
    return arr
  }, [cols, rows])

  useFrame((frame, delta) => {
    const m = mesh.current
    if (!m) return
    const t = frame.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    // proyeksi kasar pointer ke bidang grid
    pointer3d.current.x = THREE.MathUtils.damp(pointer3d.current.x, frame.pointer.x * 4.6, 6, dt)
    pointer3d.current.y = THREE.MathUtils.damp(pointer3d.current.y, -frame.pointer.y * 2.4, 6, dt)

    cells.forEach((cell, i) => {
      const dist = Math.hypot(cell.x - pointer3d.current.x, cell.z - pointer3d.current.y)
      const ripple = Math.max(0, 1 - dist / 2.4)
      const idle = (Math.sin(t * 0.9 + cell.seed * 8 + cell.x) * 0.5 + 0.5) * 0.18
      const h = 0.06 + idle + ripple * ripple * 1.15

      dummy.position.set(cell.x, h / 2, cell.z)
      dummy.scale.set(0.26, h, 0.26)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      color.set(ripple > 0.55 ? PALETTE.teal : ripple > 0.2 ? PALETTE.steel : PALETTE.slate)
      m.setColorAt(i, color)
    })

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <group rotation={[0.45, -0.35, 0]} position={[0, -0.6, 0]}>
      <instancedMesh ref={mesh} args={[null, null, total]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.5} metalness={0.6} flatShading />
      </instancedMesh>
      <gridHelper args={[cols * gap, cols, PALETTE.steel, PALETTE.slate]} position={[0, 0.001, 0]} />
    </group>
  )
}

export default function LedgerScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 8, 4]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[-3, 3, 3]} intensity={16} distance={14} color={PALETTE.copper} />
      <Grid />
    </>
  )
}
