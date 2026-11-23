import { useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export { gsap, ScrollTrigger, useGSAP }

/**
 * Animasi masuk untuk elemen bertanda `data-reveal` di dalam scope.
 * Kalau pengguna memilih reduced motion, elemen tampil tanpa animasi.
 */
export function useReveal(dependencies = []) {
  const scope = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray('[data-reveal]')
        if (!items.length) return
        gsap.from(items, {
          y: 14,
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
          stagger: 0.06,
          clearProps: 'transform,opacity',
        })
      })
      return () => mm.revert()
    },
    { scope, dependencies },
  )

  return scope
}
