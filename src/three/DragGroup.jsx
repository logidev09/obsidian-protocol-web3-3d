import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { clamp } from './geo'

/**
 * Grup yang bisa diputar dengan drag mouse + punya inersia,
 * parallax halus mengikuti posisi pointer, dan auto-spin saat idle.
 *
 * Catatan UX: drag SENGAJA dinonaktifkan untuk pointer sentuh,
 * supaya gestur swipe di HP tetap men-scroll halaman, bukan memutar objek.
 */
export default function DragGroup({
  children,
  autoSpin = 0.4,
  parallax = 0.6,
  scale = 1,
  position = [0, 0, 0]
}) {
  const ref = useRef()
  const { gl } = useThree()
  const s = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rotX: 0,
    rotY: 0
  })

  useEffect(() => {
    const el = gl.domElement
    const st = s.current

    const onDown = (e) => {
      if (e.pointerType === 'touch') return
      st.dragging = true
      st.lastX = e.clientX
      st.lastY = e.clientY
      el.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!st.dragging) return
      st.velY += (e.clientX - st.lastX) * 0.0045
      st.velX += (e.clientY - st.lastY) * 0.0035
      st.lastX = e.clientX
      st.lastY = e.clientY
    }
    const onUp = () => {
      if (!st.dragging) return
      st.dragging = false
      el.style.cursor = 'grab'
    }

    el.style.cursor = 'grab'
    el.style.touchAction = 'pan-y'
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const st = s.current

    st.rotY += st.velY + (st.dragging ? 0 : autoSpin * dt * 0.12)
    st.rotX = clamp(st.rotX + st.velX, -0.65, 0.65)
    st.velX *= 0.9
    st.velY *= 0.9

    const px = state.pointer.x * parallax * 0.14
    const py = state.pointer.y * parallax * 0.1

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, st.rotY + px, 6, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, st.rotX - py, 6, dt)
  })

  return (
    <group ref={ref} scale={scale} position={position}>
      {children}
    </group>
  )
}
