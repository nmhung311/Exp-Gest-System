import React from 'react';

interface CardGlassProps {
  children: React.ReactNode;
  className?: string;
}

export default function CardGlass({ children, className = "" }: CardGlassProps) {
  return (
    <>
      {/* SVG Filters and Masks */}
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style={{position: 'absolute', overflow: 'hidden'}}>
        <defs>
          {/* Distortion Filter */}
          <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0 0" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Edge Mask with Rounded Corners */}
          <mask id="edge-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="200">
            {/* Outer white rectangle with round corners */}
            <rect width="300" height="200" fill="white" rx="28" ry="28" />
            {/* Inner black cutout with matching round corners and 10px inset */}
            <rect x="10" y="10" width="280" height="180" fill="black" rx="18" ry="18" />
          </mask>
        </defs>
      </svg>
      
      <div
        className={`relative rounded-[28px] cursor-pointer touch-none shadow-[0px_6px_24px_rgba(0,0,0,0.2)] ${className}`}
        style={{
          isolation: 'isolate',
        }}
      >
        {/* Glass tint layer with inner shadow */}
        <div 
          className="absolute inset-0 z-0 rounded-[28px]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            boxShadow: 'inset 0 0 20px -10px rgba(255, 255, 255, 0.7)',
          }}
        />
        
        {/* Frost blur layer with distortion and edge mask */}
        <div 
          className="absolute inset-0 z-[-1] rounded-[28px]"
          style={{
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            filter: 'url(#glass-distortion)',
            WebkitFilter: 'url(#glass-distortion)',
            mask: 'url(#edge-mask)',
            WebkitMask: 'url(#edge-mask)',
            isolation: 'isolate',
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 p-4">
          {children}
        </div>
      </div>
    </>
  );
}
