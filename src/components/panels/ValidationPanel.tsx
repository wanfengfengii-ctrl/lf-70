import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type { ValidationError } from '@/types';
import { lineColors } from '@/components/canvas/lineStyles';
import { useCanvasStore } from '@/store/canvasStore';

interface ValidationPanelProps {
  errors: ValidationError[];
  isFoldable: boolean;
  complexity: number;
  complexityLevel: string;
  complexityColor: string;
}

const errorTypeLabels: Record<string, string> = {
  boundary: '边界错误',
  conflict: '交叉冲突',
  unclosed: '未闭合结构',
  support_cut: '剪口冲突',
  symmetry: '对称校验',
  duplicate: '重复折痕',
};

export function ValidationPanel({
  errors,
  isFoldable,
  complexity,
  complexityLevel,
  complexityColor,
}: ValidationPanelProps) {
  const { lines, selectedLineIds, selectLine } = useCanvasStore();

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  const handleErrorClick = (error: ValidationError) => {
    if (error.lineIds.length > 0) {
      error.lineIds.forEach((id) => selectLine(id, true));
    }
  };

  return (
    <div className="w-72 bg-white border-l border-stone-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-stone-500" />
        <span className="font-medium text-stone-700">校验</span>
      </div>

      <div className="p-4 border-b border-stone-100">
        <div
          className={`
          p-4 rounded-xl text-center
          ${isFoldable ? 'bg-green-50' : 'bg-red-50'}
        `}
        >
          {isFoldable ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-700">可折叠</p>
              <p className="text-xs text-green-600 mt-1">
                所有折痕符合设计规范
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <p className="font-medium text-red-700">存在问题</p>
              <p className="text-xs text-red-600 mt-1">
                {errorCount} 个错误，{warningCount} 个警告
              </p>
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-600">复杂度</span>
          <span className={`text-sm font-medium ${complexityColor}`}>
            {complexityLevel}
          </span>
        </div>
        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              complexity < 10
                ? 'bg-green-400'
                : complexity < 25
                ? 'bg-yellow-400'
                : complexity < 50
                ? 'bg-orange-400'
                : 'bg-red-400'
            }`}
            style={{ width: `${Math.min(complexity * 2, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-stone-400 mt-1">
          <span>简单</span>
          <span>{complexity} 分</span>
          <span>困难</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          {errors.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-2" />
              <p className="text-sm text-stone-400">暂无问题</p>
              <p className="text-xs text-stone-300 mt-1">设计符合所有规范</p>
            </div>
          ) : (
            <div className="space-y-2">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    ${
                      error.severity === 'error'
                        ? 'bg-red-50 hover:bg-red-100'
                        : 'bg-amber-50 hover:bg-amber-100'
                    }
                  `}
                  onClick={() => handleErrorClick(error)}
                >
                  <div className="flex items-start gap-2">
                    {error.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-stone-700">
                        {errorTypeLabels[error.type] || error.type}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {error.message}
                      </p>
                      {error.lineIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {error.lineIds.slice(0, 3).map((lineId) => {
                            const line = lines.find((l) => l.id === lineId);
                            if (!line) return null;
                            return (
                              <span
                                key={lineId}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/60 rounded text-[10px]"
                              >
                                <span
                                  className="w-2 h-0.5 rounded-full"
                                  style={{ backgroundColor: lineColors[line.type] }}
                                />
                                <span className="text-stone-600">
                                  线段 {line.order + 1}
                                </span>
                              </span>
                            );
                          })}
                          {error.lineIds.length > 3 && (
                            <span className="text-[10px] text-stone-400">
                              +{error.lineIds.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-stone-100 bg-stone-50">
        <p className="text-xs text-stone-400">
          选中 {selectedLineIds.length} 条线段
        </p>
      </div>
    </div>
  );
}
