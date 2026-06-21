import {
  MousePointer2,
  Mountain,
  Waves,
  Scissors,
  Split,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Grid3X3,
  Save,
  FolderOpen,
  Play,
  Copy,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import type { ToolType } from '@/types';
import { useState } from 'react';
import { SaveDialog } from './SaveDialog';

interface ToolbarProps {
  onPreview: () => void;
  onOpenProjects: () => void;
}

const tools: { type: ToolType; icon: typeof MousePointer2; label: string; color: string }[] = [
  { type: 'select', icon: MousePointer2, label: '选择', color: 'text-stone-700' },
  { type: 'mountain', icon: Mountain, label: '山折', color: 'text-red-600' },
  { type: 'valley', icon: Waves, label: '谷折', color: 'text-blue-600' },
  { type: 'cut', icon: Scissors, label: '剪口', color: 'text-stone-600' },
  { type: 'axis', icon: Split, label: '对称轴', color: 'text-purple-600' },
  { type: 'eraser', icon: Eraser, label: '橡皮', color: 'text-stone-500' },
];

export function Toolbar({ onPreview, onOpenProjects }: ToolbarProps) {
  const {
    currentTool,
    setCurrentTool,
    undo,
    redo,
    deleteSelected,
    selectedLineIds,
    showGrid,
    setShowGrid,
    symmetricMode,
    setSymmetricMode,
    axisLine,
    lines,
    paper,
  } = useCanvasStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);

  return (
    <>
      <div className="h-14 bg-white border-b border-stone-200 flex items-center px-4 gap-2 shadow-sm">
        <div className="flex items-center gap-1 pr-3 border-r border-stone-200">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-md flex items-center justify-center mr-2">
            <Mountain className="w-5 h-5 text-amber-700" />
          </div>
          <span className="font-serif text-lg font-medium text-stone-800">纸艺折痕设计</span>
        </div>

        <div className="flex items-center gap-1 px-2">
          {tools.map(({ type, icon: Icon, label, color }) => (
            <button
              key={type}
              onClick={() => setCurrentTool(type)}
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-150 relative group
                ${currentTool === type
                  ? 'bg-stone-100 shadow-inner'
                  : 'hover:bg-stone-50'
                }
              `}
              title={label}
            >
              <Icon
                className={`w-5 h-5 ${
                  currentTool === type ? color : 'text-stone-500 group-hover:text-stone-700'
                }`}
              />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-stone-200 mx-1" />

        <div className="flex items-center gap-1 px-1">
          <button
            onClick={undo}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-stone-50 text-stone-500 hover:text-stone-700 transition-colors"
            title="撤销"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-stone-50 text-stone-500 hover:text-stone-700 transition-colors"
            title="重做"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px h-6 bg-stone-200 mx-1" />

        <div className="flex items-center gap-1 px-1">
          <button
            onClick={deleteSelected}
            disabled={selectedLineIds.length === 0}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${selectedLineIds.length > 0
                ? 'hover:bg-red-50 text-red-500 hover:text-red-600'
                : 'text-stone-300 cursor-not-allowed'
              }
            `}
            title="删除选中"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px h-6 bg-stone-200 mx-1" />

        <div className="flex items-center gap-1 px-1">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${showGrid
                ? 'bg-stone-100 text-stone-700'
                : 'hover:bg-stone-50 text-stone-400 hover:text-stone-600'
              }
            `}
            title="网格"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSymmetricMode(!symmetricMode)}
            disabled={!axisLine}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-colors
              ${!axisLine
                ? 'text-stone-300 cursor-not-allowed'
                : symmetricMode
                ? 'bg-purple-50 text-purple-600'
                : 'hover:bg-stone-50 text-stone-400 hover:text-stone-600'
              }
            `}
            title={!axisLine ? '请先绘制对称轴' : symmetricMode ? '关闭对称模式' : '开启对称模式'}
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 px-1">
          <button
            onClick={onOpenProjects}
            className="h-9 px-3 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-2 text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            方案库
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={lines.length === 0}
            className={`
              h-9 px-3 rounded-lg flex items-center gap-2 text-sm transition-colors
              ${lines.length > 0
                ? 'bg-stone-800 text-white hover:bg-stone-700'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            <Save className="w-4 h-4" />
            保存方案
          </button>
          <button
            onClick={onPreview}
            disabled={lines.length === 0}
            className={`
              h-9 px-3 rounded-lg flex items-center gap-2 text-sm transition-colors
              ${lines.length > 0
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            <Play className="w-4 h-4" />
            折叠预览
          </button>
        </div>
      </div>

      {showSaveDialog && (
        <SaveDialog
          onClose={() => setShowSaveDialog(false)}
          lines={lines}
          paper={paper}
        />
      )}
    </>
  );
}
