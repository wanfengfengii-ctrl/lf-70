import { useState } from 'react';
import {
  Settings,
  Link2,
  Unlink,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { LineSegment } from '@/types';
import { lineColors, lineTypeLabels } from '@/components/canvas/lineStyles';

const MIN_ANGLE = -180;
const MAX_ANGLE = 180;
const DEFAULT_MOUNTAIN_ANGLE = 90;
const DEFAULT_VALLEY_ANGLE = -90;

export function ConstraintPanel() {
  const {
    lines,
    selectedLineIds,
    updateLineConstraint,
    addLinkage,
    removeLinkage,
  } = useCanvasStore();

  const [linkingMode, setLinkingMode] = useState(false);

  const selectedLines = lines.filter((l) => selectedLineIds.includes(l.id));
  const foldableSelectedLines = selectedLines.filter(
    (l) => l.type === 'mountain' || l.type === 'valley'
  );

  const singleSelection = foldableSelectedLines.length === 1 ? foldableSelectedLines[0] : null;
  const allSameType =
    foldableSelectedLines.length > 0 &&
    foldableSelectedLines.every((l) => l.type === foldableSelectedLines[0].type);

  const commonType = allSameType ? foldableSelectedLines[0].type : null;
  const isMountain = commonType === 'mountain';

  const getDefaultAngle = () => {
    if (isMountain) return DEFAULT_MOUNTAIN_ANGLE;
    if (commonType === 'valley') return DEFAULT_VALLEY_ANGLE;
    return 90;
  };

  const getCurrentAngle = () => {
    if (foldableSelectedLines.length === 0) return getDefaultAngle();
    const firstWithAngle = foldableSelectedLines.find((l) => l.foldAngle !== undefined);
    return firstWithAngle?.foldAngle ?? getDefaultAngle();
  };

  const getCurrentPriority = () => {
    if (foldableSelectedLines.length === 0) return null;
    const firstWithPrio = foldableSelectedLines.find((l) => l.priority !== undefined);
    return firstWithPrio?.priority ?? null;
  };

  const handleAngleChange = (value: number) => {
    const clamped = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, value));
    for (const line of foldableSelectedLines) {
      updateLineConstraint(line.id, { foldAngle: clamped });
    }
  };

  const handlePriorityChange = (delta: number) => {
    const current = getCurrentPriority();
    const basePriority = current ?? 0;
    const newPriority = Math.max(0, basePriority + delta);
    for (const line of foldableSelectedLines) {
      updateLineConstraint(line.id, { priority: newPriority });
    }
  };

  const handleResetAngle = () => {
    const defaultAngle = getDefaultAngle();
    for (const line of foldableSelectedLines) {
      updateLineConstraint(line.id, { foldAngle: defaultAngle });
    }
  };

  const handleResetPriority = () => {
    for (const line of foldableSelectedLines) {
      updateLineConstraint(line.id, { priority: null });
    }
  };

  const getLinkedLineIds = (): Set<string> => {
    const linked = new Set<string>();
    for (const line of foldableSelectedLines) {
      if (line.linkageIds) {
        for (const id of line.linkageIds) {
          linked.add(id);
        }
      }
    }
    return linked;
  };

  const linkedLineIds = getLinkedLineIds();

  const handleLineClickForLink = (line: LineSegment) => {
    if (!linkingMode || !singleSelection) return;
    if (line.id === singleSelection.id) return;
    if (line.type !== 'mountain' && line.type !== 'valley') return;

    if (linkedLineIds.has(line.id)) {
      removeLinkage(singleSelection.id, line.id);
    } else {
      addLinkage(singleSelection.id, line.id);
    }
  };

  const availableFoldLines = lines.filter(
    (l) => (l.type === 'mountain' || l.type === 'valley') && !selectedLineIds.includes(l.id)
  );

  const angle = getCurrentAngle();
  const priority = getCurrentPriority();

  return (
    <div className="w-72 bg-white border-l border-stone-200 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
        <Settings className="w-5 h-5 text-stone-500" />
        <span className="font-medium text-stone-700">折痕约束</span>
      </div>

      {foldableSelectedLines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-sm text-stone-500 mb-1">未选中折痕</p>
          <p className="text-xs text-stone-400">
            使用选择工具点击山折线或谷折线
            <br />
            以编辑折叠约束
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-stone-100 bg-stone-50">
            <div className="flex items-center gap-2 mb-2">
              {foldableSelectedLines.length > 1 ? (
                <span className="text-xs font-medium text-stone-600 bg-white px-2 py-1 rounded border border-stone-200">
                  已选择 {foldableSelectedLines.length} 条线段
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: lineColors[foldableSelectedLines[0].type] }}
                  />
                  <span className="text-sm font-medium text-stone-700">
                    {lineTypeLabels[foldableSelectedLines[0].type]}
                  </span>
                  <span className="text-xs text-stone-400">
                    顺序 #{foldableSelectedLines[0].order + 1}
                  </span>
                </div>
              )}
            </div>

            {foldableSelectedLines.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {foldableSelectedLines.slice(0, 6).map((line, idx) => (
                  <div
                    key={line.id}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-stone-200"
                  >
                    <div
                      className="w-2 h-0.5 rounded-full"
                      style={{ backgroundColor: lineColors[line.type] }}
                    />
                    <span className="text-[10px] text-stone-500">#{idx + 1}</span>
                  </div>
                ))}
                {foldableSelectedLines.length > 6 && (
                  <span className="text-[10px] text-stone-400 px-1.5 py-0.5">
                    +{foldableSelectedLines.length - 6} 更多
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isMountain ? (
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                ) : commonType === 'valley' ? (
                  <ArrowDownRight className="w-4 h-4 text-blue-500" />
                ) : (
                  <RotateCcw className="w-4 h-4 text-stone-500" />
                )}
                <span className="text-sm font-medium text-stone-700">折叠角度</span>
              </div>
              <button
                onClick={handleResetAngle}
                className="text-xs text-stone-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                title="重置为默认"
              >
                <RotateCcw className="w-3 h-3" />
                重置
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={MIN_ANGLE}
                  max={MAX_ANGLE}
                  step={5}
                  value={angle}
                  onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-stone-100 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <div className="relative">
                  <input
                    type="number"
                    min={MIN_ANGLE}
                    max={MAX_ANGLE}
                    value={angle}
                    onChange={(e) => handleAngleChange(parseInt(e.target.value) || 0)}
                    className="w-16 h-8 px-2 text-center text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                  />
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">
                    °
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAngleChange(isMountain ? 90 : -90)}
                className={`h-8 text-xs rounded-lg transition-colors ${
                  Math.abs(angle) === 90
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                90°
              </button>
              <button
                onClick={() => handleAngleChange(isMountain ? 45 : -45)}
                className={`h-8 text-xs rounded-lg transition-colors ${
                  Math.abs(angle) === 45
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                45°
              </button>
              <button
                onClick={() => handleAngleChange(isMountain ? 180 : -180)}
                className={`h-8 text-xs rounded-lg transition-colors ${
                  Math.abs(angle) === 180
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                180°
              </button>
            </div>

            {commonType && (
              <div className="mt-2 text-[11px] text-stone-400">
                {isMountain
                  ? '山折线：角度应为正值（向上折叠）'
                  : '谷折线：角度应为负值（向下折叠）'}
              </div>
            )}
          </div>

          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-500" />
                <span className="text-sm font-medium text-stone-700">折叠优先级</span>
              </div>
              <button
                onClick={handleResetPriority}
                className="text-xs text-stone-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                title="清除优先级"
              >
                <RotateCcw className="w-3 h-3" />
                清除
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePriorityChange(-1)}
                className="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center">
                <div className={`text-3xl font-semibold tabular-nums ${
                  priority === null ? 'text-stone-300' : 'text-stone-800'
                }`}>
                  {priority === null ? '—' : priority}
                </div>
                <div className="text-[10px] text-stone-400">
                  {priority === null ? '未设置优先级' : '数值越小优先级越高'}
                </div>
              </div>

              <button
                onClick={() => handlePriorityChange(1)}
                className="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {[0, 1, 2, 3, 5, 10].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    for (const line of foldableSelectedLines) {
                      updateLineConstraint(line.id, { priority: p });
                    }
                  }}
                  className={`h-6 px-2 text-xs rounded transition-colors ${
                    priority === p
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  P{p}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-stone-500" />
                <span className="text-sm font-medium text-stone-700">联动关系</span>
              </div>
              {singleSelection && (
                <button
                  onClick={() => setLinkingMode(!linkingMode)}
                  className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                    linkingMode
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {linkingMode ? '完成' : '编辑联动'}
                </button>
              )}
            </div>

            {!singleSelection ? (
              <div className="py-4 text-center">
                <p className="text-xs text-stone-400">
                  {foldableSelectedLines.length > 1
                    ? '请选择单条线段以编辑联动关系'
                    : '选择一条折痕以设置联动'}
                </p>
              </div>
            ) : linkedLineIds.size === 0 && !linkingMode ? (
              <div className="py-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-2">
                  <Unlink className="w-5 h-5 text-stone-300" />
                </div>
                <p className="text-xs text-stone-400 mb-2">暂无联动</p>
                <p className="text-[10px] text-stone-300">
                  点击"编辑联动"选择要同时折叠的线段
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(linkedLineIds).map((linkId) => {
                  const linkedLine = lines.find((l) => l.id === linkId);
                  if (!linkedLine) return null;
                  return (
                    <div
                      key={linkId}
                      className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-100"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: lineColors[linkedLine.type] }}
                      />
                      <span className="text-xs text-stone-600 flex-1">
                        {lineTypeLabels[linkedLine.type]} #{linkedLine.order + 1}
                      </span>
                      {linkingMode && (
                        <button
                          onClick={() => removeLinkage(singleSelection.id, linkId)}
                          className="w-5 h-5 rounded bg-white hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center transition-colors"
                        >
                          <Unlink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {linkingMode && singleSelection && availableFoldLines.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-stone-500 mb-2 font-medium">
                  点击添加联动：
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableFoldLines.map((line) => {
                    const isLinked = linkedLineIds.has(line.id);
                    return (
                      <button
                        key={line.id}
                        onClick={() => handleLineClickForLink(line)}
                        className={`w-full flex items-center gap-2 p-1.5 rounded text-left transition-colors text-xs ${
                          isLinked
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-transparent'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: lineColors[line.type] }}
                        />
                        <span className="flex-1 truncate">
                          {lineTypeLabels[line.type]} #{line.order + 1}
                        </span>
                        {isLinked && <Link2 className="w-3 h-3 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-stone-100 bg-stone-50">
        <div className="text-xs text-stone-500 space-y-1">
          <div className="flex justify-between">
            <span>选中折线</span>
            <span className="text-stone-700">{foldableSelectedLines.length}</span>
          </div>
          <div className="flex justify-between">
            <span>联动关系</span>
            <span className="text-stone-700">{linkedLineIds.size}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
