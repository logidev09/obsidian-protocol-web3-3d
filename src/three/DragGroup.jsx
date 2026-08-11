import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerfProfile } from './geo'

/**
 * Pembungkus objek 3D yang bisa diputar dengan drag mouse / sentuh.
 *
 * Aturan kenyamanan scroll:
 * - drag hanya aktif setelah pointer turun DI ATAS objek (bukan di area kosong)
 * - di layar sentuh, hanya gerakan horizontal yang menahan gestur;
 *   gerakan vertikal dilepas supaya halaman tetap bisa di-scroll
 * - saat dilepas, rotasi meluncur (inertia) lalu kembali berputar pelan
 */
export default function DragGroup({
  children,
  autoSpin = 0.2,
  parallax = 0.5,
  maxPitch = 0.5,
  ...props
}) {
  const group = useRef()
  const state = useRef({
    dragging: false,
    axisLocked: null,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    velX: 0,
    velY: 0,
    pitch: 0
  })
  const { gl } = useThree()
  const reduced = useRef(getPerfProfile().reduced)

  useEffect(() => {
    const s = state.current

    const onMove = (e) => {
      if (!s.dragging) return
      const x = e.clientX
      const y = e.clientY

      if (s.axisLocked === null) {
        const dx = Math.abs(x - s.startX)
        const dy = Math.abs(y - s.startY)
        if (dx + dy > 6) s.axisLocked = dx > dy ? 'x' : 'y'
      }

      // Gestur vertikal di layar sentuh = niat scroll, bukan memutar.
      if (e.pointerType === 'touch' && s.axisLocked === 'y') {
        s.dragging = false
        gl.domElement.style.cursor = 'grab'
        return
      }

      if (e.pointerType === 'touch') e.preventDefault?.()

      s.velX = (x - s.lastX) * 0.005
      s.velY = (y - s.lastY) * 0.004
      s.lastX = x
      s.lastY = y
    }

    const onUp = () => {
      if (!s.dragging) return
      s.dragging = false
      s.axisLocked = null
      gl.domElement.style.cursor = 'grab'
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  const begin = (e) => {
    const s = state.current
    s.dragging = true
    s.axisLocked = null
    s.lastX = s.startX = e.clientX
    s.lastY = s.startY = e.clientY
    gl.domElement.style.cursor = 'grabbing'
  }

  useFrame((frame, delta) => {
    const g = group.current
    if (!g) return
    const s = state.current
    const dt = Math.min(delta, 0.05)

    if (s.dragging) {
      g.rotation.y += s.velX
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velY, -maxPitch, maxPitch)
      s.velX *= 0.72
      s.velY *= 0.72
    } else {
      g.rotation.y += s.velX + (reduced.current ? 0 : autoSpin * dt)
      s.velX *= 0.94
      s.velY *= 0.94
      s.pitch = THREE.MathUtils.damp(s.pitch, 0, 1.4, dt)
    }

    // Parallax halus mengikuti pointer, ditumpuk di atas pitch dari drag.
    const target = s.pitch + frame.pointer.y * 0.12 * parallax
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, target, 6, dt)
    g.position.x = THREE.MathUtils.damp(g.position.x, frame.pointer.x * 0.22 * parallax, 4, dt)
  })

  return (
    <group
      ref={group}
      onPointerDown={(e) => {
        e.stopPropagation()
        begin(e)
      }}
      onPointerOver={() => {
        gl.domElement.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!state.current.dragging) gl.domElement.style.cursor = 'auto'
      }}
      {...props}
    >
      {children}
    </group>
  )
}
