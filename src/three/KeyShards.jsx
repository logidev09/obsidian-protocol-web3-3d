import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDragRotate } from './useDragRotate'

/**
 * KeyShard: kluster kristal poligonal yang bisa diputar dan di-hover per-shard.
 * Tiap shard punya warna aksen berbeda — hover memunculkan glow + skala.
 */
function Shard({ position, rotation, scale, color, index }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  const target = useRef(1)

  useFrame((state, dt) => {
    if (!ref.current) return
    target.current = hovered ? 1.18 : 1
    const s = THREE.MathUtils.damp(ref.current.scale.x, scale * target.current, 6, dt)
    ref.current.scale.setScalar(s)
    ref.current.rotation.y += dt * (hovered ? 0.5 : 0.15)
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.06
    const mat = ref.current.material
    mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, hovered ? 0.9 : 0.18, 6, dt)
  })

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
    >
      <octahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial
        color="#0f141a"
        emissive={color}
        emissiveIntensity={0.18}
        metalness={0.9}
        roughness={0.22}
        flatShading
      />
    </mesh>
  )
}

export default function KeyShards({ palette = ['#3fd8c2', '#7c8cff', '#c9a227'] }) {
  const group = useRef()
  const gl = useThree((s) => s.gl)
  const { step } = useDragRotate(gl.domElement, { sensitivity: 0.006 })

  const shards = useMemo(() => {
    const out = []
    const n = 7
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const r = 1.55
      out.push({
        position: [Math.cos(a) * r, Math.sin(i * 1.7) * 0.35, Math.sin(a) * r],
        rotation: [i * 0.6, a, i * 0.3],
        scale: 0.72 + (i % 3) * 0.16,
        color: palette[i % palette.length]
      })
    }
    return out
  }, [palette])

  useFrame((state, dt) => {
    const s = step()
    if (!group.current) return
    group.current.rotation.y = s.ry + state.clock.elapsedTime * 0.1
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, s.rx + s.pointer.y * 0.18, 3, dt)
  })

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <Shard key={i} index={i} {...s} />
      ))}
      <mesh>
        <icosahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color="#e8edf4" metalness={1} roughness={0.12} flatShading />
      </mesh>
      {shards.map((s, i) => (
        <line key={`l${i}`}>
          <bufferGeometry
            attach="geometry"
            onUpdate={(g) =>
              g.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(...s.position)])
            }
          />
          <lineBasicMaterial color={s.color} transparent opacity={0.22} />
        </line>
      ))}
    </group>
  )
}
