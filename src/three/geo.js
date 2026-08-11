import * as THREE from 'three'

/**
 * Palet "muted cyberpunk" — gelap, low-saturation, tanpa neon norak.
 * Semua aksen dipilih di rentang saturasi 35–60% supaya nyaman dilihat lama.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0b1016',
  steel: '#16202b',
  slate: '#7d8b9c',
  teal: '#4fa8a0',
  indigo: '#5b6ea8',
  violet: '#7a6bb0',
  sand: '#c2a878'
}

/** Titik terdistribusi merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1 || 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    )
  }
  return points
}

/** Box dengan sudut membulat — dipakai untuk badan perangkat vault. */
export function roundedBoxGeometry(w, h, d, radius = 0.15, segments = 4) {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  const r = Math.min(radius, w / 2, h / 2)

  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: Math.min(0.05, d / 4),
    bevelSize: Math.min(0.05, r / 3),
    bevelSegments: segments,
    curveSegments: 12
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Konversi derajat ke radian, dipakai supaya angka rotasi lebih terbaca. */
export const deg = (d) => (d * Math.PI) / 180
