import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Debu partikel halus — vector points, bukan sprite, jadi sangat murah. */
export default function Dust({ count = 260, radius = 9, color = '#7c8cff', size = 0.02 }) {
  const points = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count, radius])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  useFrame((state, dt) => {
    if (!points.current) return
    points.current.rotation.y += dt * 0.018
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.05
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
