import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Grup yang bisa diputar dengan drag mouse / sentuhan.
 *
 * Perilaku:
 * - Drag  -> memutar objek, dengan inersia yang meredam setelah dilepas.
 * - Idle  -> kembali berputar pelan (autoSpin).
 * - Mouse -> parallax halus mengikuti posisi kursor saat tidak di-drag.
 *
 * Penting untuk kenyamanan scroll: listener drag dipasang di elemen canvas,
 * bukan window, dan pointer-events canvas dimatikan di CSS kecuali di area
 * objek. Jadi scroll roda mouse tetap milik halaman, bukan milik 3D.
 */
export default function DragGroup({
  children,
  autoSpin = 0.35,
  parallax = 0.6,
  scale = 1,
  lockX = false
}) {
  const group = useRef()
  const { gl } = useThree()

  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    targetX: 0,
    targetY: 0,
    pointerX: 0,
    pointerY: 0
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const down = (e) => {
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.style.cursor = 'grabbing'
      el.setPointerCapture?.(e.pointerId)
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
      s.velX = lockX ? 0 : dy * 0.005
      s.targetY += s.velY
      s.targetX += s.velX
    }

    const up = (e) => {
      s.dragging = false
      el.style.cursor = 'grab'
      el.releasePointerCapture?.(e.pointerId)
    }

    el.style.cursor = 'grab'
    el.style.touchAction = 'pan-y' // scroll vertikal tetap milik halaman
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', up)
    el.addEventListener('pointercancel', up)

    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [gl, lockX])

  useFrame((_, delta) => {
    const g = group.current
    const s = state.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) {
      // inersia meredam
      s.velY *= 0.94
      s.velX *= 0.94
      s.targetY += s.velY
      s.targetX += s.velX
      // putaran idle
      s.targetY += autoSpin * dt * 0.35
      // parallax kursor pada sumbu X
      s.targetX = THREE.MathUtils.damp(s.targetX, s.pointerY * 0.18 * parallax, 2, dt)
    }

    // batasi kemiringan supaya objek tidak pernah terbalik
    s.targetX = THREE.MathUtils.clamp(s.targetX, -0.75, 0.75)

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.targetY, 6, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.targetX, 6, dt)
    g.position.x = THREE.MathUtils.damp(g.position.x, s.pointerX * 0.12 * parallax, 3, dt)
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
