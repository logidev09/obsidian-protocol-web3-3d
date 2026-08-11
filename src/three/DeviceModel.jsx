import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * DeviceModel: representasi perangkat OBSIDIAN — slab poligonal dengan bevel palsu,
 * layar emissive, dan garis sirkuit. Dibuat dari primitive, tanpa file GLTF.
 */
export default function DeviceModel({ accent = '#3fd8c2', edge = '#7c8cff' }) {
  const group = useRef()
  const gl = useThree((s) => s.gl)
  const { step } = useDragRotate(gl.domElement, { sensitivity: 0.007 })

  useFrame((state, dt) => {
    const s = step()
    if (!group.current) return
    group.current.rotation.y = s.ry + Math.sin(state.clock.elapsedTime * 0.3) * 0.25
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, s.rx + 0.1 + s.pointer.y * 0.12, 3, dt)
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, s.pointer.x * -0.08, 3, dt)
  })

  return (
    <group ref={group} scale={1.1}>
      {/* body */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 2.6, 0.22]} />
        <meshStandardMaterial color="#10151b" metalness={0.92} roughness={0.3} />
      </mesh>
      {/* chamfer plate */}
      <mesh position={[0, 0, 0.118]}>
        <boxGeometry args={[1.36, 2.46, 0.02]} />
        <meshStandardMaterial color="#171d25" metalness={0.8} roughness={0.42} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0.55, 0.135]}>
        <planeGeometry args={[1.1, 1.0]} />
        <meshBasicMaterial color={accent} transparent opacity={0.14} />
      </mesh>
      <mesh position={[0, 0.55, 0.14]}>
        <planeGeometry args={[1.1, 1.0]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.35} />
      </mesh>
      {/* keypad dots */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-0.34 + (i % 3) * 0.34, -0.5 - Math.floor(i / 3) * 0.34, 0.135]}>
          <circleGeometry args={[0.08, 6]} />
          <meshBasicMaterial color={i === 4 ? edge : '#2a323d'} />
        </mesh>
      ))}
      {/* side rails */}
      <mesh position={[0.79, 0, 0]}>
        <boxGeometry args={[0.05, 2.6, 0.24]} />
        <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.28} />
      </mesh>
      <mesh position={[-0.79, 0, 0]}>
        <boxGeometry args={[0.05, 2.6, 0.24]} />
        <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.28} />
      </mesh>
      {/* halo */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <torusGeometry args={[1.5, 0.006, 6, 80]} />
        <meshBasicMaterial color={edge} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
