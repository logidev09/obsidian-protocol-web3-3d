import * as THREE from 'three'

/**
 * Palet — cyberpunk yang ditahan.
 * Basis grafit/ink, aksen teal & indigo yang diredam (bukan neon jenuh),
 * satu aksen tembaga hangat sebagai pemecah. Tidak ada magenta/hijau stabilo.
 */
export const PALETTE = {
  ink: '#06080b',
  carbon: '#0c1015',
  slate: '#1b222c',
  steel: '#3d4854',
  mist: '#c8d2dc',
  teal: '#3f9c92',
  indigo: '#5b6ab0',
  copper: '#b5804d'
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Profil performa sederhana. Perangkat lemah dapat DPR & jumlah objek
 * lebih kecil supaya scroll tetap 60fps.
 */
export function getPerfProfile() {
  if (typeof window === 'undefined') return { dpr: [1, 1.5], low: false }
  const cores = navigator.hardwareConcurrency || 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 820
  const low = cores <= 4 || (coarse && narrow)
  return {
    low,
    dpr: low ? [1, 1.25] : [1, Math.min(window.devicePixelRatio || 1, 1.85)]
  }
}

/** PRNG deterministik (mulberry32) supaya layout acak konsisten tiap render. */
export function seededRandom(seed = 1) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
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
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}

/** Pasangan node terdekat, dipakai untuk menggambar rusuk jaringan. */
export function nearestPairs(points, maxDistance) {
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < maxDistance) pairs.push([i, j])
    }
  }
  return pairs
}
