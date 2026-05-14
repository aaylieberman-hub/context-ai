import React from 'react'
import '../styles/hero.css'

interface HeroBannerProps {
  title: string
  subtitle: string
  italicWord?: string
  variant?: 'warm' | 'dark' | 'teal' | 'sage' | 'blue' | 'rose' | 'navy'
}

export function HeroBanner({ title, subtitle, italicWord, variant = 'warm' }: HeroBannerProps) {
  return (
    <div className={`hero-banner hero-banner-${variant}`}>
      <h2>
        {title}
        {italicWord && (
          <>
            {' '}<em>{italicWord}</em>
          </>
        )}
      </h2>
      <p>{subtitle}</p>
    </div>
  )
}
