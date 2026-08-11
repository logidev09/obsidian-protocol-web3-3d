import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { prefersReducedMotion } from './geo'

/**
 * Pembungkus interaksi mouse untuk objek 3D.
 *
 * - Drag (mouse / sentuh) memutar objek, dengan inersia saat dilepas.
 * - Tanpa drag, objek ikut condong ke arah pointer (parallax halus).
 * - Auto-spin pelan supaya objek tidak terasa mati.
 *
 * Penting untuk kenyamanan scroll: pointer sentuh TIDAK dikunci,
 * jadi swipe vertikal di HP tetap menggulung halaman.
 */
export default function DragGroup({
  children,
  autoSpin = 0.3,
  parallax = 1,
  scale = 1,
  damping = 0.92
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
    pointerX: 0,
    pointerY: 0
  })

  const reduced = useRef(prefersReducedMotion())

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const onDown = (e) => {
      // Hanya kunci drag untuk mouse/pen. Sentuh dibiarkan agar scroll tetap jalan.
      if (e.pointerType === 'touch') return
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      s.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1

      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velY += dx * 0.005
      s.velX += dy * 0.004
    }

    const onUp = (e) => {
      if (!s.dragging) return
      s.dragging = false
      el.releasePointerCapture?.(e.pointerId)
      el.style.cursor = 'grab'
    }

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useFrame((_, delta) => {
    const s = state.current
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) {
      s.velY += autoSpin * 0.0016 * (reduced.current ? 0.3 : 1)
      s.velX *= damping
      s.velY *= damping
    }

    s.rotY += s.velY
    s.rotX = THREE.MathUtils.clamp(s.rotX + s.velX, -0.75, 0.75)

    const tiltX = reduced.current ? 0 : s.pointerY * 0.18 * parallax
    const tiltY = reduced.current ? 0 : s.pointerX * 0.22 * parallax

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.rotY + tiltY, 8, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.rotX + tiltX, 8, dt)
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
