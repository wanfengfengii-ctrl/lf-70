import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import type { LineSegment, Paper } from '@/types';
import { X } from 'lucide-react';

interface SaveDialogProps {
  onClose: () => void;
  lines: LineSegment[];
  paper: Paper;
}

export function SaveDialog({ onClose, lines, paper }: SaveDialogProps) {
  const [name, setName] = useState('');
  const { saveCurrentState, currentProjectId, getProject } = useProjectStore();
  const { loadLines, setPaper } = useCanvasStore();

  const currentProject = currentProjectId ? getProject(currentProjectId) : null;

  const handleSave = () => {
    if (!name.trim()) return;
    const project = saveCurrentState(name.trim(), paper, lines);
    loadLines(lines);
    setPaper(paper);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="font-medium text-stone-800">保存设计方案</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <label className="block text-sm text-stone-600 mb-2">方案名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：经典千纸鹤"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-stone-700"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          
          <div className="mt-4 p-3 bg-stone-50 rounded-lg">
            <div className="text-sm text-stone-500 space-y-1">
              <div className="flex justify-between">
                <span>折痕数量</span>
                <span className="text-stone-700 font-medium">{lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span>纸张尺寸</span>
                <span className="text-stone-700 font-medium">
                  {paper.width} × {paper.height}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 px-5 py-4 bg-stone-50 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className={`
              px-4 py-2 rounded-lg transition-colors
              ${name.trim()
                ? 'bg-stone-800 text-white hover:bg-stone-700'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
