import { useEffect, useRef } from 'react'

/**
 * Drag-to-rotate + pointer tracking, dibaca lewat `step()` di dalam useFrame.
 * Sengaja tidak memakai state React supaya tidak ada re-render per frame
 * — ini yang menjaga scroll tetap halus saat 3D berputar.
 *
 * Penting: drag hanya aktif saat pointer menekan canvas, jadi scroll roda mouse
 * dan swipe vertikal di mobile tetap milik halaman, bukan milik scene.
 */
export function useDragRotate(domElement, { sensitivity = 0.005, damping = 0.92 } = {}) {
  const state = useRef({
    ry: 0,
    rx: 0,
    vy: 0,
    vx: 0,
    dragging: false,
    last: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 }
  })

  useEffect(() => {
    const el = domElement
    if (!el) return
    const s = state.current

    const onPointerDown = (e) => {
      // hanya tombol kiri / sentuh utama
      if (e.button !== undefined && e.button !== 0) return
      s.dragging = true
      s.last.x = e.clientX
      s.last.y = e.clientY
      el.style.cursor = 'grabbing'
    }

    const onPointerMove = (e) => {
      const rect = el.getBoundingClientRect()
      s.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1

      if (!s.dragging) return
      const dx = e.clientX - s.last.x
      const dy = e.clientY - s.last.y
      s.last.x = e.clientX
      s.last.y = e.clientY
      s.vy = dx * sensitivity
      s.vx = dy * sensitivity * 0.6
    }

    const onPointerUp = () => {
      s.dragging = false
      el.style.cursor = 'grab'
    }

    const onLeave = () => {
      s.dragging = false
      s.pointer.x = 0
      s.pointer.y = 0
    }

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [domElement, sensitivity])

  /** Panggil sekali per frame. Mengembalikan rotasi terakumulasi + posisi pointer. */
  const step = () => {
    const s = state.current
    s.ry += s.vy
    s.rx += s.vx
    // batasi kemiringan supaya objek tidak terbalik
    s.rx = Math.max(-0.9, Math.min(0.9, s.rx))
    if (!s.dragging) {
      s.vy *= damping
      s.vx *= damping
      if (Math.abs(s.vy) < 1e-5) s.vy = 0
      if (Math.abs(s.vx) < 1e-5) s.vx = 0
    }
    return s
  }

  return { step, state }
}
