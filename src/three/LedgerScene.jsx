import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, getPerfProfile } from './geo'

/**
 * SECTION 4 - grid ledger.
 * Bidang batang yang tingginya bereaksi terhadap posisi pointer, seperti
 * riak pada buku besar. Tidak ada drag di sini supaya scroll tetap ringan;
 * interaksinya murni hover.
 */

function Grid() {
  const ref = useRef()
  const { low, reducedMotion } = useMemo(getPerfProfile, [])
  const size = low ? 14 : 22
  const gap = 0.34
  const count = size * size

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const base = useMemo(() => new THREE.Color(PALETTE.slate), [])
  const crest = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const pointer = useMemo(() => new THREE.Vector2(), [])

  useFrame((frame, delta) => {
    const m = ref.current
    if (!m) return
    const t = reducedMotion ? 0 : frame.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    pointer.x = THREE.MathUtils.damp(pointer.x, frame.pointer.x * (size * gap) * 0.5, 6, dt)
    pointer.y = THREE.MathUtils.damp(pointer.y, frame.pointer.y * (size * gap) * 0.5, 6, dt)

    let i = 0
    const offset = ((size - 1) * gap) / 2

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const px = x * gap - offset
        const pz = z * gap - offset

        const wave = Math.sin(px * 1.2 + t * 0.9) * Math.cos(pz * 1.2 - t * 0.7) * 0.16
        const d = Math.hypot(px - pointer.x, pz + pointer.y)
        const ripple = Math.max(0, 1 - d / 2.6) ** 2 * 0.75
        const h = 0.06 + wave + ripple

        dummy.position.set(px, h / 2, pz)
        dummy.scale.set(1, Math.max(0.04, h) / 0.24, 1)
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)

        color.copy(base).lerp(crest, THREE.MathUtils.clamp(ripple * 1.6, 0, 1))
        m.setColorAt(i, color)
        i++
      }
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, count]} rotation={[0.18, 0.6, 0]}>
      <boxGeometry args={[0.16, 0.24, 0.16]} />
      <meshStandardMaterial roughness={0.5} metalness={0.6} flatShading toneMapped={false} />
    </instancedMesh>
  )
}

export default function LedgerScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 2]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[-3, 3, 3]} intensity={16} distance={14} color={PALETTE.copper} />
      <Grid />
    </>
  )
}
