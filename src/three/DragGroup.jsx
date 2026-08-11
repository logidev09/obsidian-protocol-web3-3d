import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Kontrol putar berbasis pointer, ditulis manual (bukan OrbitControls)
 * supaya scroll halaman TIDAK PERNAH direbut oleh canvas:
 * - wheel tidak diikat sama sekali → scroll selalu lolos ke halaman
 * - drag hanya aktif saat pointer ditekan di atas canvas
 * - ada inersia + auto-spin pelan saat idle
 * - parallax halus mengikuti posisi pointer
 * - di layar sentuh, drag vertikal dibiarkan untuk scroll; hanya
 *   gerak horizontal yang memutar objek
 */
export default function DragGroup({
  children,
  autoSpin = 0.6,
  parallax = 0.4,
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
    pointerY: 0,
    idle: 0,
    touch: false
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const down = (e) => {
      s.dragging = true
      s.touch = e.pointerType === 'touch'
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.idle = 0
      if (!s.touch) el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }

    const move = (e) => {
      const rect = el.getBoundingClientRect()
      s.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1

      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velY = dx * 0.005
      // di sentuh, jangan curi gerak vertikal — itu milik scroll
      s.velX = s.touch ? 0 : dy * 0.005
      s.idle = 0
    }

    const up = (e) => {
      s.dragging = false
      el.releasePointerCapture?.(e.pointerId)
      el.style.cursor = 'grab'
    }

    const leave = () => {
      s.dragging = false
      s.pointerX = 0
      s.pointerY = 0
      el.style.cursor = 'grab'
    }

    el.style.cursor = 'grab'
    el.style.touchAction = 'pan-y' // kunci: scroll vertikal tetap milik halaman

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
  }, [gl])

  useFrame((_, delta) => {
    const s = state.current
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) {
      s.velX *= damping
      s.velY *= damping
      s.idle += dt
      // auto-spin baru masuk perlahan setelah pointer diam sebentar
      if (s.idle > 0.6) {
        const ramp = Math.min((s.idle - 0.6) / 1.5, 1)
        s.rotY += dt * 0.12 * autoSpin * ramp
      }
    }

    s.rotX += s.velX
    s.rotY += s.velY
    s.rotX = THREE.MathUtils.clamp(s.rotX, -0.9, 0.9)

    const px = s.pointerX * 0.18 * parallax
    const py = -s.pointerY * 0.14 * parallax

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.rotX + py, 6, dt)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.rotY + px, 6, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, s.pointerY * -0.05, 4, dt)
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
