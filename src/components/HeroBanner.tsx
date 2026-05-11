import React from 'react'
import '../styles/hero.css'

interface HeroBannerProps {
  title: string
  subtitle: string
}

export function HeroBanner({ title, subtitle }: HeroBannerProps) {
  return (
    <div className="hero-banner">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  )
}
