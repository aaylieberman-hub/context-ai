import React from 'react'

/**
 * context.ai brand mark — three concentric arcs ("layers of context")
 * Use anywhere you'd put a logo. Default size 26.
 */
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B2A6F" />
          <stop offset="1" stopColor="#1A1814" />
        </linearGradient>
      </defs>
      <path d="M5 16a11 11 0 0 1 22 0" stroke="url(#bm-g)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9 19a7 7 0 0 1 14 0" stroke="#5B2A6F" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <path d="M13 22a3 3 0 0 1 6 0" stroke="#5B2A6F" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
      <circle cx="16" cy="24.5" r="1.6" fill="#5B2A6F" />
    </svg>
  )
}
