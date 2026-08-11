import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { prefersReducedMotion } from './geo'

/**
 * Grup yang bisa diputar dengan drag mouse, punya inersia, auto-spin halus,
 * dan parallax ringan mengikuti pointer.
 *
 * Catatan penting untuk kenyamanan scroll: drag HANYA diaktifkan untuk
 * mouse/pen. Di layar sentuh, gesture dibiarkan ke browser supaya halaman
 * tetap bisa di-scroll dengan jari di atas canvas.
 */
export default function DragGroup({
  children,
  autoSpin = 0.25,
  parallax = 1,
  maxPitch = 0.55,
  ...props
}) {
  const group = useRef()
  const drag = useRef({ active: false, lastX: 0, lastY: 0, vx: 0, vy: 0, yaw: 0, pitch: 0 })
  const { gl } = useThree()
  const reduced = prefersReducedMotion()

  useEffect(() => {
    const el = gl.domElement
    const s = drag.current

    const onDown = (e) => {
      if (e.pointerType === 'touch') return
      s.active = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.classList.add('is-grabbing')
    }
    const onMove = (e) => {
      if (!s.active) return
      s.vx += (e.clientX - s.lastX) * 0.0045
      s.vy += (e.clientY - s.lastY) * 0.0035
      s.lastX = e.clientX
      s.lastY = e.clientY
    }
    const onUp = () => {
      s.active = false
      el.classList.remove('is-grabbing')
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.classList.remove('is-grabbing')
    }
  }, [gl])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const s = drag.current
    const dt = Math.min(delta, 0.05)

    s.yaw += s.vx
    s.pitch += s.vy
    s.pitch = THREE.MathUtils.clamp(s.pitch, -maxPitch, maxPitch)

    // inersia
    const damp = s.active ? 0.75 : 0.94
    s.vx *= damp
    s.vy *= damp

    if (!s.active && !reduced) s.yaw += autoSpin * dt * 0.35

    const px = state.pointer.x * 0.12 * parallax
    const py = state.pointer.y * 0.08 * parallax

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.yaw + px, 8, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.pitch - py, 8, dt)
  })

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
