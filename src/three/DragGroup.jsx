import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * DragGroup — kontrol rotasi berbasis pointer.
 *
 * Kenapa bukan OrbitControls: OrbitControls menangkap event wheel dan
 * membajak scroll halaman. Di sini wheel sengaja dibiarkan lewat, jadi
 * halaman tetap nyaman di-scroll sementara objek tetap bisa diputar.
 *
 * - drag  : memutar objek, dengan inersia yang meredam halus
 * - hover : parallax lembut mengikuti posisi pointer
 * - idle  : auto-spin pelan supaya scene tidak terasa mati
 */
export default function DragGroup({
  children,
  autoSpin = 0.2,
  parallax = 0.2,
  scale = 1
}) {
  const group = useRef()
  const drag = useRef({ active: false, x: 0, y: 0 })
  const vel = useRef({ x: 0, y: 0 })
  const { gl } = useThree()

  const onDown = (e) => {
    e.stopPropagation()
    drag.current = { active: true, x: e.clientX, y: e.clientY }
    gl.domElement.style.cursor = 'grabbing'
    e.target.setPointerCapture?.(e.pointerId)
  }

  const onMove = (e) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current.x = e.clientX
    drag.current.y = e.clientY
    vel.current.x += dy * 0.0006
    vel.current.y += dx * 0.0006
  }

  const onUp = (e) => {
    drag.current.active = false
    gl.domElement.style.cursor = 'grab'
    e.target?.releasePointerCapture?.(e.pointerId)
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = group.current
    if (!g) return

    // inersia: kecepatan meluruh, bukan berhenti mendadak
    g.rotation.x += vel.current.x
    g.rotation.y += vel.current.y
    vel.current.x *= 0.92
    vel.current.y *= 0.92

    if (!drag.current.active) {
      g.rotation.y += dt * autoSpin * 0.25
    }

    // batasi sumbu X supaya objek tidak pernah terbalik
    g.rotation.x = THREE.MathUtils.clamp(g.rotation.x, -0.75, 0.75)

    // parallax halus mengikuti pointer
    const px = state.pointer.x * parallax
    const py = state.pointer.y * parallax
    g.position.x = THREE.MathUtils.damp(g.position.x, px, 3, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, py * 0.6, 3, dt)
  })

  return (
    <group
      ref={group}
      scale={scale}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerOver={() => (gl.domElement.style.cursor = 'grab')}
      onPointerOut={() => (gl.domElement.style.cursor = '')}
    >
      {children}
    </group>
  )
}
