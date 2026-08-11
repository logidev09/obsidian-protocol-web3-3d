import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../geo'

/**
 * Ledger grid: bidang batang vertikal yang bereaksi terhadap kursor.
 * Gelombang mengikuti posisi pointer — metafora likuiditas / throughput.
 * Tidak menangkap gestur scroll: hanya membaca posisi pointer global.
 */

const COLS = 26
const ROWS = 14
const GAP = 0.26
const COUNT = COLS * ROWS

export default function LedgerGrid() {
  const mesh = useRef()
  const { pointer } = useThree()

  const cells = useMemo(() => {
    const arr = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        arr.push({
          x: (x - COLS / 2 + 0.5) * GAP,
          z: (z - ROWS / 2 + 0.5) * GAP,
          seed: (x * 31 + z * 17) % 100 / 100
        })
      }
    }
    return arr
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const tealColor = useMemo(() => new THREE.Color(PALETTE.teal), [])
  const amberColor = useMemo(() => new THREE.Color(PALETTE.amber), [])
  const heights = useRef(new Float32Array(COUNT).fill(0.1))

  useFrame((state, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // pointer NDC → koordinat bidang (kasar tapi cukup, dan sangat murah)
    const px = pointer.x * (COLS * GAP) * 0.55
    const pz = -pointer.y * (ROWS * GAP) * 0.75

    for (let i = 0; i < COUNT; i++) {
      const c = cells[i]
      const dist = Math.hypot(c.x - px, c.z - pz)

      const wave = Math.sin(t * 1.1 - dist * 2.4) * 0.09
      const ripple = Math.max(0, 1 - dist / 1.5) ** 2 * 0.75
      const base = 0.09 + c.seed * 0.14
      const target = base + wave + ripple

      heights.current[i] = THREE.MathUtils.damp(heights.current[i], Math.max(0.04, target), 9, dt)
      const h = heights.current[i]

      dummy.position.set(c.x, h / 2, c.z)
      dummy.scale.set(1, h / 0.1, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      const heat = THREE.MathUtils.clamp((h - 0.12) / 0.7, 0, 1)
      color.set(PALETTE.slate).lerp(tealColor, heat)
      if (heat > 0.7) color.lerp(amberColor, (heat - 0.7) / 0.3 * 0.5)
      m.setColorAt(i, color)
    }

    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 6, 3]} intensity={0.9} color={PALETTE.mist} />
      <pointLight position={[0, 2.5, 0]} intensity={6} color={PALETTE.teal} distance={8} />

      <group rotation={[0.36, 0.5, 0]} position={[0, -0.5, 0]}>
        <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
          <boxGeometry args={[0.11, 0.1, 0.11]} />
          <meshStandardMaterial roughness={0.45} metalness={0.75} flatShading />
        </instancedMesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[COLS * GAP + 0.4, ROWS * GAP + 0.4]} />
          <meshBasicMaterial color={PALETTE.ink} transparent opacity={0.65} />
        </mesh>
      </group>
    </>
  )
}
