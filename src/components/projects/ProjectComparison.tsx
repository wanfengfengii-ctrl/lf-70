import { useMemo, useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import {
  ArrowLeft,
  GitCompare,
  ChevronDown,
  Layers,
  Mountain,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ListOrdered,
  AlertTriangle,
  Play,
  Download,
  Link2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ProjectComparison as ProjectComparisonType } from '@/types';
import { getComplexityLevel, getComplexityColor } from '@/utils/complexity';
import { lineColors } from '@/components/canvas/lineStyles';

interface ComparisonMetric {
  key: keyof ProjectComparisonType['projectA'];
  label: string;
  icon: React.ReactNode;
  higherIsBetter?: boolean;
  format?: (value: number) => string;
  category: 'core' | 'structure' | 'quality';
}

const METRICS: ComparisonMetric[] = [
  {
    key: 'complexity',
    label: '复杂度分数',
    icon: <BarChart3 className="w-4 h-4" />,
    higherIsBetter: false,
    category: 'core',
  },
  {
    key: 'stepCount',
    label: '折叠步骤数',
    icon: <ListOrdered className="w-4 h-4" />,
    higherIsBetter: false,
    category: 'core',
  },
  {
    key: 'conflictCount',
    label: '冲突数量',
    icon: <AlertTriangle className="w-4 h-4" />,
    higherIsBetter: false,
    format: (v) => v.toString(),
    category: 'quality',
  },
  {
    key: 'lineCount',
    label: '总线段数',
    icon: <Layers className="w-4 h-4" />,
    category: 'structure',
  },
  {
    key: 'mountainCount',
    label: '山折线数',
    icon: <Mountain className="w-4 h-4 text-red-500" />,
    category: 'structure',
  },
  {
    key: 'valleyCount',
    label: '谷折线数',
    icon: <Mountain className="w-4 h-4 text-blue-500 rotate-180" />,
    category: 'structure',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  core: '核心指标',
  structure: '结构组成',
  quality: '质量评估',
};

export function ProjectComparisonView() {
  const { idA, idB } = useParams<{ idA: string; idB: string }>();
  const navigate = useNavigate();
  const {
    projects,
    compareProjects,
    loadProjects,
    getProject,
    exportProject,
  } = useProjectStore();

  const [selectedA, setSelectedA] = useState<string | null>(idA || null);
  const [selectedB, setSelectedB] = useState<string | null>(idB || null);
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const comparison = useMemo(() => {
    if (!selectedA || !selectedB) return null;
    return compareProjects(selectedA, selectedB);
  }, [selectedA, selectedB, compareProjects]);

  const projectA = selectedA ? getProject(selectedA) : null;
  const projectB = selectedB ? getProject(selectedB) : null;

  const filteredProjects = (excludeId: string | null) => {
    return projects.filter((p) => p.id !== excludeId);
  };

  const renderMetricBar = (
    value: number,
    maxValue: number,
    color: string,
    reverse = false
  ) => {
    if (maxValue === 0) return '0%';
    const pct = Math.min((value / maxValue) * 100, 100);
    return reverse ? `${100 - pct}%` : `${pct}%`;
  };

  const handleExport = () => {
    if (!comparison) return;
    const exportData = {
      exportedAt: new Date().toISOString(),
      comparison: {
        projectA: comparison.projectA,
        projectB: comparison.projectB,
      },
      summary: generateSummary(comparison),
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-${comparison.projectA.name}-vs-${comparison.projectB.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSummary = (comp: ProjectComparisonType) => {
    const { projectA, projectB } = comp;
    const summary: string[] = [];
    if (projectA.complexity !== projectB.complexity) {
      const simpler =
        projectA.complexity < projectB.complexity ? projectA.name : projectB.name;
      const diff = Math.abs(projectA.complexity - projectB.complexity);
      summary.push(`${simpler} 的复杂度更低 (相差 ${diff.toFixed(1)} 分)`);
    }
    if (projectA.stepCount !== projectB.stepCount) {
      const fewerSteps =
        projectA.stepCount < projectB.stepCount ? projectA.name : projectB.name;
      const diff = Math.abs(projectA.stepCount - projectB.stepCount);
      summary.push(`${fewerSteps} 的折叠步骤更少 (少 ${diff} 步)`);
    }
    if (projectA.conflictCount !== projectB.conflictCount) {
      const fewerConflicts =
        projectA.conflictCount < projectB.conflictCount ? projectA.name : projectB.name;
      const diff = Math.abs(projectA.conflictCount - projectB.conflictCount);
      summary.push(`${fewerConflicts} 的冲突更少 (少 ${diff} 个)`);
    }
    return summary;
  };

  const summary = comparison ? generateSummary(comparison) : [];

  const renderProjectCard = (
    project: typeof projectA,
    side: 'A' | 'B'
  ) => {
    if (!project) return null;
    const stats = comparison?.[side === 'A' ? 'projectA' : 'projectB'];
    const complexityColor = stats
      ? getComplexityColor(stats.complexity)
      : 'text-stone-600';
    const complexityLevel = stats
      ? getComplexityLevel(stats.complexity)
      : '-';

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="h-36 bg-gradient-to-br from-stone-50 to-stone-100 relative">
          <svg
            viewBox={`0 0 ${project.paper.width + 100} ${project.paper.height + 100}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
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
              {project.lines.slice(0, 40).map((line) => (
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

          <div className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded ${
            side === 'A'
              ? 'bg-blue-500 text-white'
              : 'bg-purple-500 text-white'
          }`}>
            方案 {side}
          </div>

          <div className="absolute top-3 right-3">
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

        <div className="p-5">
          <h3 className="text-lg font-serif font-medium text-stone-800 mb-1 truncate">
            {project.name}
          </h3>
          <p className="text-xs text-stone-400 mb-4">
            更新于 {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="text-lg font-semibold text-red-600">
                {stats?.mountainCount ?? 0}
              </div>
              <div className="text-[10px] text-red-400">山折</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">
                {stats?.valleyCount ?? 0}
              </div>
              <div className="text-[10px] text-blue-400">谷折</div>
            </div>
            <div className="text-center p-2 bg-stone-50 rounded-lg">
              <div className={`text-lg font-semibold ${complexityColor}`}>
                {stats?.complexity.toFixed(1) ?? '-'}
              </div>
              <div className="text-[10px] text-stone-400">{complexityLevel}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/preview/${project.id}`)}
              className="flex-1 h-9 rounded-lg bg-amber-500 text-white text-xs flex items-center justify-center gap-1 hover:bg-amber-600 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              预览折叠
            </button>
            <button
              onClick={() => {
                const json = exportProject(project);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.name}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="h-9 w-9 rounded-lg border border-stone-200 text-stone-500 flex items-center justify-center hover:bg-stone-50 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDropdown = (
    value: string | null,
    setValue: (id: string | null) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    excludeId: string | null,
    placeholder: string,
    sideColor: string
  ) => {
    const options = filteredProjects(excludeId);
    const selectedProject = value ? getProject(value) : null;

    return (
      <div className="relative">
        <button
          onClick={() => setShow(!show)}
          className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
            selectedProject
              ? `${sideColor} border-current bg-white`
              : 'border-dashed border-stone-300 bg-stone-50 hover:border-stone-400'
          }`}
        >
          <GitCompare className={`w-5 h-5 flex-shrink-0 ${
            selectedProject ? 'text-current' : 'text-stone-400'
          }`} />
          <div className="text-left flex-1 min-w-0">
            {selectedProject ? (
              <>
                <div className="text-sm font-medium text-stone-800 truncate">
                  {selectedProject.name}
                </div>
                <div className="text-xs text-stone-400">
                  {selectedProject.lines.length} 条线段 · {selectedProject.foldSteps.length} 步
                </div>
              </>
            ) : (
              <div className="text-sm text-stone-500">{placeholder}</div>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${
            show ? 'rotate-180' : ''
          } ${selectedProject ? 'text-current' : 'text-stone-400'}`} />
        </button>

        {show && (
          <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="p-6 text-center text-sm text-stone-400">
                暂无可用方案
              </div>
            ) : (
              options.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setValue(p.id);
                    setShow(false);
                  }}
                  className={`w-full p-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-b-0 flex items-center gap-3 ${
                    p.id === value ? 'bg-amber-50' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      p.isFoldable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {p.isFoldable ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-800 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-stone-400 flex items-center gap-2">
                      <span>{p.lines.length} 条线段</span>
                      <span>·</span>
                      <span>{p.foldSteps.length} 步</span>
                      <span>·</span>
                      <span className={getComplexityColor(p.complexity)}>
                        {getComplexityLevel(p.complexity)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMetricComparison = (metric: ComparisonMetric) => {
    if (!comparison) return null;
    const { projectA, projectB } = comparison;
    const valA = projectA[metric.key] as number;
    const valB = projectB[metric.key] as number;
    const maxVal = Math.max(valA, valB, 1);

    const aBetter = metric.higherIsBetter ? valA > valB : valA < valB;
    const bBetter = metric.higherIsBetter ? valB > valA : valB < valA;
    const equal = valA === valB;

    const reverse = metric.higherIsBetter === false;

    return (
      <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
            {metric.icon}
            <span>{metric.label}</span>
          </div>
          {!equal && (
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
              aBetter
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {aBetter ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {aBetter ? '方案A 更优' : '方案B 更优'}
            </span>
          )}
          {equal && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
              相同
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 text-xs font-medium text-blue-600 text-right flex-shrink-0">
              A
            </div>
            <div className="flex-1 h-6 bg-white rounded-full overflow-hidden border border-stone-200 relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  aBetter && !equal
                    ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                    : 'bg-blue-200'
                }`}
                style={{ width: renderMetricBar(valA, maxVal, 'blue', reverse) }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-stone-700">
                {metric.format ? metric.format(valA) : valA.toFixed(valA % 1 === 0 ? 0 : 1)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 text-xs font-medium text-purple-600 text-right flex-shrink-0">
              B
            </div>
            <div className="flex-1 h-6 bg-white rounded-full overflow-hidden border border-stone-200 relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  bBetter && !equal
                    ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                    : 'bg-purple-200'
                }`}
                style={{ width: renderMetricBar(valB, maxVal, 'purple', reverse) }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-stone-700">
                {metric.format ? metric.format(valB) : valB.toFixed(valB % 1 === 0 ? 0 : 1)}
              </span>
            </div>
          </div>
        </div>

        {!equal && (
          <div className="mt-3 text-xs text-stone-500 text-center">
            差距: {Math.abs(valA - valB).toFixed(valA % 1 === 0 && valB % 1 === 0 ? 0 : 1)}
          </div>
        )}
      </div>
    );
  };

  const groupedMetrics = METRICS.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, ComparisonMetric[]>);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/projects')}
                className="w-10 h-10 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-serif font-medium text-stone-800">
                  方案对比分析
                </h1>
                <p className="text-sm text-stone-400">
                  对比两个方案的复杂度、步骤数和冲突情况
                </p>
              </div>
            </div>

            {comparison && (
              <button
                onClick={handleExport}
                className="h-9 px-4 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出对比报告
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {renderDropdown(
            selectedA,
            setSelectedA,
            showDropdownA,
            setShowDropdownA,
            selectedB,
            '选择第一个方案进行对比',
            'text-blue-600'
          )}
          {renderDropdown(
            selectedB,
            setSelectedB,
            showDropdownB,
            setShowDropdownB,
            selectedA,
            '选择第二个方案进行对比',
            'text-purple-600'
          )}
        </div>

        {!comparison ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-2xl flex items-center justify-center">
              <GitCompare className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-lg font-medium text-stone-600 mb-2">
              请选择两个方案
            </h3>
            <p className="text-sm text-stone-400">
              从上方下拉框中选择要对比的两个折纸设计方案
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {renderProjectCard(projectA, 'A')}
              {renderProjectCard(projectB, 'B')}
            </div>

            {summary.length > 0 && (
              <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <h3 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  对比总结
                </h3>
                <div className="space-y-2">
                  {summary.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-amber-700 flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-8">
              {Object.entries(groupedMetrics).map(([category, metrics]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-stone-500 mb-4 flex items-center gap-2 pb-2 border-b border-stone-200">
                    <span>{CATEGORY_LABELS[category]}</span>
                    <span className="flex-1 h-px bg-stone-100" />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.map((metric) => (
                      <div key={String(metric.key)}>
                        {renderMetricComparison(metric)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
