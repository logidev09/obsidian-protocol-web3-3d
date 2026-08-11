import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE, getPerfProfile } from './geo'

/**
 * SECTION 4 — Grid settlement (ledger).
 * Kolom-kolom naik-turun mengikuti gelombang, dan naik lebih tinggi
 * di sekitar kursor. Interaksi murni hover — tidak mencegat scroll.
 */

const dummy = new THREE.Object3D()
const color = new THREE.Color()
const tealColor = new THREE.Color(PALETTE.teal)
const indigoColor = new THREE.Color(PALETTE.indigo)
const baseColor = new THREE.Color(PALETTE.slate)

function Grid() {
  const ref = useRef()
  const { side, gap, count } = useMemo(() => {
    const { low } = getPerfProfile()
    const s = low ? 12 : 18
    return { side: s, gap: 0.42, count: s * s }
  }, [])

  const cells = useMemo(() => {
    const list = []
    const offset = ((side - 1) * 0.42) / 2
    for (let x = 0; x < side; x++) {
      for (let z = 0; z < side; z++) {
        list.push({ x: x * 0.42 - offset, z: z * 0.42 - offset })
      }
    }
    return list
  }, [side])

  useFrame((state, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    const px = state.pointer.x * 4.2
    const pz = -state.pointer.y * 3.2

    for (let i = 0; i < count; i++) {
      const c = cells[i]
      const dx = c.x - px
      const dz = c.z - pz
      const dist = Math.sqrt(dx * dx + dz * dz)

      const wave = Math.sin(t * 1.1 - dist * 1.4) * 0.18 + 0.24
      const bump = Math.max(0, 1 - dist / 2.1) ** 2 * 1.15
      const h = Math.max(0.05, wave + bump)

      dummy.position.set(c.x, h / 2, c.z)
      dummy.scale.set(0.26, h, 0.26)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const mix = Math.min(1, bump * 0.9)
      color.copy(baseColor).lerp(indigoColor, Math.min(1, h * 0.55)).lerp(tealColor, mix)
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <group rotation={[0, Math.PI / 4, 0]} position={[0, -0.9, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.4} metalness={0.7} flatShading />
      </instancedMesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[side * gap + 1.4, side * gap + 1.4]} />
        <meshBasicMaterial color={PALETTE.carbon} transparent opacity={0.55} />
      </mesh>
    </group>
  )
}

export default function LedgerScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 8, 3]} intensity={1} color={PALETTE.mist} />
      <pointLight position={[0, 3, 4]} intensity={16} distance={16} color={PALETTE.teal} />
      <Grid />
    </>
  )
}
