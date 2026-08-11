import * as THREE from 'three'

/**
 * Palet OBSIDIAN.
 * Cyberpunk tapi teredam: dasar hitam kebiruan, aksen teal dan tembaga
 * dengan saturasi rendah. Tidak ada magenta/hijau neon.
 */
export const PALETTE = {
  void: '#06080b',
  carbon: '#0d1116',
  slate: '#1b2530',
  steel: '#5d6f80',
  fog: '#9fb0c0',
  teal: '#4fb3a6',
  indigo: '#5c6f9c',
  copper: '#c2825a',
  bone: '#e8edf2'
}

/** Deteksi kemampuan perangkat sekali saja, dipakai semua scene. */
let cachedProfile = null

export function getPerfProfile() {
  if (cachedProfile) return cachedProfile

  const nav = typeof navigator !== 'undefined' ? navigator : {}
  const cores = nav.hardwareConcurrency || 4
  const mem = nav.deviceMemory || 4
  const narrow = typeof window !== 'undefined' && window.innerWidth < 900
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

  const low = cores <= 4 || mem <= 4 || narrow

  cachedProfile = {
    low,
    narrow,
    reducedMotion,
    dpr: low ? [1, 1.4] : [1, 2]
  }
  return cachedProfile
}

/** Sebaran titik merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}

/** Pasangan titik yang berdekatan, untuk menggambar rusuk jaringan. */
export function nearestPairs(points, maxDistanceRatio = 0.3) {
  const pairs = []
  const radius = points[0]?.length() || 1
  const threshold = radius * maxDistanceRatio * 2

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < threshold) pairs.push([i, j])
    }
  }
  return pairs
}

/**
 * Pecah geometri jadi kepingan terpisah, tiap keping punya arah ledak sendiri.
 * Dipakai untuk kristal hero yang bisa "dibuka" saat di-klik.
 */
export function explodeShards(geometry, count) {
  const position = geometry.getAttribute('position')
  const shards = []
  const triangles = position.count / 3
  const perShard = Math.max(1, Math.floor(triangles / count))

  for (let s = 0; s < count; s++) {
    const start = s * perShard
    const end = s === count - 1 ? triangles : (s + 1) * perShard
    const verts = []
    const centroid = new THREE.Vector3()

    for (let t = start; t < end; t++) {
      for (let v = 0; v < 3; v++) {
        const idx = t * 3 + v
        verts.push(position.getX(idx), position.getY(idx), position.getZ(idx))
        centroid.x += position.getX(idx)
        centroid.y += position.getY(idx)
        centroid.z += position.getZ(idx)
      }
    }

    if (!verts.length) continue
    centroid.divideScalar(verts.length / 3)

    const g = new THREE.BufferGeometry()
    const local = new Float32Array(verts.length)
    for (let i = 0; i < verts.length; i += 3) {
      local[i] = verts[i] - centroid.x
      local[i + 1] = verts[i + 1] - centroid.y
      local[i + 2] = verts[i + 2] - centroid.z
    }
    g.setAttribute('position', new THREE.BufferAttribute(local, 3))
    g.computeVertexNormals()

    shards.push({ geometry: g, origin: centroid.clone(), direction: centroid.clone().normalize() })
  }

  return shards
}
