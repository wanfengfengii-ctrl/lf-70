import type { Paper } from '@/types';

interface GridHelperProps {
  paper: Paper;
  gridSize: number;
  visible: boolean;
}

export function GridHelper({ paper, gridSize, visible }: GridHelperProps) {
  if (!visible) return null;

  const { origin, width, height } = paper;

  const lines = [];
  const numCols = Math.ceil(width / gridSize);
  const numRows = Math.ceil(height / gridSize);

  for (let i = 0; i <= numCols; i++) {
    const x = origin.x + i * gridSize;
    lines.push(
      <line
        key={`v-${i}`}
        x1={x}
        y1={origin.y}
        x2={x}
        y2={origin.y + height}
        stroke="#D4C9B8"
        strokeWidth="0.5"
        opacity="0.5"
      />
    );
  }

  for (let i = 0; i <= numRows; i++) {
    const y = origin.y + i * gridSize;
    lines.push(
      <line
        key={`h-${i}`}
        x1={origin.x}
        y1={y}
        x2={origin.x + width}
        y2={y}
        stroke="#D4C9B8"
        strokeWidth="0.5"
        opacity="0.5"
      />
    );
  }

  return <g className="grid-helper">{lines}</g>;
}
