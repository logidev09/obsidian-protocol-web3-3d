import * as THREE from 'three'

/**
 * Palet: cyberpunk yang diredam.
 * Tidak ada neon magenta/cyan penuh saturasi — semua warna
 * ditarik ke arah abu kebiruan supaya enak dilihat lama.
 */
export const PALETTE = {
  ink: '#06080b',
  slate: '#2a3440',
  steel: '#5c6b7a',
  mist: '#c3ccd6',
  indigo: '#4a5b8c',
  teal: '#4e8f88',
  amber: '#a8814e'
}

/** PRNG deterministik — hasil 3D identik di setiap reload. */
export function seededRandom(seed = 1) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

/**
 * Kotak dengan sudut membulat, dibangun dari ExtrudeGeometry.
 * Dipakai untuk badan perangkat supaya siluetnya tidak kaku.
 */
export function roundedBoxGeometry(width, height, depth, radius = 0.1) {
  const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001)
  const w = width / 2 - r
  const h = height / 2 - r

  const shape = new THREE.Shape()
  shape.moveTo(-w - r, -h)
  shape.lineTo(-w - r, h)
  shape.quadraticCurveTo(-w - r, h + r, -w, h + r)
  shape.lineTo(w, h + r)
  shape.quadraticCurveTo(w + r, h + r, w + r, h)
  shape.lineTo(w + r, -h)
  shape.quadraticCurveTo(w + r, -h - r, w, -h - r)
  shape.lineTo(-w, -h - r)
  shape.quadraticCurveTo(-w - r, -h - r, -w - r, -h)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.12,
    bevelSize: depth * 0.12,
    bevelSegments: 2,
    curveSegments: 8
  })
  geo.center()
  geo.computeVertexNormals()
  return geo
}

/** Titik-titik acak di permukaan bola — basis node jaringan. */
export function spherePoints(count, radius, seed = 5) {
  const rand = seededRandom(seed)
  const points = []
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * rand() - 1)
    const theta = rand() * Math.PI * 2
    points.push(
      new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
    )
  }
  return points
}

/** Pasangan titik yang cukup dekat — dipakai untuk menggambar garis koneksi. */
export function nearestPairs(points, maxDistance) {
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < maxDistance) pairs.push([i, j])
    }
  }
  return pairs
}
