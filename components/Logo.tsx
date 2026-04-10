// components/Logo.tsx
import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* 1. The "Ghost" Drop Zone (Where the card was picked up from) */}
      <rect 
        x="18" y="24" 
        width="56" height="56" 
        rx="14" 
        fill="transparent" 
        stroke="#CBD5E1" /* Tailwind slate-300 */
        strokeWidth="4" 
        strokeDasharray="6 6" 
      />

      {/* 2. The Dragging Card (Shifted up/right, tilted, and hovering) */}
      <g transform="translate(12, -8) rotate(8, 50, 50)">
        {/* Card Background with Drop Shadow */}
        <rect 
          x="18" y="24" 
          width="56" height="56" 
          rx="14" 
          fill="#2563EB" /* Tailwind blue-600 */
          filter="drop-shadow(2px 8px 6px rgba(37, 99, 235, 0.4))"
        />
        
        {/* The 'S' */}
        <text 
          x="46" y="61" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="900" 
          fontSize="42" 
          fill="white" 
          textAnchor="middle"
        >
          S
        </text>
      </g>
    </svg>
  );
}