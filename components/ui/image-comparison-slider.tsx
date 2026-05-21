'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

interface ImageComparisonProps {
  beforeImage: string
  afterImage: string
  altBefore?: string
  altAfter?: string
}

export const ImageComparison = ({
  beforeImage,
  afterImage,
  altBefore = 'Before',
  altAfter = 'After',
}: ImageComparisonProps) => {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newPosition = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      setSliderPosition(newPosition)
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto select-none rounded-xl overflow-hidden shadow-2xl"
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseLeave={handleMouseUp}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleMouseUp}
    >
      <div
        className="absolute top-0 left-0 h-full w-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={afterImage} alt={altAfter} className="h-full w-full object-cover object-left" draggable={false} loading="lazy" />
      </div>
      <img src={beforeImage} alt={altBefore} className="block h-full w-full object-cover object-left" draggable={false} loading="lazy" />
      <div
        className="absolute top-0 bottom-0 w-1.5 bg-white/80 cursor-ew-resize flex items-center justify-center"
        style={{ left: `calc(${sliderPosition}% - 0.375rem)` }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className={`bg-white rounded-full h-12 w-12 flex items-center justify-center shadow-md transition-all duration-200 ${isDragging ? 'scale-110 shadow-xl' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 3 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  )
}
