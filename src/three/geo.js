import * as THREE from 'three'

/**
 * Palet cyberpunk "teredam" — sengaja bukan neon pink/hijau menyala.
 * Basisnya biru-abu dingin, aksen teal desaturasi + indigo + pasir hangat.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0e131a',
  slate: '#1b232e',
  steel: '#3d4b5c',
  teal: '#4fb3a5',
  indigo: '#5b6ee1',
  violet: '#8b6cc8',
  sand: '#c9a227',
  mist: '#9fb2c6'
}

/** Rounded box — dipakai untuk bodi perangkat & kartu ledger. */
export function roundedBoxGeometry(width, height, depth, radius = 0.15) {
  const w = width / 2 - radius
  const h = height / 2 - radius
  const shape = new THREE.Shape()
  shape.moveTo(-w, -h - radius)
  shape.lineTo(w, -h - radius)
  shape.quadraticCurveTo(w + radius, -h - radius, w + radius, -h)
  shape.lineTo(w + radius, h)
  shape.quadraticCurveTo(w + radius, h + radius, w, h + radius)
  shape.lineTo(-w, h + radius)
  shape.quadraticCurveTo(-w - radius, h + radius, -w - radius, h)
  shape.lineTo(-w - radius, -h)
  shape.quadraticCurveTo(-w - radius, -h - radius, -w, -h - radius)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - 0.04, 0.01),
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 6
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Titik-titik terdistribusi merata di permukaan bola (Fibonacci sphere). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(1 - y * y, 0))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    )
  }
  return points
}

/** Pasangan indeks node yang jaraknya di bawah ambang — untuk menggambar rusuk jaringan. */
export function nearestPairs(points, maxDistance) {
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < maxDistance) pairs.push([i, j])
    }
  }
  return pairs
}
