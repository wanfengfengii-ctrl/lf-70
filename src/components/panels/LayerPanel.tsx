import { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { lineColors, lineTypeLabels } from '@/components/canvas/lineStyles';
import type { LineType } from '@/types';

const lineTypes: LineType[] = ['mountain', 'valley', 'cut', 'axis'];

export function LayerPanel() {
  const { lines, toggleLineVisibility, selectLine, selectedLineIds, currentTool } =
    useCanvasStore();
  const [expandedTypes, setExpandedTypes] = useState<Set<LineType>>(
    new Set(lineTypes)
  );

  const toggleType = (type: LineType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const getLinesByType = (type: LineType) => {
    return lines.filter((l) => l.type === type).sort((a, b) => a.order - b.order);
  };

  return (
    <div className="w-64 bg-white border-r border-stone-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
        <Layers className="w-5 h-5 text-stone-500" />
        <span className="font-medium text-stone-700">图层</span>
        <span className="text-xs text-stone-400 ml-auto">{lines.length} 条</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {lineTypes.map((type) => {
          const typeLines = getLinesByType(type);
          const isExpanded = expandedTypes.has(type);
          const visibleCount = typeLines.filter((l) => l.visible).length;

          if (typeLines.length === 0 && type === 'axis') return null;

          return (
            <div key={type} className="border-b border-stone-50">
              <button
                onClick={() => toggleType(type)}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-stone-50 transition-colors"
              >
                {typeLines.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  )
                ) : (
                  <span className="w-4" />
                )}
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: lineColors[type] }}
                />
                <span className="text-sm text-stone-600">{lineTypeLabels[type]}</span>
                <span className="text-xs text-stone-400 ml-auto">
                  {visibleCount}/{typeLines.length}
                </span>
              </button>

              {isExpanded && typeLines.length > 0 && (
                <div className="pb-1">
                  {typeLines.map((line, index) => (
                    <div
                      key={line.id}
                      className={`
                        px-4 py-1.5 flex items-center gap-2 cursor-pointer
                        transition-colors text-sm
                        ${selectedLineIds.includes(line.id)
                          ? 'bg-amber-50'
                          : 'hover:bg-stone-50'
                        }
                      `}
                      onClick={() => {
                        if (currentTool === 'select') {
                          selectLine(line.id);
                        }
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLineVisibility(line.id);
                        }}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        {line.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <div
                        className="w-6 h-0.5 rounded-full"
                        style={{ backgroundColor: lineColors[type] }}
                      />
                      <span className="text-stone-600 text-xs">
                        {lineTypeLabels[type]} {index + 1}
                      </span>
                      {line.symmetried && (
                        <span className="text-[10px] text-purple-500 bg-purple-50 px-1 py-0.5 rounded ml-auto">
                          对称
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {lines.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-stone-400">暂无折痕</p>
            <p className="text-xs text-stone-300 mt-1">选择工具开始绘制</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-stone-100 bg-stone-50">
        <div className="text-xs text-stone-500 space-y-1">
          <div className="flex justify-between">
            <span>山折线</span>
            <span className="text-stone-700">
              {lines.filter((l) => l.type === 'mountain').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>谷折线</span>
            <span className="text-stone-700">
              {lines.filter((l) => l.type === 'valley').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>剪口</span>
            <span className="text-stone-700">
              {lines.filter((l) => l.type === 'cut').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
