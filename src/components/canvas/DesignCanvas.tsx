import { useRef, useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { validateLines } from '@/utils/validation';
import { lineColors, lineDashArrays } from './lineStyles';
import { PaperLayer } from './PaperLayer';
import { GridHelper } from './GridHelper';
import { LineRenderer } from './LineRenderer';
import type { ValidationError } from '@/types';

interface DesignCanvasProps {
  validationErrors?: ValidationError[];
  onValidationChange?: (errors: ValidationError[]) => void;
  highlightLineIds?: string[];
}

export function DesignCanvas({
  validationErrors: externalErrors,
  onValidationChange,
  highlightLineIds = [],
}: DesignCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

  const {
    lines,
    paper,
    zoom,
    pan,
    showGrid,
    gridSize,
    currentTool,
    isDrawing,
    drawStart,
    drawEnd,
    selectedLineIds,
    setZoom,
    setPan,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    selectLine,
    deselectAll,
    removeLine,
    axisLine,
  } = useCanvasStore();

  const errorLineIds = externalErrors?.flatMap((e) => e.lineIds) ?? [];

  useEffect(() => {
    const errors = validateLines(lines, paper);
    onValidationChange?.(errors);
  }, [lines, paper, onValidationChange]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    const paperCenterX = paper.origin.x + paper.width / 2;
    const paperCenterY = paper.origin.y + paper.height / 2;
    
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    
    const scaleX = (rect.width - 100) / paper.width;
    const scaleY = (rect.height - 100) / paper.height;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    
    const newPanX = containerCenterX - paperCenterX * newZoom;
    const newPanY = containerCenterY - paperCenterY * newZoom;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;

      return { x, y };
    },
    [zoom, pan]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (e.button !== 0) return;

      const point = getSvgPoint(e.clientX, e.clientY);

      if (currentTool === 'select') {
        deselectAll();
      } else if (currentTool === 'eraser') {
        // eraser handled in line click
      } else {
        startDrawing(point);
      }
    },
    [currentTool, getSvgPoint, startDrawing, deselectAll]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;
        setPan({ x: pan.x + dx, y: pan.y + dy });
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      if (isDrawing) {
        const point = getSvgPoint(e.clientX, e.clientY);
        updateDrawing(point);
      }
    },
    [isPanning, lastPanPoint, pan, setPan, isDrawing, getSvgPoint, updateDrawing]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (isDrawing) {
        const point = getSvgPoint(e.clientX, e.clientY);
        finishDrawing(point);
      }
    },
    [isPanning, isDrawing, getSvgPoint, finishDrawing]
  );

  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDrawing) {
      cancelDrawing();
    }
  }, [isPanning, isDrawing, cancelDrawing]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(3, zoom * delta));
      
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleRatio = newZoom / zoom;
        const newPanX = mouseX - (mouseX - pan.x) * scaleRatio;
        const newPanY = mouseY - (mouseY - pan.y) * scaleRatio;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    },
    [zoom, pan, setZoom, setPan]
  );

  const handleLineClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (currentTool === 'select') {
        selectLine(id, e.shiftKey);
      } else if (currentTool === 'eraser') {
        removeLine(id);
      }
    },
    [currentTool, selectLine, removeLine]
  );

  const handleLineHover = useCallback((id: string | null) => {
    setHoveredLineId(id);
  }, []);

  const drawPreviewLine = () => {
    if (!isDrawing || !drawStart || !drawEnd) return null;
    if (currentTool === 'select' || currentTool === 'eraser') return null;

    const type = currentTool === 'axis' ? 'axis' : currentTool;
    const color = lineColors[type as keyof typeof lineColors];
    const dashArray = lineDashArrays[type as keyof typeof lineDashArrays];

    return (
      <line
        x1={drawStart.x}
        y1={drawStart.y}
        x2={drawEnd.x}
        y2={drawEnd.y}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        opacity={0.7}
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  return (
    <div className="w-full h-full bg-stone-100 relative overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          cursor: currentTool === 'select' 
            ? isPanning ? 'grabbing' : 'default'
            : currentTool === 'eraser'
            ? 'crosshair'
            : 'crosshair',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="canvas-bg" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform={`scale(1)`}>
            <rect width="20" height="20" fill="#f5f5f4" />
            <circle cx="10" cy="10" r="0.5" fill="#d6d3d1" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#canvas-bg)" />
        
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <PaperLayer paper={paper} />
          <GridHelper paper={paper} gridSize={gridSize} visible={showGrid} />
          
          <LineRenderer
            lines={lines.filter((l) => l.type !== 'axis')}
            selectedIds={selectedLineIds}
            errorIds={errorLineIds}
            onLineClick={handleLineClick}
            onLineHover={handleLineHover}
            highlightIds={highlightLineIds}
          />
          
          {axisLine && (
            <LineRenderer
              lines={[axisLine]}
              selectedIds={[]}
              errorIds={[]}
              onLineClick={handleLineClick}
              onLineHover={handleLineHover}
            />
          )}
          
          {drawPreviewLine()}
          
          {hoveredLineId && currentTool === 'select' && (
            <HoverInfo lineId={hoveredLineId} />
          )}
        </g>
      </svg>
      
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
        <button
          onClick={() => setZoom(zoom * 0.8)}
          className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
        >
          −
        </button>
        <span className="text-sm text-stone-600 min-w-[60px] text-center font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom * 1.2)}
          className="w-8 h-8 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
        >
          +
        </button>
        <div className="w-px h-5 bg-stone-200 mx-1" />
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 hover:bg-stone-100 rounded transition-colors"
        >
          重置
        </button>
      </div>
    </div>
  );
}

function HoverInfo({ lineId }: { lineId: string }) {
  const line = useCanvasStore((state) =>
    state.lines.find((l) => l.id === lineId)
  );

  if (!line) return null;

  const labels: Record<string, string> = {
    mountain: '山折线',
    valley: '谷折线',
    cut: '剪口',
    axis: '对称轴',
    support: '支撑线',
  };

  return (
    <g
      style={{ pointerEvents: 'none' }}
      transform={`translate(${(line.start.x + line.end.x) / 2}, ${(line.start.y + line.end.y) / 2 - 12})`}
    >
      <rect
        x="-40"
        y="-18"
        width="80"
        height="20"
        rx="4"
        fill="rgba(44, 62, 80, 0.9)"
      />
      <text
        x="0"
        y="-4"
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontFamily="sans-serif"
      >
        {labels[line.type]}
      </text>
    </g>
  );
}
