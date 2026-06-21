import type { LineSegment } from '@/types';
import { lineColors, lineWidths, lineDashArrays } from './lineStyles';

interface LineRendererProps {
  lines: LineSegment[];
  selectedIds: string[];
  errorIds: string[];
  onLineClick?: (id: string, e: React.MouseEvent) => void;
  onLineHover?: (id: string | null) => void;
  highlightIds?: string[];
}

export function LineRenderer({
  lines,
  selectedIds,
  errorIds,
  onLineClick,
  onLineHover,
  highlightIds = [],
}: LineRendererProps) {
  return (
    <g className="lines-layer">
      {lines.map((line) => {
        if (!line.visible) return null;

        const isSelected = selectedIds.includes(line.id);
        const hasError = errorIds.includes(line.id);
        const isHighlighted = highlightIds.includes(line.id);
        const color = hasError ? '#E74C3C' : lineColors[line.type];
        const strokeWidth = lineWidths[line.type] * (isSelected ? 1.5 : 1);

        return (
          <g key={line.id} className="line-group">
            <line
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
              stroke="transparent"
              strokeWidth={12}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onLineClick?.(line.id, e);
              }}
              onMouseEnter={() => onLineHover?.(line.id)}
              onMouseLeave={() => onLineHover?.(null)}
            />
            
            <line
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={lineDashArrays[line.type]}
              strokeLinecap="round"
              style={{
                opacity: highlightIds.length > 0 && !isHighlighted ? 0.3 : 1,
                transition: 'opacity 0.2s, stroke-width 0.15s',
              }}
            />
            
            {isSelected && (
              <>
                <circle
                  cx={line.start.x}
                  cy={line.start.y}
                  r="5"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                />
                <circle
                  cx={line.end.x}
                  cy={line.end.y}
                  r="5"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                />
              </>
            )}
            
            {line.type === 'axis' && (
              <AxisArrow line={line} color={color} />
            )}
            
            {line.type === 'cut' && (
              <CutMarker line={line} color={color} />
            )}
          </g>
        );
      })}
    </g>
  );
}

function AxisArrow({ line, color }: { line: LineSegment; color: string }) {
  const { start, end } = line;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const arrowSize = 8;

  const arrow1 = {
    x: end.x - arrowSize * Math.cos(angle - Math.PI / 6),
    y: end.y - arrowSize * Math.sin(angle - Math.PI / 6),
  };
  const arrow2 = {
    x: end.x - arrowSize * Math.cos(angle + Math.PI / 6),
    y: end.y - arrowSize * Math.sin(angle + Math.PI / 6),
  };

  const arrow3 = {
    x: start.x + arrowSize * Math.cos(angle - Math.PI / 6),
    y: start.y + arrowSize * Math.sin(angle - Math.PI / 6),
  };
  const arrow4 = {
    x: start.x + arrowSize * Math.cos(angle + Math.PI / 6),
    y: start.y + arrowSize * Math.sin(angle + Math.PI / 6),
  };

  return (
    <g>
      <polygon
        points={`${end.x},${end.y} ${arrow1.x},${arrow1.y} ${arrow2.x},${arrow2.y}`}
        fill={color}
      />
      <polygon
        points={`${start.x},${start.y} ${arrow3.x},${arrow3.y} ${arrow4.x},${arrow4.y}`}
        fill={color}
      />
    </g>
  );
}

function CutMarker({ line, color }: { line: LineSegment; color: string }) {
  const { start, end } = line;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const size = 6;

  const perpAngle = angle + Math.PI / 2;

  return (
    <g>
      <line
        x1={midX - size * Math.cos(perpAngle)}
        y1={midY - size * Math.sin(perpAngle)}
        x2={midX + size * Math.cos(perpAngle)}
        y2={midY + size * Math.sin(perpAngle)}
        stroke={color}
        strokeWidth="1.5"
      />
    </g>
  );
}
