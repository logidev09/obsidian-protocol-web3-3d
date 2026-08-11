import * as THREE from 'three'

/** Palet: cyberpunk gelap tapi kalem — tanpa neon pink/hijau stabilo. */
export const PALETTE = {
  ink: '#06080b',
  slate: '#11161f',
  steel: '#48566b',
  indigo: '#4a5ad9',
  teal: '#35b0a7',
  sand: '#c2a06a',
  violet: '#7d6fd1'
}

/** Box dengan sudut membulat, dibangun dari shape + extrude (tanpa dependensi tambahan). */
export function roundedBoxGeometry(w, h, d, r, curveSegments = 5) {
  const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001)
  const x = -w / 2
  const y = -h / 2
  const shape = new THREE.Shape()

  shape.moveTo(x, y + radius)
  shape.lineTo(x, y + h - radius)
  shape.quadraticCurveTo(x, y + h, x + radius, y + h)
  shape.lineTo(x + w - radius, y + h)
  shape.quadraticCurveTo(x + w, y + h, x + w, y + h - radius)
  shape.lineTo(x + w, y + radius)
  shape.quadraticCurveTo(x + w, y, x + w - radius, y)
  shape.lineTo(x + radius, y)
  shape.quadraticCurveTo(x, y, x, y + radius)

  const bevel = Math.min(0.05, d / 3)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, d - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments
  })

  geo.translate(0, 0, -d / 2 + bevel)
  geo.computeVertexNormals()
  return geo
}

/** PRNG deterministik supaya layout node selalu sama di setiap reload. */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Sebaran titik pada permukaan bola (Fibonacci) dengan sedikit jitter. */
export function seededNodes(count, radius, seed = 1) {
  const rand = mulberry32(seed)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const out = []

  for (let i = 0; i < count; i++) {
    const yy = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - yy * yy))
    const theta = golden * i
    const jitter = 0.88 + rand() * 0.24
    out.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius * jitter,
        yy * radius * jitter,
        Math.sin(theta) * r * radius * jitter
      )
    )
  }
  return out
}

/** Hubungkan tiap titik ke tetangga terdekatnya — dipakai untuk lineSegments. */
export function nearestSegments(points, maxDist = 1.1, maxLinks = 3) {
  const segs = []
  const seen = new Set()

  for (let i = 0; i < points.length; i++) {
    const near = []
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue
      const d = points[i].distanceTo(points[j])
      if (d < maxDist) near.push({ j, d })
    }
    near.sort((a, b) => a.d - b.d)

    for (let k = 0; k < Math.min(maxLinks, near.length); k++) {
      const j = near[k].j
      const key = i < j ? `${i}:${j}` : `${j}:${i}`
      if (seen.has(key)) continue
      seen.add(key)
      segs.push(points[i], points[j])
    }
  }
  return segs
}

/** Interpolasi frame-rate independent — dipakai untuk semua easing di scene. */
export function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}
