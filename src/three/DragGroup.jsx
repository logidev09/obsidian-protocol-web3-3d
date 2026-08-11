import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { damp } from './geo'

/**
 * Group yang bisa diputar dengan drag mouse, punya inersia, auto-spin lembut,
 * dan parallax mengikuti pointer.
 *
 * Catatan scroll: di perangkat sentuh, drag hanya diambil alih setelah gerakan
 * jelas horizontal. Gestur vertikal selalu diteruskan ke halaman, jadi scroll
 * tetap nyaman dan tidak pernah "tersangkut" di dalam canvas.
 */
export default function DragGroup({
  children,
  autoSpin = 0.15,
  sensitivity = 0.006,
  parallax = 0.12,
  clampX = 0.85,
  damping = 0.94
}) {
  const group = useRef()
  const { gl } = useThree()

  const state = useRef({
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    axisLocked: false,
    velX: 0,
    velY: 0,
    rotX: 0,
    rotY: 0,
    parX: 0,
    parY: 0
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const down = (e) => {
      if (e.pointerType === 'touch') {
        s.axisLocked = false
      } else {
        s.dragging = true
        s.axisLocked = true
        el.setPointerCapture?.(e.pointerId)
        el.style.cursor = 'grabbing'
      }
      s.pointerId = e.pointerId
      s.startX = s.lastX = e.clientX
      s.startY = s.lastY = e.clientY
    }

    const move = (e) => {
      if (s.pointerId !== e.pointerId) return

      if (!s.axisLocked && e.pointerType === 'touch') {
        const dx = Math.abs(e.clientX - s.startX)
        const dy = Math.abs(e.clientY - s.startY)
        if (dx < 8 && dy < 8) return
        // Gerakan dominan vertikal = niat scroll. Lepaskan ke halaman.
        if (dy >= dx) {
          s.pointerId = null
          return
        }
        s.axisLocked = true
        s.dragging = true
      }

      if (!s.dragging) return

      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY

      s.velY = dx * sensitivity
      s.velX = dy * sensitivity
      s.rotY += s.velY
      s.rotX = Math.max(-clampX, Math.min(clampX, s.rotX + s.velX))

      if (e.pointerType === 'touch') e.preventDefault()
    }

    const up = (e) => {
      if (s.pointerId !== e.pointerId) return
      s.dragging = false
      s.axisLocked = false
      s.pointerId = null
      el.releasePointerCapture?.(e.pointerId)
      el.style.cursor = ''
    }

    el.style.touchAction = 'pan-y'
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move, { passive: false })
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
  }, [gl, sensitivity, clampX])

  useFrame(({ pointer }, dt) => {
    const s = state.current
    const g = group.current
    if (!g) return

    const step = Math.min(dt, 0.05)

    if (!s.dragging) {
      s.velY *= damping
      s.velX *= damping
      s.rotY += s.velY + autoSpin * step
      s.rotX = Math.max(-clampX, Math.min(clampX, s.rotX + s.velX))
    }

    s.parX = damp(s.parX, -pointer.y * parallax, 4, step)
    s.parY = damp(s.parY, pointer.x * parallax, 4, step)

    g.rotation.y = s.rotY + s.parY
    g.rotation.x = s.rotX + s.parX
  })

  return <group ref={group}>{children}</group>
}
