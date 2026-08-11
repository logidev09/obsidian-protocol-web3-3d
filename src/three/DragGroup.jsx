import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { lerp } from './geo'

/**
 * Grup yang bisa diputar dengan drag mouse / jari, lengkap dengan inersia.
 * Drag vertikal dibatasi agar halaman tetap nyaman di-scroll di layar sentuh
 * (canvas memakai touch-action: pan-y, jadi swipe atas-bawah tetap men-scroll).
 */
export default function DragGroup({
  children,
  autoSpin = 0.15,
  tiltLimit = 0.6,
  sensitivity = 0.005
}) {
  const group = useRef()
  const drag = useRef({ active: false, x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const tilt = useRef(0)
  const { gl } = useThree()

  const setCursor = (value) => {
    gl.domElement.style.cursor = value
  }

  const onPointerDown = (e) => {
    e.stopPropagation()
    drag.current = { active: true, x: e.clientX, y: e.clientY }
    velocity.current = { x: 0, y: 0 }
    setCursor('grabbing')
    e.target.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current.x = e.clientX
    drag.current.y = e.clientY
    velocity.current.x = dx * sensitivity
    velocity.current.y = dy * sensitivity * 0.6
  }

  const release = (e) => {
    if (!drag.current.active) return
    drag.current.active = false
    setCursor('grab')
    e?.target?.releasePointerCapture?.(e.pointerId)
  }

  useFrame((state, delta) => {
    if (!group.current) return
    const step = Math.min(delta, 0.05)

    if (drag.current.active) {
      group.current.rotation.y += velocity.current.x
      tilt.current += velocity.current.y
    } else {
      velocity.current.x *= 0.94
      velocity.current.y *= 0.94
      group.current.rotation.y += velocity.current.x + autoSpin * step
      tilt.current += velocity.current.y
      tilt.current = lerp(tilt.current, 0, step * 1.2)
    }

    tilt.current = Math.max(-tiltLimit, Math.min(tiltLimit, tilt.current))
    group.current.rotation.x = tilt.current
  })

  return (
    <group
      ref={group}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerOver={() => !drag.current.active && setCursor('grab')}
      onPointerOut={() => !drag.current.active && setCursor('auto')}
    >
      {children}
    </group>
  )
}
