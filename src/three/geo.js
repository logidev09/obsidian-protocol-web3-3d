import * as THREE from 'three'

/**
 * Palet — cyberpunk yang tenang.
 * Tidak ada neon murni (#00ffff / #ff00ff). Semua warna diturunkan
 * saturasinya dan didinginkan supaya nyaman dibaca lama.
 */
export const PALETTE = {
  ink: '#0b0f14',
  steel: '#8fa3b0',
  slate: '#b9c6cf',
  teal: '#4fb3a6',
  indigo: '#5b6ea8',
  violet: '#8c7bb5',
  sand: '#c8a675'
}

/** Titik terdistribusi merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    pts.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius
      )
    )
  }
  return pts
}

/** Balok bersudut tumpul — dipakai untuk bodi perangkat. */
export function roundedBoxGeometry(w, h, d, r = 0.2, seg = 4) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  const rr = Math.min(r, w / 2, h / 2)

  shape.moveTo(x + rr, y)
  shape.lineTo(x + w - rr, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + rr)
  shape.lineTo(x + w, y + h - rr)
  shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
  shape.lineTo(x + rr, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - rr)
  shape.lineTo(x, y + rr)
  shape.quadraticCurveTo(x, y, x + rr, y)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: seg,
    curveSegments: 8
  })
  geo.center()
  return geo
}

/** Nilai acak deterministik — layout identik tiap reload. */
export function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}
