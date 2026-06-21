import React from 'react';

interface CircularProgressProps {
  value: number; // Percentage (0-100)
  size?: number; // Size in pixels
  strokeWidth?: number; // Thickness of the stroke
  color?: string; // Color of the progress
  trackColor?: string; // Color of the background track
  segmented?: boolean; // Whether to show segmented gaps
}

export default function CircularProgress({
  value,
  size = 120,
  strokeWidth = 14,
  color = '#A855F7', // Default purple color like the screenshot
  trackColor = '#E5E7EB', // Default gray
  segmented = true,
}: CircularProgressProps) {
  // Batasi nilai antara 0-100
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  // Kalkulasi SVG
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Kalkulasi dasharray untuk efek segmen/putus-putus
  // Jika segmented true, kita buat putus-putus. Jika false, mulus.
  const segmentLength = circumference / 20; // 20 segmen penuh
  const gapLength = 4; // Jarak antar segmen
  
  const strokeDasharray = segmented 
    ? `${segmentLength - gapLength} ${gapLength}`
    : `${circumference}`;
    
  // Kalkulasi strokeDashoffset untuk persentase
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div 
      className="relative flex items-center justify-center font-bold text-[#173F2E]" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap={segmented ? 'butt' : 'round'}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Teks Persentase di Tengah */}
      <span 
        className="absolute" 
        style={{ fontSize: size * 0.28 }}
      >
        {normalizedValue}%
      </span>
    </div>
  );
}
