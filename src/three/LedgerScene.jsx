import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, getPerfProfile } from './geo'

/**
 * LEDGER - lantai blok settlement.
 * Grid balok yang naik-turun mengikuti gelombang, dan terangkat lebih tinggi
 * di sekitar kursor. Tidak ada drag di sini supaya section ini tetap enak
 * di-scroll; interaksinya murni hover.
 */
function Blocks({ cols, rows }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const base = useMemo(() => new THREE.Color(PALETTE.slate), [])
  const hotColor = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const tmp = useMemo(() => new THREE.Color(), [])
  const heights = useMemo(() => new Float32Array(cols * rows), [cols, rows])

  const spacing = 0.42
  const total = cols * rows

  useFrame((frame, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = frame.clock.elapsedTime

    const px = frame.pointer.x * (cols * spacing) * 0.55
    const pz = -frame.pointer.y * (rows * spacing) * 0.55

    let i = 0
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = (c - cols / 2) * spacing
        const z = (r - rows / 2) * spacing

        const wave = Math.sin(x * 0.7 + t * 1.1) * 0.12 + Math.cos(z * 0.6 - t * 0.8) * 0.12
        const dist = Math.hypot(x - px, z - pz)
        const lift = Math.max(0, 1 - dist / 2.2) ** 2 * 0.85

        const target = 0.14 + wave + lift
        heights[i] = THREE.MathUtils.damp(heights[i], target, 7, dt)

        dummy.position.set(x, heights[i] / 2, z)
        dummy.scale.set(1, Math.max(0.04, heights[i]), 1)
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)

        tmp.copy(base).lerp(hotColor, THREE.MathUtils.clamp(lift * 1.2, 0, 1))
        m.setColorAt(i, tmp)
        i++
      }
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, total]}>
      <boxGeometry args={[0.3, 1, 0.3]} />
      <meshStandardMaterial
        roughness={0.45}
        metalness={0.65}
        emissive={PALETTE.teal}
        emissiveIntensity={0.12}
        flatShading
      />
    </instancedMesh>
  )
}

export default function LedgerScene() {
  const { low } = getPerfProfile()
  const cols = low ? 14 : 22
  const rows = low ? 10 : 16

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 7, 3]} intensity={1} color="#e4ebf3" />
      <pointLight position={[-3, 3, -4]} intensity={0.7} color={PALETTE.indigo} />
      <group rotation={[0.12, 0.5, 0]} position={[0, -0.6, 0]}>
        <Blocks cols={cols} rows={rows} />
      </group>
    </>
  )
}
