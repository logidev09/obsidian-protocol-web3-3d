import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Grup yang bisa diputar dengan drag mouse / sentuhan.
 *
 * Catatan kenyamanan scroll: handler pointermove dipasang di window hanya
 * selama drag berlangsung, dan tidak pernah memanggil preventDefault. Di
 * layar sentuh, canvas memakai `touch-action: pan-y` sehingga gestur scroll
 * vertikal tetap milik halaman — rotasi hanya mengikuti gerak horizontal.
 */
export default function DragGroup({
  children,
  autoSpin = 0.15,
  damping = 0.94,
  maxPitch = 0.55,
  recenter = true,
  onGrabChange,
  ...props
}) {
  const group = useRef()
  const last = useRef(null)
  const velocity = useRef({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const { gl } = useThree()

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const step = Math.min(delta, 0.05)

    if (!dragging) {
      g.rotation.y += velocity.current.x + autoSpin * step
      g.rotation.x += velocity.current.y
      velocity.current.x *= damping
      velocity.current.y *= damping
      if (recenter) g.rotation.x += (0 - g.rotation.x) * 0.03
    }

    g.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, g.rotation.x))
  })

  useEffect(() => {
    if (!dragging) return

    const move = (e) => {
      const g = group.current
      if (!g || !last.current) return
      const dx = (e.clientX - last.current.x) / 230
      const dy = (e.clientY - last.current.y) / 280
      g.rotation.y += dx
      g.rotation.x += dy
      velocity.current = { x: dx * 0.55, y: dy * 0.55 }
      last.current = { x: e.clientX, y: e.clientY }
    }

    const end = () => {
      last.current = null
      setDragging(false)
      gl.domElement.style.cursor = 'grab'
      onGrabChange?.(false)
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', end, { passive: true })
    window.addEventListener('pointercancel', end, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging, gl, onGrabChange])

  return (
    <group
      ref={group}
      {...props}
      onPointerDown={(e) => {
        e.stopPropagation()
        last.current = { x: e.clientX, y: e.clientY }
        setDragging(true)
        gl.domElement.style.cursor = 'grabbing'
        onGrabChange?.(true)
      }}
      onPointerOver={() => {
        if (!dragging) gl.domElement.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!dragging) gl.domElement.style.cursor = 'auto'
      }}
    >
      {children}
    </group>
  )
}
