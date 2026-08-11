import * as THREE from 'three'

/**
 * Palet warna.
 * Sengaja bertumpu pada abu-biru dingin + satu aksen teal redup dan satu
 * copper hangat. Tidak ada neon magenta/hijau stabilo — kontras dibangun
 * lewat gelap-terang, bukan lewat saturasi.
 */
export const PALETTE = {
  void: '#06080b',
  ink: '#0b0f14',
  slate: '#2a333f',
  steel: '#5c6b7d',
  mist: '#9fb0c2',
  teal: '#3f8f8a',
  indigo: '#4a5b8c',
  copper: '#b07d52'
}

/** Profil performa perangkat — menentukan kepadatan geometri & pixel ratio. */
export function getPerfProfile() {
  if (typeof window === 'undefined') {
    return { low: false, dpr: [1, 1.5], reducedMotion: false }
  }

  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4
  const narrow = window.matchMedia('(max-width: 820px)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const low = narrow || cores <= 4 || memory <= 4

  return {
    low,
    reducedMotion,
    dpr: low ? [1, 1.35] : [1, 1.8]
  }
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
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius)
    )
  }
  return points
}

/** Pasangan titik yang berdekatan — dipakai menggambar rusuk jaringan. */
export function nearestPairs(points, threshold = 0.12) {
  const pairs = []
  const limit = threshold * 4 * points[0].length
  const maxDist = points.length ? points[0].length(0) : 0
  const cutoff = threshold * 10

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < cutoff) pairs.push([i, j])
    }
  }
  return pairs
}

/**
 * Geometri low-poly "pecahan kristal": ikosahedron yang tiap verteksnya
 * digeser acak, lalu di-flat-shade supaya facet-nya tegas.
 */
export function shatteredGeometry(radius = 1, detail = 1, jitter = 0.16, seed = 1) {
  const geo = new THREE.IcosahedronGeometry(radius, detail)
  const pos = geo.attributes.position
  const rand = mulberry32(seed)

  const map = new Map()
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)}|${pos.getY(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`
    if (!map.has(key)) map.set(key, 1 + (rand() - 0.5) * jitter * 2)
    const scale = map.get(key)
    pos.setXYZ(i, pos.getX(i) * scale, pos.getY(i) * scale, pos.getZ(i) * scale)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/** PRNG kecil dengan seed — supaya bentuk acak tetap sama tiap reload. */
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
