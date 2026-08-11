import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Pembungkus yang membuat isinya bisa diputar dengan drag mouse/sentuh,
 * ikut parallax pointer saat diam, dan berputar pelan dengan sendirinya.
 *
 * Penting untuk kenyamanan scroll: pointer capture hanya diambil saat
 * benar-benar men-drag, dan `touch-action` dibiarkan default sehingga
 * gerakan scroll vertikal di mobile tidak ikut tertahan.
 */
export default function DragGroup({
  children,
  autoSpin = 0.6,
  parallax = 0.2,
  scale = 1,
  damping = 5
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
    rotY: 0
  })

  const onDown = (e) => {
    const s = state.current
    s.dragging = true
    s.lastX = e.clientX
    s.lastY = e.clientY
    e.target.setPointerCapture?.(e.pointerId)
    gl.domElement.style.cursor = 'grabbing'
  }

  const onUp = (e) => {
    const s = state.current
    s.dragging = false
    e.target.releasePointerCapture?.(e.pointerId)
    gl.domElement.style.cursor = 'grab'
  }

  const onMove = (e) => {
    const s = state.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.velY += dx * 0.005
    s.velX += dy * 0.004
  }

  useFrame((st, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = state.current
    const g = group.current
    if (!g) return

    // inersia
    s.rotY += s.velY
    s.rotX += s.velX
    s.velY *= 0.92
    s.velX *= 0.92

    // batasi kemiringan vertikal agar objek tidak terbalik
    s.rotX = THREE.MathUtils.clamp(s.rotX, -0.6, 0.6)

    if (!s.dragging) {
      s.rotY += autoSpin * 0.06 * dt
      s.rotX = THREE.MathUtils.damp(s.rotX, 0, 1.2, dt)
    }

    const px = st.pointer.x * parallax
    const py = st.pointer.y * parallax

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.rotY + px * 0.5, damping, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.rotX - py * 0.4, damping, dt)
    g.position.x = THREE.MathUtils.damp(g.position.x, px * 0.6, damping, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, py * 0.4, damping, dt)
  })

  return (
    <group
      ref={group}
      scale={scale}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerMove={onMove}
      onPointerOver={() => (gl.domElement.style.cursor = 'grab')}
      onPointerOut={() => (gl.domElement.style.cursor = 'auto')}
    >
      {children}
    </group>
  )
}
