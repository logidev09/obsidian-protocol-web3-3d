import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * Drag-to-rotate + follow-pointer, dengan inersia & damping.
 * Dipakai di semua scene supaya interaksi mouse terasa sama.
 */
export function useDragRotate(domElement, { sensitivity = 0.0055, damping = 0.92 } = {}) {
  const state = useRef({
    dragging: false,
    vx: 0,
    vy: 0,
    rx: 0,
    ry: 0,
    px: 0,
    py: 0,
    pointer: new THREE.Vector2(0, 0)
  })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = domElement
    if (!el) return
    const s = state.current

    const down = (e) => {
      s.dragging = true
      s.px = e.clientX
      s.py = e.clientY
      setDragging(true)
      el.setPointerCapture?.(e.pointerId)
    }
    const move = (e) => {
      const r = el.getBoundingClientRect()
      s.pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1)
      )
      if (!s.dragging) return
      const dx = e.clientX - s.px
      const dy = e.clientY - s.py
      s.px = e.clientX
      s.py = e.clientY
      s.vy += dx * sensitivity
      s.vx += dy * sensitivity
    }
    const up = (e) => {
      s.dragging = false
      setDragging(false)
      el.releasePointerCapture?.(e.pointerId)
    }
    const leave = () => {
      s.pointer.set(0, 0)
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', leave)
    }
  }, [domElement, sensitivity])

  /** panggil tiap frame; mengembalikan rotasi terakumulasi */
  const step = () => {
    const s = state.current
    s.rx += s.vx
    s.ry += s.vy
    s.vx *= damping
    s.vy *= damping
    // batasi tilt vertikal supaya objek tidak terbalik
    s.rx = THREE.MathUtils.clamp(s.rx, -0.85, 0.85)
    return s
  }

  return { state, step, dragging }
}

/** Render hanya saat canvas terlihat — hemat GPU & bikin scroll tetap mulus. */
export function useInView(margin = '160px') {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin: margin, threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin])
  return [ref, inView]
}
