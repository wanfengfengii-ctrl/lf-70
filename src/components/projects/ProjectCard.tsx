import { Play, Trash2, Download, Edit3, CheckCircle2, XCircle } from 'lucide-react';
import type { Project } from '@/types';
import { getComplexityLevel, getComplexityColor } from '@/utils/complexity';
import { lineColors } from '@/components/canvas/lineStyles';

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (project: Project) => void;
}

export function ProjectCard({
  project,
  onOpen,
  onPreview,
  onDelete,
  onExport,
}: ProjectCardProps) {
  const complexityLevel = getComplexityLevel(project.complexity);
  const complexityColor = getComplexityColor(project.complexity);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const mountainCount = project.lines.filter((l) => l.type === 'mountain').length;
  const valleyCount = project.lines.filter((l) => l.type === 'valley').length;
  const cutCount = project.lines.filter((l) => l.type === 'cut').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-40 bg-gradient-to-br from-stone-50 to-stone-100 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${project.paper.width + 100} ${project.paper.height + 100}`}
          className="w-full h-full"
        >
          <g transform="translate(50, 50)">
            <rect
              width={project.paper.width}
              height={project.paper.height}
              fill="#F5F0E6"
              stroke="#D4C9B8"
              strokeWidth="1"
              rx="2"
            />
            {project.lines.slice(0, 30).map((line) => (
              <line
                key={line.id}
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke={lineColors[line.type]}
                strokeWidth="1.5"
                strokeDasharray={
                  line.type === 'mountain'
                    ? '6,3'
                    : line.type === 'valley'
                    ? '3,3'
                    : '0'
                }
                opacity="0.8"
              />
            ))}
          </g>
        </svg>

        <div className="absolute top-2 right-2">
          {project.isFoldable ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              可折叠
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-500/90 text-white text-xs rounded-full">
              <XCircle className="w-3 h-3" />
              待完善
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-stone-800 truncate flex-1">
            {project.name}
          </h3>
          <span className={`text-xs font-medium ${complexityColor} ml-2 flex-shrink-0`}>
            {complexityLevel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-1.5 bg-red-50 rounded">
            <div className="text-sm font-medium text-red-600">{mountainCount}</div>
            <div className="text-[10px] text-red-400">山折</div>
          </div>
          <div className="text-center p-1.5 bg-blue-50 rounded">
            <div className="text-sm font-medium text-blue-600">{valleyCount}</div>
            <div className="text-[10px] text-blue-400">谷折</div>
          </div>
          <div className="text-center p-1.5 bg-stone-100 rounded">
            <div className="text-sm font-medium text-stone-600">{cutCount}</div>
            <div className="text-[10px] text-stone-400">剪口</div>
          </div>
        </div>

        <div className="text-xs text-stone-400 mb-3">
          更新于 {formatDate(project.updatedAt)}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onOpen(project.id)}
            className="flex-1 h-8 rounded-lg bg-stone-800 text-white text-xs flex items-center justify-center gap-1 hover:bg-stone-700 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            编辑
          </button>
          <button
            onClick={() => onPreview(project.id)}
            className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors"
            title="预览"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onExport(project)}
            className="h-8 w-8 rounded-lg border border-stone-200 text-stone-500 flex items-center justify-center hover:bg-stone-50 transition-colors"
            title="导出"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="h-8 w-8 rounded-lg border border-stone-200 text-stone-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
