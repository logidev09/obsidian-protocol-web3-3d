import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerfProfile } from './geo'

/**
 * Wadah objek yang bisa diputar dengan drag mouse, plus parallax halus
 * mengikuti pointer, dan inersia saat dilepas.
 *
 * Kenyamanan scroll:
 * - Pointer bertipe "touch" sengaja diabaikan. Di ponsel jari dipakai untuk
 *   menggulir halaman, jadi kanvas tidak pernah merebut gesture scroll.
 * - Tidak ada listener wheel sama sekali; scroll roda mouse selalu diteruskan.
 */
export default function DragGroup({
  children,
  autoSpin = 0.2,
  parallax = 1,
  maxPitch = 0.5,
  hitRadius = 3.2
}) {
  const group = useRef()
  const gl = useThree((s) => s.gl)

  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    yaw: 0,
    pitch: 0,
    velYaw: 0,
    velPitch: 0
  })

  const { reducedMotion } = getPerfProfile()
  const spin = reducedMotion ? 0 : autoSpin

  const setCursor = (v) => {
    gl.domElement.style.cursor = v
  }

  const onDown = (e) => {
    if (e.pointerType === 'touch') return
    e.stopPropagation()
    e.target.setPointerCapture?.(e.pointerId)
    const s = state.current
    s.dragging = true
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.velYaw = 0
    s.velPitch = 0
    setCursor('grabbing')
  }

  const onMove = (e) => {
    const s = state.current
    if (!s.dragging) return
    e.stopPropagation()
    const dx = (e.clientX - s.lastX) / 220
    const dy = (e.clientY - s.lastY) / 220
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.yaw += dx
    s.pitch = THREE.MathUtils.clamp(s.pitch + dy, -maxPitch, maxPitch)
    s.velYaw = dx
    s.velPitch = dy
  }

  const onUp = (e) => {
    const s = state.current
    if (!s.dragging) return
    s.dragging = false
    e.target.releasePointerCapture?.(e.pointerId)
    setCursor('grab')
  }

  useFrame((frame, delta) => {
    const g = group.current
    if (!g) return
    const s = state.current
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) {
      s.yaw += s.velYaw
      s.pitch = THREE.MathUtils.clamp(s.pitch + s.velPitch, -maxPitch, maxPitch)
      s.velYaw *= 0.92
      s.velPitch *= 0.92
      s.yaw += spin * dt
      s.pitch = THREE.MathUtils.damp(s.pitch, 0, 1.2, dt)
    }

    const px = frame.pointer.x * 0.16 * parallax
    const py = frame.pointer.y * 0.12 * parallax

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.yaw + px, 9, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.pitch - py, 9, dt)
  })

  return (
    <group ref={group}>
      <mesh
        visible={false}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerOver={() => !state.current.dragging && setCursor('grab')}
        onPointerOut={() => !state.current.dragging && setCursor('auto')}
      >
        <sphereGeometry args={[hitRadius, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {children}
    </group>
  )
}
