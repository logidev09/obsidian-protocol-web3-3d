import * as THREE from 'three'

/**
 * Palet "muted cyberpunk".
 * Sengaja bukan neon jenuh. Basisnya abu kebiruan dingin, dengan tiga aksen
 * berintensitas rendah: teal desaturasi, indigo pudar, dan tembaga hangat.
 */
export const PALETTE = {
  ink: '#06080b',
  carbon: '#0d1117',
  slate: '#1b2430',
  steel: '#56718c',
  mist: '#c8d3de',
  teal: '#3ba88f',
  indigo: '#5566a8',
  copper: '#c08457'
}

/** Sebaran titik merata di permukaan bola (spiral Fibonacci). */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}

/** Pasangan indeks titik yang jaraknya di bawah ambang - dipakai untuk rusuk lattice. */
export function nearestPairs(points, threshold) {
  const pairs = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < threshold) pairs.push([i, j])
    }
  }
  return pairs
}

/**
 * Profil performa sederhana. Menurunkan jumlah polygon di perangkat lemah
 * atau saat user meminta reduced motion, supaya scroll tetap mulus.
 */
export function getPerfProfile() {
  if (typeof window === 'undefined') return { low: false, reducedMotion: false, dpr: [1, 1.6] }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cores = navigator.hardwareConcurrency || 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const low = reducedMotion || cores <= 4 || (coarse && window.innerWidth < 900)
  return { low, reducedMotion, dpr: low ? [1, 1.25] : [1, 1.75] }
}
