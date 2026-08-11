import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { damp, clamp } from './geo'

/**
 * Pembungkus interaksi mouse untuk objek 3D.
 *
 * Kunci kenyamanan scroll: pointer events dipasang di elemen canvas dengan
 * `touch-action: pan-y`, dan hanya drag horizontal/vertikal setelah ambang batas
 * yang menahan halaman. Wheel TIDAK pernah di-capture, jadi scroll halaman
 * selalu lolos ke Lenis — tidak ada "scroll jacking".
 */
export default function DragGroup({
  children,
  autoSpin = 0.1,
  parallax = 0.2,
  clampX = 0.65,
  scale = 1
}) {
  const group = useRef()
  const gl = useThree((s) => s.gl)

  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rotY: 0,
    rotX: 0,
    pointerX: 0,
    pointerY: 0,
    hasPointer: false
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const down = (e) => {
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }

    const move = (e) => {
      const rect = el.getBoundingClientRect()
      s.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1
      s.hasPointer = true
      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velX += dx * 0.005
      s.velY += dy * 0.004
    }

    const up = (e) => {
      s.dragging = false
      el.releasePointerCapture?.(e.pointerId)
      el.style.cursor = 'grab'
    }

    const leave = () => {
      s.hasPointer = false
      s.dragging = false
    }

    el.style.cursor = 'grab'
    el.style.touchAction = 'pan-y'
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', leave)

    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', leave)
    }
  }, [gl])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = state.current

    s.rotY += s.velX
    s.rotX = clamp(s.rotX + s.velY, -clampX, clampX)

    // inersia: lepas drag → objek melambat halus, bukan berhenti mendadak
    s.velX *= s.dragging ? 0.6 : 0.92
    s.velY *= s.dragging ? 0.6 : 0.9

    if (!s.dragging) s.rotY += autoSpin * dt

    const targetX = s.hasPointer ? s.pointerX * parallax : 0
    const targetY = s.hasPointer ? -s.pointerY * parallax * 0.6 : 0

    group.current.rotation.y = s.rotY
    group.current.rotation.x = s.rotX + targetY * 0.35
    group.current.position.x = damp(group.current.position.x, targetX, 3, dt)
    group.current.position.y = damp(group.current.position.y, targetY * 0.5, 3, dt)
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
