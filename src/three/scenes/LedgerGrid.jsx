import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../geo'

/**
 * Ledger: bidang blok yang bereaksi terhadap pointer.
 * Gelombang tinggi mengikuti jarak kursor — tanpa drag, tanpa klik,
 * jadi user bisa scroll melewatinya tanpa terhalang apa pun.
 * Dipakai instancing supaya 900+ blok tetap satu draw call.
 */

const COLS = 34
const ROWS = 26
const SPACING = 0.26
const COUNT = COLS * ROWS

export default function LedgerGrid() {
  const mesh = useRef()
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const ray = useRef(new THREE.Raycaster())
  const hit = useRef(new THREE.Vector3())
  const pointer3d = useRef(new THREE.Vector3(0, 0, 0))
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const tealColor = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const baseColor = useMemo(() => new THREE.Color(PALETTE.slate), [])

  const cells = useMemo(() => {
    const list = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        list.push({
          x: (x - COLS / 2) * SPACING,
          z: (z - ROWS / 2) * SPACING,
          phase: (x + z) * 0.22
        })
      }
    }
    return list
  }, [])

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    // proyeksikan pointer ke bidang lantai
    ray.current.setFromCamera(state.pointer, state.camera)
    if (ray.current.ray.intersectPlane(plane.current, hit.current)) {
      pointer3d.current.lerp(hit.current, 1 - Math.pow(0.001, dt))
    }

    for (let i = 0; i < COUNT; i++) {
      const c = cells[i]
      const dx = c.x - pointer3d.current.x
      const dz = c.z - pointer3d.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      const ripple = Math.sin(t * 1.1 - c.phase) * 0.05
      const lift = Math.max(0, 1 - dist / 1.9)
      const height = 0.06 + ripple + lift * lift * 0.72

      dummy.position.set(c.x, height / 2, c.z)
      dummy.scale.set(1, Math.max(height, 0.04) / 0.18, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      color.copy(baseColor).lerp(tealColor, Math.min(1, lift * lift * 1.3))
      m.setColorAt(i, color)
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 2]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 3, 3]} intensity={14} color={PALETTE.indigo} distance={14} />

      <group rotation={[0.15, 0.5, 0]} position={[0, -0.6, 0]}>
        <instancedMesh ref={mesh} args={[null, null, COUNT]} frustumCulled={false}>
          <boxGeometry args={[0.17, 0.18, 0.17]} />
          <meshStandardMaterial roughness={0.45} metalness={0.7} flatShading />
        </instancedMesh>
      </group>
    </>
  )
}
