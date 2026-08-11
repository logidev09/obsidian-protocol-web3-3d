import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, damp } from '../geo'

/**
 * LEDGER — field balok yang naik-turun mengikuti pointer.
 * Interaksi tanpa drag: cukup gerakkan mouse, blok di sekitar kursor terangkat.
 */
const COLS = 22
const ROWS = 14
const GAP = 0.42

export default function LedgerField() {
  const mesh = useRef()
  const pointer = useRef(new THREE.Vector2(0, 0))
  const target = useRef(new THREE.Vector3(0, 0, 0))
  const heights = useRef(new Float32Array(COLS * ROWS))
  const { viewport } = useThree()

  const { positions, seeds } = useMemo(() => {
    const positions = []
    const seeds = []
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        positions.push(
          new THREE.Vector3((x - COLS / 2) * GAP, 0, (z - ROWS / 2) * GAP)
        )
        seeds.push(Math.random())
      }
    }
    return { positions, seeds }
  }, [])

  const geo = useMemo(() => new THREE.BoxGeometry(0.26, 1, 0.26), [])
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#16212c',
        roughness: 0.4,
        metalness: 0.75,
        flatShading: true
      }),
    []
  )

  const color = useMemo(() => new THREE.Color(), [])
  const cold = useMemo(() => new THREE.Color('#16212c'), [])
  const warm = useMemo(() => new THREE.Color(PALETTE.teal), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    pointer.current.copy(state.pointer)
    target.current.set(
      (pointer.current.x * viewport.width) / 2,
      0,
      (-pointer.current.y * viewport.height) / 2
    )

    const dummy = new THREE.Object3D()
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i]
      const dx = p.x - target.current.x
      const dz = p.z - target.current.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const influence = Math.max(0, 1 - dist / 2.6)
      const wave = Math.sin(t * 1.1 + p.x * 0.5 + p.z * 0.35) * 0.12 + 0.18
      const goal = wave + influence * influence * 1.5 + seeds[i] * 0.08

      heights.current[i] = damp(heights.current[i], goal, 6, dt)
      const h = heights.current[i]

      dummy.position.set(p.x, h / 2, p.z)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)

      color.copy(cold).lerp(warm, Math.min(1, (h - 0.2) / 1.3))
      mesh.current.setColorAt(i, color)
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 8, 4]} intensity={1.3} />
      <pointLight position={[0, 3, 0]} intensity={16} color={PALETTE.indigo} distance={14} />
      <group rotation={[0.62, 0.5, 0]} position={[0, -0.6, 0]}>
        <instancedMesh ref={mesh} args={[geo, mat, COLS * ROWS]} />
      </group>
    </>
  )
}
