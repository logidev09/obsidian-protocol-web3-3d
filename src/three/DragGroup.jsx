import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Pembungkus interaksi mouse untuk objek 3D.
 *
 * - Drag kiri  : memutar objek (dengan inersia, bukan snap kasar).
 * - Pointer move: parallax halus mengikuti kursor.
 * - Auto-spin  : berputar pelan saat idle, berhenti saat disentuh.
 *
 * Penting: listener drag dipasang di elemen canvas, BUKAN window, dan
 * scroll halaman tidak pernah dikunci — jadi scroll tetap nyaman di mobile.
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
    idle: 0,
    pointerX: 0,
    pointerY: 0
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const onDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return
      s.dragging = true
      s.idle = 0
      s.lastX = e.clientX
      s.lastY = e.clientY
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
      s.velY += dx * 0.006
      s.velX += dy * 0.004
    }

    const onUp = () => {
      s.dragging = false
      el.style.cursor = 'grab'
    }

    // Touch: satu jari = putar objek, tapi kita TIDAK preventDefault
    // supaya gestur scroll vertikal tetap milik halaman.
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return
      s.lastX = e.touches[0].clientX
      s.lastY = e.touches[0].clientY
    }

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      const dx = t.clientX - s.lastX
      const dy = t.clientY - s.lastY
      // hanya ambil alih kalau gerakan dominan horizontal
      if (Math.abs(dx) > Math.abs(dy)) {
        s.velY += dx * 0.005
        s.idle = 0
      }
      s.lastX = t.clientX
      s.lastY = t.clientY
    }

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [gl])

  useFrame((_, delta) => {
    const s = state.current
    const dt = Math.min(delta, 0.05)
    if (!group.current) return

    if (!s.dragging) {
      s.idle += dt
      s.velX *= damping
      s.velY *= damping
      if (autoSpin > 0 && s.idle > 1.2) {
        s.velY += autoSpin * dt * 0.02
      }
    }

    s.rotX = THREE.MathUtils.clamp(s.rotX + s.velX, -0.9, 0.9)
    s.rotY += s.velY

    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      s.rotX + s.pointerY * parallax * 0.18,
      6,
      dt
    )
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      s.rotY + s.pointerX * parallax * 0.25,
      6,
      dt
    )
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      s.pointerX * parallax * 0.22,
      4,
      dt
    )
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      -s.pointerY * parallax * 0.16,
      4,
      dt
    )
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
