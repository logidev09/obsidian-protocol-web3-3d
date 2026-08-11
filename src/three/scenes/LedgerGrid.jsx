import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, getPerfProfile } from '../geo'

const perf = getPerfProfile()

/**
 * Grid ledger — bidang balok yang naik-turun mengikuti gelombang,
 * dan terangkat lebih tinggi di sekitar kursor. Tidak ada drag di sini:
 * section ini panjang dan sering dilewati saat scroll, jadi pointer
 * dibiarkan bebas.
 */
export default function LedgerGrid() {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const target = useRef(new THREE.Vector3(0, 0, 0))

  const cols = perf.low ? 12 : 18
  const rows = perf.low ? 8 : 12
  const count = cols * rows
  const gap = 0.42

  const cells = useMemo(() => {
    const list = []
    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        list.push({
          x: (x - (cols - 1) / 2) * gap,
          z: (z - (rows - 1) / 2) * gap,
          phase: (x + z) * 0.35
        })
      }
    }
    return list
  }, [cols, rows])

  const baseColor = useMemo(() => new THREE.Color(PALETTE.slate), [])
  const hotColor = useMemo(() => new THREE.Color(PALETTE.teal), [])

  useFrame(({ clock, pointer, viewport }, delta) => {
    const m = mesh.current
    if (!m) return
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    target.current.x = THREE.MathUtils.damp(
      target.current.x,
      (pointer.x * viewport.width) / 2,
      6,
      dt
    )
    target.current.z = THREE.MathUtils.damp(
      target.current.z,
      (-pointer.y * viewport.height) / 2,
      6,
      dt
    )

    cells.forEach((c, i) => {
      const wave = Math.sin(t * 0.9 + c.phase) * 0.16 + 0.2
      const dx = c.x - target.current.x
      const dz = c.z - target.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const influence = Math.max(0, 1 - dist / 1.9)
      const h = wave + influence * influence * 0.95

      dummy.position.set(c.x, h / 2, c.z)
      dummy.scale.set(0.26, Math.max(0.04, h), 0.26)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      color.copy(baseColor).lerp(hotColor, Math.min(1, influence * 1.15))
      m.setColorAt(i, color)
    })

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 2]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 2.5, 2]} intensity={7} color={PALETTE.indigo} distance={14} />

      <group rotation={[0.62, 0.5, 0]} position={[0, -0.6, 0]}>
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial metalness={0.75} roughness={0.35} flatShading toneMapped={false} />
        </instancedMesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[cols * gap + 0.6, rows * gap + 0.6]} />
          <meshBasicMaterial color={PALETTE.ink} transparent opacity={0.7} />
        </mesh>
      </group>
    </>
  )
}
