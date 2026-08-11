import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerfProfile } from './geo'

const perf = getPerfProfile()

/**
 * Kontrol orbit ringan buatan sendiri (bukan OrbitControls).
 *
 * Alasannya satu: kenyamanan scroll. OrbitControls menangkap event wheel dan
 * gesture sentuh, sehingga roda mouse men-zoom kamera alih-alih men-scroll
 * halaman. Di sini wheel sengaja tidak disentuh sama sekali, dan di layar
 * sentuh drag vertikal dibiarkan lewat ke halaman — hanya drag horizontal
 * yang memutar objek. Jadi pengunjung tidak pernah "terjebak" di dalam canvas.
 *
 * - Drag  : putar objek (inersia + peredaman)
 * - Hover : parallax halus mengikuti pointer
 * - Idle  : kembali berputar pelan sendiri setelah dilepas
 */
export default function DragGroup({
  children,
  autoSpin = 0.3,
  parallax = 1,
  scale = 1,
  lockVertical = false
}) {
  const group = useRef()
  const { gl } = useThree()

  const state = useRef({
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rotX: 0,
    rotY: 0,
    idle: 0,
    targetX: 0,
    targetY: 0
  })

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const onDown = (e) => {
      if (perf.reduced) return
      s.dragging = true
      s.pointerId = e.pointerId
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.idle = 0
      el.style.cursor = 'grabbing'
    }

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      s.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.targetY = ((e.clientY - rect.top) / rect.height) * 2 - 1

      if (!s.dragging || e.pointerId !== s.pointerId) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velY += dx * 0.005
      if (!lockVertical) s.velX += dy * 0.004
    }

    const onUp = () => {
      s.dragging = false
      s.pointerId = null
      el.style.cursor = 'grab'
    }

    el.style.cursor = 'grab'
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
  }, [gl, lockVertical])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = state.current
    if (!group.current) return

    if (!s.dragging) {
      s.idle += dt
      s.velY += autoSpin * 0.0016 * Math.min(s.idle, 2)
    }

    s.velX *= 0.9
    s.velY *= 0.9
    s.rotX = THREE.MathUtils.clamp(s.rotX + s.velX, -0.6, 0.6)
    s.rotY += s.velY

    const px = perf.reduced ? 0 : s.targetX * 0.16 * parallax
    const py = perf.reduced ? 0 : -s.targetY * 0.12 * parallax

    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, s.rotX + py, 6, dt)
    group.current.rotation.y = s.rotY + px * 0.5
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, px * 0.6, 4, dt)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, py * 0.5, 4, dt)
  })

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  )
}
