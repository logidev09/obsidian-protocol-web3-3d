import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, seededRandom } from '../geo'

/**
 * Ledger: grid balok transaksi. Balok terangkat mengikuti jarak ke kursor
 * (efek "riak"), plus gelombang idle pelan. Semua lewat instancing — satu
 * draw call untuk 400+ balok, jadi tetap ringan saat discroll.
 */
function Blocks({ cols = 22, rows = 22, gap = 0.42 }) {
  const mesh = useRef()
  const { viewport } = useThree()
  const pointer = useRef(new THREE.Vector2(999, 999))

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const count = cols * rows

  const cells = useMemo(() => {
    const rand = seededRandom(20260714)
    const list = []
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        list.push({
          x: (x - cols / 2) * gap,
          z: (z - rows / 2) * gap,
          seed: rand(),
          phase: rand() * Math.PI * 2
        })
      }
    }
    return list
  }, [cols, rows, gap])

  useFrame((frame, delta) => {
    if (!mesh.current) return
    const t = frame.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    const px = (frame.pointer.x * viewport.width) / 2
    const pz = (-frame.pointer.y * viewport.height) / 2
    pointer.current.x = THREE.MathUtils.damp(pointer.current.x, px, 8, dt)
    pointer.current.y = THREE.MathUtils.damp(pointer.current.y, pz, 8, dt)

    for (let i = 0; i < count; i++) {
      const c = cells[i]
      const dx = c.x - pointer.current.x
      const dz = c.z - pointer.current.y * 1.6
      const dist = Math.sqrt(dx * dx + dz * dz)

      const ripple = Math.max(0, 1 - dist / 3.4) ** 2
      const wave = Math.sin(t * 0.9 + c.phase) * 0.06 + c.seed * 0.12
      const height = 0.08 + wave + ripple * 1.5

      dummy.position.set(c.x, height / 2, c.z)
      dummy.scale.set(0.3, Math.max(height, 0.04), 0.3)
      dummy.rotation.y = c.seed * 0.4
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)

      color
        .set(PALETTE.slate)
        .lerp(new THREE.Color(PALETTE.teal), Math.min(ripple * 1.1, 0.85))
      mesh.current.setColorAt(i, color)
    }

    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.5} metalness={0.45} flatShading />
    </instancedMesh>
  )
}

export default function LedgerGrid() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 8, 3]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 4, 0]} intensity={26} color={PALETTE.indigo} distance={18} />

      <group rotation={[0.62, 0.42, 0]} position={[0, -0.6, 0]}>
        <Blocks />
        <gridHelper args={[10, 24, PALETTE.steel, PALETTE.slate]} position={[0, -0.01, 0]}>
          <meshBasicMaterial transparent opacity={0.15} />
        </gridHelper>
      </group>
    </>
  )
}
