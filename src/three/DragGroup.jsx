import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { clamp, damp } from './geo'

/**
 * Wrapper interaksi mouse untuk objek 3D.
 * - drag  : putar objek (pointer capture, jadi tidak lepas saat keluar canvas)
 * - hover : parallax halus mengikuti posisi pointer
 * - idle  : auto-spin pelan yang kembali aktif setelah drag berhenti
 *
 * Penting untuk kenyamanan scroll: pointer event hanya "menangkap" saat
 * tombol mouse ditekan, sentuhan vertikal tetap diteruskan ke halaman
 * (lihat `touch-action: pan-y` pada canvas di styles).
 */
export default function DragGroup({
  children,
  autoSpin = 0.15,
  parallax = 0.15,
  clampX = 0.75,
  ...props
}) {
  const group = useRef()
  const drag = useRef({ active: false, x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const rotation = useRef({ x: 0, y: 0 })
  const [grabbing, setGrabbing] = useState(false)
  const { pointer } = useThree()

  const onDown = (e) => {
    e.stopPropagation()
    e.target.setPointerCapture?.(e.pointerId)
    drag.current = { active: true, x: e.clientX, y: e.clientY }
    setGrabbing(true)
    document.body.style.cursor = 'grabbing'
  }

  const onMove = (e) => {
    if (!drag.current.active) return
    e.stopPropagation()
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current.x = e.clientX
    drag.current.y = e.clientY
    velocity.current.y = dx * 0.005
    velocity.current.x = dy * 0.004
    rotation.current.y += velocity.current.y
    rotation.current.x = clamp(rotation.current.x + velocity.current.x, -clampX, clampX)
  }

  const onUp = (e) => {
    if (!drag.current.active) return
    e.target.releasePointerCapture?.(e.pointerId)
    drag.current.active = false
    setGrabbing(false)
    document.body.style.cursor = ''
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)

    if (!drag.current.active) {
      // inersia setelah dilepas, lalu kembali ke auto-spin
      velocity.current.y = damp(velocity.current.y, autoSpin * dt, 2.5, dt)
      velocity.current.x = damp(velocity.current.x, 0, 4, dt)
      rotation.current.y += velocity.current.y
      rotation.current.x = clamp(rotation.current.x + velocity.current.x, -clampX, clampX)
      rotation.current.x = damp(rotation.current.x, pointer.y * parallax, 2, dt)
    }

    group.current.rotation.y = damp(group.current.rotation.y, rotation.current.y, 10, dt)
    group.current.rotation.x = damp(group.current.rotation.x, rotation.current.x, 10, dt)

    const targetX = pointer.x * parallax * 0.6
    const targetY = pointer.y * parallax * 0.35
    group.current.position.x = damp(group.current.position.x, targetX, 3, dt)
    group.current.position.y = damp(group.current.position.y, targetY, 3, dt)
  })

  return (
    <group
      ref={group}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerOver={() => !grabbing && (document.body.style.cursor = 'grab')}
      onPointerOut={() => !drag.current.active && (document.body.style.cursor = '')}
      {...props}
    >
      {children}
    </group>
  )
}
