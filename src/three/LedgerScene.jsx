import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, getPerfProfile } from './geo'

/**
 * SECTION 4 - ledger grid.
 * Bidang kolom yang naik-turun; kolom terdekat dengan pointer terangkat,
 * sisanya beriak seperti gelombang. Tanpa drag - murni reaktif ke pointer,
 * jadi tidak pernah mengganggu scroll.
 */

const dummy = new THREE.Object3D()
const color = new THREE.Color()

function Columns() {
  const mesh = useRef()
  const pointer3d = useRef(new THREE.Vector3(0, 0, 0))
  const { low } = useMemo(getPerfProfile, [])

  const cols = low ? 12 : 20
  const rows = low ? 12 : 20
  const gap = 0.42
  const count = cols * rows

  const cells = useMemo(() => {
    const list = []
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        list.push({
          x: (x - (cols - 1) / 2) * gap,
          z: (z - (rows - 1) / 2) * gap,
          seed: Math.random() * Math.PI * 2
        })
      }
    }
    return list
  }, [cols, rows])

  const baseColor = useMemo(() => new THREE.Color(PALETTE.slate), [])
  const hotColor = useMemo(() => new THREE.Color(PALETTE.teal), [])

  useFrame((frame, delta) => {
    if (!mesh.current) return
    const t = frame.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    // Proyeksikan pointer ke bidang grid (y = 0).
    pointer3d.current.set(frame.pointer.x * 4.6, 0, -frame.pointer.y * 3.4)

    for (let i = 0; i < count; i++) {
      const c = cells[i]
      const dx = c.x - pointer3d.current.x
      const dz = c.z - pointer3d.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      const wave = Math.sin(t * 1.1 + c.seed + dist * 0.6) * 0.12 + 0.16
      const lift = Math.max(0, 1 - dist / 2.4) ** 2 * 1.15
      const h = wave + lift

      dummy.position.set(c.x, h / 2, c.z)
      dummy.scale.set(1, Math.max(h, 0.02), 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)

      color.copy(baseColor).lerp(hotColor, Math.min(1, lift * 0.85))
      mesh.current.setColorAt(i, color)
    }

    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.rotation.y = THREE.MathUtils.damp(
      mesh.current.rotation.y,
      frame.pointer.x * 0.16,
      3,
      dt
    )
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.11, 0.11, 1, 6]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.75}
        emissive={PALETTE.indigo}
        emissiveIntensity={0.12}
        flatShading
      />
    </instancedMesh>
  )
}

export default function LedgerScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 7, 3]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 3, 4]} intensity={20} distance={16} color={PALETTE.teal} />
      <group rotation={[0.32, 0.5, 0]} position={[0, -0.6, 0]}>
        <Columns />
      </group>
    </>
  )
}
