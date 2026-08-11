import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Pembungkus interaksi mouse untuk objek 3D.
 *
 * Aturan penting untuk kenyamanan scroll:
 * - Pointer capture hanya aktif setelah pointerdown DI ATAS objek.
 * - Wheel tidak pernah di-intercept, jadi scroll halaman tidak pernah tersangkut.
 * - Saat idle, objek mengikuti posisi kursor dengan sangat halus (parallax),
 *   bukan mengunci kamera.
 */
export default function DragGroup({
  children,
  autoSpin = 0.8,
  parallax = 0.6,
  scale = 1,
  position = [0, 0, 0]
}) {
  const group = useRef()
  const drag = useRef({ active: false, x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  const { gl } = useThree()

  const onPointerDown = (e) => {
    e.stopPropagation()
    drag.current = { active: true, x: e.clientX, y: e.clientY }
    gl.domElement.style.cursor = 'grabbing'
    e.target.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current.x = e.clientX
    drag.current.y = e.clientY
    velocity.current.y += dx * 0.005
    velocity.current.x += dy * 0.004
  }

  const endDrag = (e) => {
    if (!drag.current.active) return
    drag.current.active = false
    gl.domElement.style.cursor = 'grab'
    e?.target?.releasePointerCapture?.(e.pointerId)
  }

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    // rotasi dari drag + inersia
    g.rotation.y += velocity.current.y
    g.rotation.x += velocity.current.x
    g.rotation.x = THREE.MathUtils.clamp(g.rotation.x, -0.85, 0.85)
    velocity.current.y *= 0.92
    velocity.current.x *= 0.92

    // spin otomatis saat tidak disentuh
    if (!drag.current.active) {
      g.rotation.y += dt * 0.12 * autoSpin
    }

    // parallax halus mengikuti kursor
    target.current.x = state.pointer.x * 0.28 * parallax
    target.current.y = state.pointer.y * 0.18 * parallax
    g.position.x = THREE.MathUtils.damp(g.position.x, position[0] + target.current.x, 3, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, position[1] + target.current.y, 3, dt)
  })

  return (
    <group
      ref={group}
      scale={scale}
      position={position}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerOver={() => { gl.domElement.style.cursor = 'grab' }}
      onPointerOut={() => { gl.domElement.style.cursor = 'auto' }}
    >
      {children}
    </group>
  )
}
