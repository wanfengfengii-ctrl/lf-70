import { useCanvasStore } from '@/store/canvasStore';
import { lineTypeLabels } from '@/components/canvas/lineStyles';

interface StatusBarProps {
  mousePosition?: { x: number; y: number };
}

export function StatusBar({ mousePosition }: StatusBarProps) {
  const { currentTool, lines, paper, selectedLineIds, zoom } = useCanvasStore();

  const mountainCount = lines.filter((l) => l.type === 'mountain').length;
  const valleyCount = lines.filter((l) => l.type === 'valley').length;
  const cutCount = lines.filter((l) => l.type === 'cut').length;

  return (
    <div className="h-7 bg-stone-50 border-t border-stone-200 flex items-center px-4 text-xs text-stone-500">
      <div className="flex items-center gap-2">
        <span className="text-stone-400">工具:</span>
        <span className="font-medium text-stone-600">
          {lineTypeLabels[currentTool as keyof typeof lineTypeLabels] || currentTool}
        </span>
      </div>

      <div className="w-px h-4 bg-stone-200 mx-4" />

      {mousePosition && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-stone-400">坐标:</span>
            <span className="font-mono text-stone-600">
              {Math.round(mousePosition.x)}, {Math.round(mousePosition.y)}
            </span>
          </div>
          <div className="w-px h-4 bg-stone-200 mx-4" />
        </>
      )}

      <div className="flex items-center gap-3">
        <span>
          山折: <span className="font-medium text-stone-600">{mountainCount}</span>
        </span>
        <span>
          谷折: <span className="font-medium text-stone-600">{valleyCount}</span>
        </span>
        <span>
          剪口: <span className="font-medium text-stone-600">{cutCount}</span>
        </span>
      </div>

      <div className="flex-1" />

      {selectedLineIds.length > 0 && (
        <>
          <span className="text-amber-600">
            已选中 {selectedLineIds.length} 条
          </span>
          <div className="w-px h-4 bg-stone-200 mx-4" />
        </>
      )}

      <div className="flex items-center gap-2">
        <span className="text-stone-400">纸张:</span>
        <span className="font-mono text-stone-600">
          {paper.width} × {paper.height}
        </span>
      </div>

      <div className="w-px h-4 bg-stone-200 mx-4" />

      <div className="flex items-center gap-2">
        <span className="text-stone-400">缩放:</span>
        <span className="font-mono text-stone-600">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}
