import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Group yang bisa diputar dengan drag mouse, punya inersia, dan pelan-pelan
 * kembali berputar sendiri saat dilepas.
 *
 * Catatan scroll: canvas memakai `touch-action: pan-y`, jadi di layar sentuh
 * geser vertikal tetap men-scroll halaman — hanya geser horizontal yang memutar.
 */
export default function DragGroup({
  children,
  autoSpin = 0.15,
  damping = 0.925,
  sensitivity = 0.006,
  clampX = 0.85,
  parallax = 0,
  ...props
}) {
  const group = useRef()
  const vel = useRef({ x: 0, y: 0 })
  const rot = useRef({ x: 0, y: 0 })
  const dragging = useRef(null)
  const { gl, pointer } = useThree()

  useEffect(() => {
    const el = gl.domElement
    el.style.cursor = 'grab'

    const onDown = (e) => {
      dragging.current = { x: e.clientX, y: e.clientY }
      el.style.cursor = 'grabbing'
    }

    const onMove = (e) => {
      const d = dragging.current
      if (!d) return
      vel.current.y += (e.clientX - d.x) * sensitivity
      vel.current.x += (e.clientY - d.y) * sensitivity
      dragging.current = { x: e.clientX, y: e.clientY }
    }

    const onUp = () => {
      if (!dragging.current) return
      dragging.current = null
      el.style.cursor = 'grab'
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl, sensitivity])

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    const dt = Math.min(delta, 0.05)
    if (!dragging.current) vel.current.y += autoSpin * dt

    rot.current.y += vel.current.y
    rot.current.x += vel.current.x
    rot.current.x = Math.max(-clampX, Math.min(clampX, rot.current.x))

    vel.current.y *= damping
    vel.current.x *= damping

    const px = parallax ? pointer.x * parallax : 0
    const py = parallax ? -pointer.y * parallax : 0

    g.rotation.y += (rot.current.y + px - g.rotation.y) * 0.12
    g.rotation.x += (rot.current.x + py - g.rotation.x) * 0.12
  })

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
