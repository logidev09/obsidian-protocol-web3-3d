import { useEffect, useRef, useState } from 'react'

/**
 * Drag-to-rotate + pointer parallax yang aman untuk halaman scroll.
 * - Drag horizontal/vertikal memutar objek, tapi TIDAK mengunci scroll:
 *   listener pointer dipasang di canvas dengan touch-action pan-y,
 *   jadi swipe vertikal di mobile tetap men-scroll halaman.
 * - Inersia halus + auto-settle saat pointer dilepas.
 */
export function useDragRotate(domElement, { sensitivity = 0.006, damping = 0.92 } = {}) {
  const state = useRef({ rx: 0, ry: 0, vx: 0, vy: 0, pointer: { x: 0, y: 0 } })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!domElement) return
    const el = domElement
    el.style.touchAction = 'pan-y'

    let active = false
    let lastX = 0
    let lastY = 0
    let id = null

    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      active = true
      id = e.pointerId
      lastX = e.clientX
      lastY = e.clientY
      setDragging(true)
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }

    const move = (e) => {
      const r = el.getBoundingClientRect()
      state.current.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
      state.current.pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1
      if (!active || e.pointerId !== id) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      state.current.vx += dx * sensitivity
      state.current.vy += dy * sensitivity * 0.6
    }

    const up = (e) => {
      if (e && id !== null && e.pointerId !== id) return
      active = false
      id = null
      setDragging(false)
      el.style.cursor = 'grab'
    }

    const leave = () => {
      state.current.pointer.x = 0
      state.current.pointer.y = 0
      up()
    }

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', leave)

    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', leave)
    }
  }, [domElement, sensitivity])

  // dipanggil tiap frame dari useFrame
  const step = () => {
    const s = state.current
    s.ry += s.vx
    s.rx += s.vy
    s.rx = Math.max(-0.9, Math.min(0.9, s.rx))
    s.vx *= damping
    s.vy *= damping
    return s
  }

  return { state, step, dragging }
}
