import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Wadah rotasi universal untuk semua scene.
 *
 * - Drag kiri-kanan/atas-bawah memutar objek (mouse + touch).
 * - Tanpa drag, objek berputar pelan sendiri dan mengikuti pointer (parallax).
 * - `touch-action: pan-y` pada canvas dijaga di CSS supaya scroll vertikal
 *   di mobile tetap lancar — drag horizontal untuk memutar, swipe vertikal
 *   tetap menggulirkan halaman.
 */
export default function DragGroup({
  children,
  autoSpin = 0.2,
  parallax = 0.2,
  clampX = 0.85,
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
    rotX: 0,
    rotY: 0,
    idle: 0
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const down = (e) => {
      s.dragging = true
      s.idle = 0
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }

    const move = (e) => {
      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velY += dx * 0.005
      s.velX += dy * 0.004
    }

    const up = (e) => {
      s.dragging = false
      el.releasePointerCapture?.(e.pointerId)
      el.style.cursor = 'grab'
    }

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)

    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl])

  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = state.current

    // inersia
    s.rotY += s.velY
    s.rotX += s.velX
    s.velY *= 0.92
    s.velX *= 0.92
    s.rotX = THREE.MathUtils.clamp(s.rotX, -clampX, clampX)

    if (!s.dragging) {
      s.idle += dt
      // auto-spin baru aktif setelah pointer dilepas sebentar
      if (s.idle > 0.8) s.rotY += autoSpin * dt
      // tarik sumbu X kembali ke netral supaya komposisi tetap rapi
      s.rotX = THREE.MathUtils.damp(s.rotX, 0, 1.2, dt)
    }

    const px = frame.pointer.x * parallax
    const py = frame.pointer.y * parallax

    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      s.rotY + px * 0.6,
      6,
      dt
    )
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      s.rotX - py * 0.5,
      6,
      dt
    )
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      Math.sin(frame.clock.elapsedTime * 0.6) * 0.08,
      3,
      dt
    )
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
