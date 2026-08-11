import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Smooth scroll yang tetap terasa natural (bukan floaty).
 * Otomatis nonaktif untuk pengguna yang minta reduced motion.
 */
export default function useLenis() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6
    })

    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onAnchor = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute('href')
      if (!id || id === '#') return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -70, duration: 1.2 })
    }
    document.addEventListener('click', onAnchor)

    return () => {
      document.removeEventListener('click', onAnchor)
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])
}
