import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** Kamera bergeser halus mengikuti pointer — memberi kedalaman tanpa mengganggu scroll. */
export default function ParallaxRig({ strength = 0.55, lerp = 0.045 }) {
  const { camera } = useThree()
  const base = useRef(camera.position.clone())
  const target = useRef(new THREE.Vector3())

  useFrame((state) => {
    const { x, y } = state.pointer
    target.current.set(
      base.current.x + x * strength,
      base.current.y + y * strength * 0.6,
      base.current.z
    )
    camera.position.lerp(target.current, lerp)
    camera.lookAt(0, 0, 0)
  })

  return null
}
