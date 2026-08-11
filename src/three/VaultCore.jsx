import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * Hero object: "The Vault Core".
 * Icosahedron low-poly + wireframe shell + inner shard, semua procedural (tanpa asset).
 * Bisa di-drag untuk diputar, dan bereaksi halus pada posisi kursor.
 */
export default function VaultCore({ accent = '#3fd8c2', edge = '#7c8cff' }) {
  const group = useRef()
  const shell = useRef()
  const core = useRef()
  const gl = useThree((s) => s.gl)
  const { step } = useDragRotate(gl.domElement, { sensitivity: 0.005 })

  const geo = useMemo(() => new THREE.IcosahedronGeometry(1.35, 1), [])
  const shellGeo = useMemo(() => new THREE.IcosahedronGeometry(1.95, 1), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(shellGeo), [shellGeo])

  useFrame((state, dt) => {
    const s = step()
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = s.ry + t * 0.12
      group.current.rotation.x = s.rx + Math.sin(t * 0.4) * 0.05
      // parallax lembut mengikuti kursor
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, s.pointer.x * 0.35, 3, dt)
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -s.pointer.y * 0.25, 3, dt)
    }
    if (shell.current) {
      shell.current.rotation.y = -t * 0.18
      shell.current.rotation.z = t * 0.06
    }
    if (core.current) {
      const k = 1 + Math.sin(t * 1.6) * 0.02
      core.current.scale.setScalar(k)
    }
  })

  return (
    <group ref={group}>
      <mesh ref={core} geometry={geo} castShadow>
        <meshStandardMaterial
          color="#12161c"
          roughness={0.28}
          metalness={0.85}
          flatShading
          emissive={accent}
          emissiveIntensity={0.14}
        />
      </mesh>

      <mesh geometry={geo} scale={1.008}>
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.16} />
      </mesh>

      <group ref={shell}>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={edge} transparent opacity={0.34} />
        </lineSegments>
      </group>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.008, 6, 96]} />
        <meshBasicMaterial color={edge} transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2.6, 0.5, 0]}>
        <torusGeometry args={[2.85, 0.006, 6, 96]} />
        <meshBasicMaterial color={accent} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}
