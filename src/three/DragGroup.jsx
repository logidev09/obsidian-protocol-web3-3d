import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { damp } from './geo'

/**
 * Bungkus objek 3D supaya bisa:
 *  - di-drag dengan mouse / sentuh (rotasi bebas, dengan inersia)
 *  - ikut bergerak halus mengikuti posisi pointer (parallax)
 *  - berputar pelan sendiri saat idle
 *
 * Drag di-handle di level window, bukan OrbitControls, supaya scroll halaman
 * tidak pernah terkunci oleh canvas.
 */
export default function DragGroup({
  children,
  autoSpin = 0.1,
  parallax = 0.14,
  clampX = 0.9,
  damping = 0.94
}) {
  const group = useRef()
  const drag = useRef({ active: false, lastX: 0, lastY: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const rotation = useRef({ x: 0, y: 0 })
  const { gl, pointer } = useThree()

  const start = (e) => {
    e.stopPropagation()
    drag.current.active = true
    drag.current.lastX = e.clientX
    drag.current.lastY = e.clientY
    gl.domElement.style.cursor = 'grabbing'

    const move = (ev) => {
      if (!drag.current.active) return
      const dx = ev.clientX - drag.current.lastX
      const dy = ev.clientY - drag.current.lastY
      drag.current.lastX = ev.clientX
      drag.current.lastY = ev.clientY
      velocity.current.y = dx * 0.006
      velocity.current.x = dy * 0.006
      rotation.current.y += velocity.current.y
      rotation.current.x = Math.max(
        -clampX,
        Math.min(clampX, rotation.current.x + velocity.current.x)
      )
    }

    const end = () => {
      drag.current.active = false
      gl.domElement.style.cursor = ''
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = group.current
    if (!g) return

    if (!drag.current.active) {
      velocity.current.x *= damping
      velocity.current.y *= damping
      rotation.current.y += velocity.current.y + autoSpin * dt
      rotation.current.x = Math.max(
        -clampX,
        Math.min(clampX, rotation.current.x + velocity.current.x)
      )
      // kembali perlahan ke sumbu horizontal saat dilepas
      rotation.current.x = damp(rotation.current.x, 0, 1.1, dt)
    }

    g.rotation.y = rotation.current.y + pointer.x * parallax
    g.rotation.x = rotation.current.x + -pointer.y * parallax * 0.6
    g.position.x = damp(g.position.x, pointer.x * 0.22, 3, dt)
    g.position.y = damp(g.position.y, -pointer.y * 0.14, 3, dt)
  })

  return (
    <group ref={group} onPointerDown={start}>
      {children}
    </group>
  )
}
