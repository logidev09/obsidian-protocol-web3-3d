import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Grup yang bisa diputar dengan drag mouse, punya inersia, dan kembali
 * berputar pelan sendiri saat dilepas.
 *
 * Kunci kenyamanan scroll: pointer bertipe 'touch' SENGAJA diabaikan.
 * Di HP/tablet sapuan jari tetap men-scroll halaman - canvas tidak pernah
 * merebut gestur vertikal. Perangkat sentuh tetap dapat auto-spin.
 */
export default function DragGroup({
  children,
  autoSpin = 0.25,
  parallax = 0.5,
  maxPitch = 0.55,
  damping = 0.92
}) {
  const pivot = useRef()
  const state = useRef({ dragging: false, lastX: 0, lastY: 0, velX: 0, velY: 0, yaw: 0, pitch: 0 })
  const { gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const s = state.current

    const onDown = (e) => {
      if (e.pointerType === 'touch') return
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      el.style.cursor = 'grabbing'
    }

    const onMove = (e) => {
      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velX = dx * 0.005
      s.velY = dy * 0.004
      s.yaw += s.velX
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velY, -maxPitch, maxPitch)
    }

    const onUp = () => {
      if (!s.dragging) return
      s.dragging = false
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
      el.style.cursor = ''
    }
  }, [gl, maxPitch])

  useFrame((frame, delta) => {
    const s = state.current
    const g = pivot.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) {
      s.velX *= damping
      s.velY *= damping
      s.yaw += s.velX + autoSpin * dt
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velY, -maxPitch, maxPitch)
      s.pitch = THREE.MathUtils.damp(s.pitch, 0, 0.8, dt)
    }

    g.rotation.y = s.yaw + frame.pointer.x * parallax * 0.25
    g.rotation.x = s.pitch - frame.pointer.y * parallax * 0.18
  })

  return <group ref={pivot}>{children}</group>
}
