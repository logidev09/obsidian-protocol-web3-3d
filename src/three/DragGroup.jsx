import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Group yang bisa diputar dengan drag mouse / sentuh, dengan inersia + auto-spin.
 * Sumbu vertikal dibatasi supaya objek tidak pernah terbalik.
 */
export default function DragGroup({
  children,
  autoSpin = 0.14,
  sensitivity = 0.0052,
  damping = 0.93,
  maxTilt = 0.62,
  ...props
}) {
  const group = useRef()
  const s = useRef({ down: false, px: 0, py: 0, vx: 0, vy: 0, rx: 0, ry: 0, idle: 0 })
  const { gl } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const st = s.current

    const down = (e) => {
      st.down = true
      st.px = e.clientX
      st.py = e.clientY
      st.idle = 0
      el.style.cursor = 'grabbing'
    }

    const move = (e) => {
      if (!st.down) return
      const dx = e.clientX - st.px
      const dy = e.clientY - st.py
      st.px = e.clientX
      st.py = e.clientY
      st.vx += dx * sensitivity
      st.vy += dy * sensitivity * 0.72
    }

    const up = () => {
      if (!st.down) return
      st.down = false
      el.style.cursor = 'grab'
    }

    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)

    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl, sensitivity])

  useFrame((state, dt) => {
    const st = s.current
    const d = Math.min(dt, 0.05)

    st.ry += st.vx
    st.rx += st.vy
    st.rx = Math.max(-maxTilt, Math.min(maxTilt, st.rx))

    if (!st.down) {
      st.vx *= damping
      st.vy *= damping
      st.idle += d
      // auto-spin kembali pelan setelah user berhenti menarik
      if (st.idle > 0.7) st.ry += autoSpin * d
      // tilt perlahan kembali netral
      st.rx += (0 - st.rx) * 0.012
    } else {
      st.vx *= 0.72
      st.vy *= 0.72
    }

    if (group.current) {
      group.current.rotation.y = st.ry
      group.current.rotation.x = st.rx
    }
  })

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
