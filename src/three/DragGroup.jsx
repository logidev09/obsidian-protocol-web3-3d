import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Grup yang bisa diputar dengan drag mouse / sentuh.
 *
 * - Drag horizontal  → yaw, drag vertikal → pitch (dibatasi supaya tidak terbalik)
 * - Lepas drag       → inersia meredam, lalu kembali berputar pelan sendiri
 * - Tanpa drag       → objek memiringkan diri mengikuti posisi pointer (parallax)
 *
 * Penting untuk kenyamanan scroll: listener dipasang di canvas dengan
 * touch-action “pan-y”, jadi geser vertikal di HP tetap men-scroll halaman.
 */
export default function DragGroup({
  children,
  autoSpin = 0.6,
  parallax = 0.3,
  damping = 0.94,
  scale = 1
}) {
  const group = useRef()
  const { gl } = useThree()

  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    pitch: 0,
    yaw: 0
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const down = (e) => {
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.style.cursor = 'grabbing'
      el.setPointerCapture?.(e.pointerId)
    }

    const move = (e) => {
      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velX = dx * 0.005
      s.velY = dy * 0.004
      s.yaw += s.velX
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velY, -0.6, 0.6)
    }

    const up = (e) => {
      if (!s.dragging) return
      s.dragging = false
      el.style.cursor = 'grab'
      el.releasePointerCapture?.(e.pointerId)
    }

    el.style.cursor = 'grab'
    el.style.touchAction = 'pan-y'
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', up)

    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', up)
    }
  }, [gl])

  useFrame((frame, delta) => {
    const s = state.current
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) {
      s.velX *= damping
      s.velY *= damping
      s.yaw += s.velX + autoSpin * dt * 0.12
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velY, -0.6, 0.6)
      // kembali perlahan ke sumbu tengah
      s.pitch = THREE.MathUtils.damp(s.pitch, 0, 0.8, dt)
    }

    const px = frame.pointer.x * parallax * 0.35
    const py = frame.pointer.y * parallax * 0.25

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.yaw + px, 8, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.pitch - py, 8, dt)
    g.position.y = THREE.MathUtils.damp(
      g.position.y,
      Math.sin(frame.clock.elapsedTime * 0.6) * 0.08,
      4,
      dt
    )
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
