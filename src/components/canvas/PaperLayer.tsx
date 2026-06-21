import type { Paper } from '@/types';

interface PaperLayerProps {
  paper: Paper;
}

export function PaperLayer({ paper }: PaperLayerProps) {
  const { origin, width, height } = paper;

  return (
    <g className="paper-layer">
      <defs>
        <filter id="paper-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="4" dy="4" stdDeviation="6" floodOpacity="0.15" />
        </filter>
        <pattern id="paper-texture" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="#F5F0E6" />
          <circle cx="20" cy="30" r="0.5" fill="#E8E0D0" opacity="0.5" />
          <circle cx="60" cy="70" r="0.5" fill="#E8E0D0" opacity="0.5" />
          <circle cx="80" cy="20" r="0.3" fill="#E8E0D0" opacity="0.4" />
        </pattern>
      </defs>
      
      <rect
        x={origin.x}
        y={origin.y}
        width={width}
        height={height}
        fill="url(#paper-texture)"
        stroke="#D4C9B8"
        strokeWidth="1"
        filter="url(#paper-shadow)"
      />
    </g>
  );
}
