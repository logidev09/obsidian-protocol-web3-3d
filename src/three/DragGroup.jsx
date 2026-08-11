import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerfProfile } from './geo'

const perf = getPerfProfile()

/**
 * Grup yang bisa diputar dengan drag mouse/touch, dengan inersia dan auto-spin.
 *
 * Kunci kenyamanan scroll: drag horizontal memutar objek, tetapi gerakan
 * vertikal TIDAK pernah menahan halaman — pointer capture hanya aktif setelah
 * gerakan horizontal melampaui ambang kecil, dan sumbu Y dibatasi ketat.
 * Di layar sentuh, `touch-action: pan-y` pada canvas menjaga scroll tetap milik
 * browser.
 */
export default function DragGroup({
  children,
  autoSpin = 0.4,
  parallax = 0.7,
  maxTiltX = 0.5,
  scale = 1,
  ...props
}) {
  const group = useRef()
  const state = useRef({
    dragging: false,
    armed: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rotX: 0,
    rotY: 0
  })
  const { size } = useThree()

  const onPointerDown = (e) => {
    const s = state.current
    s.dragging = true
    s.armed = false
    s.lastX = e.clientX
    s.lastY = e.clientY
  }

  const endDrag = (e) => {
    const s = state.current
    if (s.armed && e?.target?.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId)
      } catch {
        /* pointer sudah lepas */
      }
    }
    s.dragging = false
    s.armed = false
  }

  const onPointerMove = (e) => {
    const s = state.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    const dy = e.clientY - s.lastY

    // Baru "kunci" pointer kalau niatnya jelas memutar (horizontal dominan).
    if (!s.armed) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        // Gerakan vertikal → biarkan halaman yang men-scroll.
        s.dragging = false
        return
      }
      s.armed = true
      try {
        e.target.setPointerCapture?.(e.pointerId)
      } catch {
        /* diabaikan */
      }
    }

    s.velY += (dx / size.width) * 6
    s.velX += (dy / size.height) * 2.2
    s.lastX = e.clientX
    s.lastY = e.clientY
  }

  useFrame(({ pointer }, delta) => {
    const g = group.current
    if (!g) return
    const s = state.current
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) s.rotY += autoSpin * dt * (perf.reduced ? 0.3 : 1)

    s.rotY += s.velY * dt * 3
    s.rotX += s.velX * dt * 3
    s.rotX = THREE.MathUtils.clamp(s.rotX, -maxTiltX, maxTiltX)

    const damping = Math.pow(0.02, dt)
    s.velY *= damping
    s.velX *= damping

    // Parallax halus mengikuti kursor, tanpa mengganggu rotasi drag.
    const px = pointer.x * 0.18 * parallax
    const py = -pointer.y * 0.12 * parallax

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.rotY + px, 8, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.rotX + py, 8, dt)
  })

  return (
    <group
      ref={group}
      scale={scale}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      {...props}
    >
      {children}
    </group>
  )
}
