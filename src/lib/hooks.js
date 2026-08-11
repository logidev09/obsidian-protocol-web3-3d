import { useEffect, useRef, useState } from 'react'

/** Smooth scroll — inertia lembut, tidak melawan trackpad. */
export function useSmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let lenis
    let raf
    let cancelled = false

    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return
      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.6,
        syncTouch: false
      })
      const loop = (time) => {
        lenis.raf(time)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    })

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      if (lenis) lenis.destroy()
    }
  }, [])
}

/** Progres scroll 0..1 untuk bar di atas. */
export function useScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        setP(max > 0 ? Math.min(1, window.scrollY / max) : 0)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return p
}

/** true setelah halaman di-scroll melewati threshold. */
export function useScrolled(threshold = 24) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const onScroll = () => setOn(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return on
}

/** Reveal saat elemen masuk viewport. */
export function useReveal(options = {}) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px', ...options }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, options])

  return [ref, seen]
}

/** Hanya render canvas saat section-nya dekat viewport — hemat GPU, scroll tetap enteng. */
export function useInViewport(margin = '260px') {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [margin])

  return [ref, inView]
}
