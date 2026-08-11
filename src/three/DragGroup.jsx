import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Pembungkus interaksi mouse untuk objek 3D.
 *
 * - Drag pointer  → memutar objek (dengan inersia saat dilepas).
 * - Pointer bebas → parallax halus mengikuti kursor.
 * - Auto-spin     → objek tetap hidup saat tidak disentuh.
 *
 * Penting untuk kenyamanan scroll: listener dipasang di elemen canvas
 * dengan `touch-action: pan-y`, sehingga pada layar sentuh gestur
 * scroll vertikal TIDAK direbut oleh rotasi objek.
 */
export default function DragGroup({
  children,
  autoSpin = 0.4,
  parallax = 0.6,
  scale = 1,
  position = [0, 0, 0]
}) {
  const group = useRef()
  const { gl } = useThree()

  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rotX: 0,
    rotY: 0,
    pointerX: 0,
    pointerY: 0,
    idle: 0
  })

  const onDown = useCallback(
    (e) => {
      const s = state.current
      s.dragging = true
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.idle = 0
      gl.domElement.style.cursor = 'grabbing'
    },
    [gl]
  )

  const onUp = useCallback(() => {
    state.current.dragging = false
    gl.domElement.style.cursor = 'grab'
  }, [gl])

  const onMove = useCallback(
    (e) => {
      const s = state.current
      const rect = gl.domElement.getBoundingClientRect()
      s.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      s.pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1

      if (!s.dragging) return
      const dx = e.clientX - s.lastX
      const dy = e.clientY - s.lastY
      s.lastX = e.clientX
      s.lastY = e.clientY
      s.velY = dx * 0.005
      s.velX = dy * 0.004
      s.rotY += s.velY
      s.rotX = THREE.MathUtils.clamp(s.rotX + s.velX, -0.85, 0.85)
      s.idle = 0
    },
    [gl]
  )

  useEffect(() => {
    const el = gl.domElement
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
  }, [gl, onDown, onMove, onUp])

  useFrame((_, delta) => {
    const s = state.current
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)

    if (!s.dragging) {
      // inersia meluruh
      s.velY *= 0.94
      s.velX *= 0.94
      s.rotY += s.velY
      s.rotX = THREE.MathUtils.clamp(s.rotX + s.velX, -0.85, 0.85)

      s.idle += dt
      if (s.idle > 0.6) {
        s.rotY += dt * autoSpin * 0.25
        // kembali perlahan ke sumbu horizontal
        s.rotX = THREE.MathUtils.damp(s.rotX, 0, 1.1, dt)
      }
    }

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, s.rotY, 12, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.rotX, 12, dt)

    // parallax posisi (tidak aktif saat drag agar tidak bertabrakan rasa)
    const px = s.dragging ? 0 : s.pointerX * 0.18 * parallax
    const py = s.dragging ? 0 : -s.pointerY * 0.12 * parallax
    g.position.x = THREE.MathUtils.damp(g.position.x, position[0] + px, 4, dt)
    g.position.y = THREE.MathUtils.damp(g.position.y, position[1] + py, 4, dt)
  })

  return (
    <group ref={group} position={position} scale={scale}>
      {children}
    </group>
  )
}
