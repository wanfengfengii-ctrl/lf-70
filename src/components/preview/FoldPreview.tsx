import { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Link2,
  Target,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Download,
  Palette,
  Eye,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LineSegment, Point, FoldStep, PaperMaterialConfig, MaterialAnalysisResult } from '@/types';
import { lineColors, lineDashArrays } from '@/components/canvas/lineStyles';
import { reflectPointOverLine } from '@/utils/geometry';
import { MATERIAL_TYPE_LABELS, PROCESSING_METHOD_LABELS, analyzeMaterialForProject } from '@/utils/materialAnalysis';

interface FoldTransformState {
  stepIndex: number;
  progress: number;
}

function getLineAngle(line: LineSegment): number {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  return Math.atan2(dy, dx);
}

function computeFoldedPoint(
  point: Point,
  foldLine: LineSegment,
  foldAngleDeg: number,
  progress: number,
  layerMultiplier: number = 1
): Point {
  const side = getSide(foldLine, point);
  if (side === 0) return { ...point };

  const foldAngleRad = (foldAngleDeg * Math.PI / 180) * progress;
  const reflected = reflectPointOverLine(point, foldLine);
  const mid = {
    x: (point.x + reflected.x) / 2,
    y: (point.y + reflected.y) / 2,
  };
  const cos = Math.cos(foldAngleRad);
  const sin = Math.sin(foldAngleRad);

  const toMid = {
    x: mid.x - point.x,
    y: mid.y - point.y,
  };

  const lineAngle = getLineAngle(foldLine);
  const perpAngle = lineAngle + Math.PI / 2;
  const perpCos = Math.cos(perpAngle);
  const perpSin = Math.sin(perpAngle);

  const perpComponent = toMid.x * perpCos + toMid.y * perpSin;
  const alongComponent = toMid.x * -perpSin + toMid.y * perpCos;

  const foldedPerp = perpComponent * (1 - cos);
  const foldedZ = perpComponent * sin;

  const finalOffset = {
    x: alongComponent * -perpSin + foldedPerp * perpCos,
    y: alongComponent * perpCos + foldedPerp * perpSin,
  };

  return {
    x: point.x + finalOffset.x,
    y: point.y + finalOffset.y - foldedZ * 0.3 * layerMultiplier,
  };
}

function getSide(line: LineSegment, point: Point): number {
  const { start, end } = line;
  const cross =
    (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
  if (cross > 1e-9) return 1;
  if (cross < -1e-9) return -1;
  return 0;
}

function applyFoldsToPoint(
  point: Point,
  allSteps: FoldStep[],
  lines: LineSegment[],
  state: FoldTransformState,
  layerMultiplier: number = 1
): Point {
  let result = { ...point };
  for (let i = 0; i <= state.stepIndex; i++) {
    const step = allSteps[i];
    if (!step || step.lineIds.length === 0) continue;
    const progress = i === state.stepIndex ? state.progress : 1;
    for (const lineId of step.lineIds) {
      const line = lines.find((l) => l.id === lineId);
      if (!line) continue;
      result = computeFoldedPoint(result, line, step.foldAngle, progress, layerMultiplier);
    }
  }
  return result;
}

function getStepFoldDepth(
  step: FoldStep,
  lines: LineSegment[],
  progress: number,
  paper: { origin: Point; width: number; height: number },
  layerMultiplier: number = 1
): number {
  let maxOffset = 0;
  for (const lineId of step.lineIds) {
    const line = lines.find((l) => l.id === lineId);
    if (!line) continue;
    const corners = [
      paper.origin,
      { x: paper.origin.x + paper.width, y: paper.origin.y },
      { x: paper.origin.x + paper.width, y: paper.origin.y + paper.height },
      { x: paper.origin.x, y: paper.origin.y + paper.height },
    ];
    for (const corner of corners) {
      const folded = computeFoldedPoint(corner, line, step.foldAngle, progress, layerMultiplier);
      const dx = folded.x - corner.x;
      const dy = folded.y - corner.y;
      maxOffset = Math.max(maxOffset, Math.sqrt(dx * dx + dy * dy));
    }
  }
  return maxOffset;
}

const RISK_BADGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  low: { label: '低风险', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  medium: { label: '中风险', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  high: { label: '高风险', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  critical: { label: '严重', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

export function FoldPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getProject,
    loadProjects,
    setActiveMaterialConfig,
    getActiveMaterialConfig,
    analyzeActiveMaterial,
    exportProject,
  } = useProjectStore();
  const project = id ? getProject(id) : null;

  const materialConfigs = project?.materialConfigs ?? [];
  const activeMaterial = id ? getActiveMaterialConfig(id) : null;
  const activeAnalysis: MaterialAnalysisResult | null = useMemo(() => {
    if (!project || !id) return null;
    return analyzeActiveMaterial(id);
  }, [project, id, activeMaterial?.id]);

  const visualEffects = activeAnalysis?.materialEffects;
  const effectiveFoldSteps = activeAnalysis?.recommendedFoldOrder ?? project?.foldSteps ?? [];

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showMaterialInfo, setShowMaterialInfo] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!project) return;
    setCurrentStep(0);
    setAnimationProgress(0);
  }, [project?.id]);

  useEffect(() => {
    setCurrentStep(0);
    setAnimationProgress(0);
  }, [activeMaterial?.id]);

  useEffect(() => {
    if (!isPlaying || !effectiveFoldSteps.length) return;

    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        const next = prev + 0.015 * speed;
        if (next >= 1) {
          if (currentStep < effectiveFoldSteps.length - 1) {
            setCurrentStep((s) => s + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 1;
          }
        }
        return next;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, effectiveFoldSteps.length, speed]);

  const transformState: FoldTransformState = {
    stepIndex: currentStep,
    progress: animationProgress,
  };

  const currentStepData = effectiveFoldSteps[currentStep];
  const highlightedLineIds = useMemo(() => currentStepData?.lineIds || [], [currentStepData]);

  const layerMultiplier = visualEffects?.layerOffsetMultiplier ?? 1;

  const paperCorners = useMemo(() => {
    if (!project) return [];
    const { origin, width, height } = project.paper;
    return [
      origin,
      { x: origin.x + width, y: origin.y },
      { x: origin.x + width, y: origin.y + height },
      { x: origin.x, y: origin.y + height },
    ];
  }, [project?.paper]);

  const foldedCorners = useMemo(() => {
    if (!project) return [];
    return paperCorners.map((p) =>
      applyFoldsToPoint(p, effectiveFoldSteps, project.lines, transformState, layerMultiplier)
    );
  }, [paperCorners, effectiveFoldSteps, project?.lines, transformState, layerMultiplier]);

  const foldedPaperPath = useMemo(() => {
    return foldedCorners.map((p) => `${p.x},${p.y}`).join(' ');
  }, [foldedCorners]);

  const foldedLines = useMemo(() => {
    if (!project) return [];
    return project.lines.map((line) => {
      const isCurrent = highlightedLineIds.includes(line.id);
      return {
        ...line,
        isCurrent,
        foldedStart: applyFoldsToPoint(
          line.start,
          effectiveFoldSteps,
          project.lines,
          transformState,
          layerMultiplier
        ),
        foldedEnd: applyFoldsToPoint(
          line.end,
          effectiveFoldSteps,
          project.lines,
          transformState,
          layerMultiplier
        ),
      };
    });
  }, [project?.lines, effectiveFoldSteps, transformState, highlightedLineIds, layerMultiplier]);

  const currentStepLayerOffset = useMemo(() => {
    if (!currentStepData || !project) return 0;
    return getStepFoldDepth(
      currentStepData,
      project.lines,
      animationProgress,
      project.paper,
      layerMultiplier
    );
  }, [currentStepData, project?.lines, animationProgress, project?.paper, layerMultiplier]);

  if (!project) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">未找到该方案</p>
          <button
            onClick={() => navigate('/projects')}
            className="text-amber-600 hover:text-amber-700"
          >
            返回方案列表
          </button>
        </div>
      </div>
    );
  }

  const svgSize = 550;
  const paperMaxSize = Math.max(project.paper.width, project.paper.height);
  const scale = (svgSize - 120) / paperMaxSize;
  const offsetX = (svgSize - project.paper.width * scale) / 2 - project.paper.origin.x * scale;
  const offsetY = (svgSize - project.paper.height * scale) / 2 - project.paper.origin.y * scale;

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAnimationProgress(1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < effectiveFoldSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAnimationProgress(0);
    }
  };

  const handlePlayPause = () => {
    if (currentStep >= effectiveFoldSteps.length - 1 && animationProgress >= 1) {
      setCurrentStep(0);
      setAnimationProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnimationProgress(0);
    setIsPlaying(false);
  };

  const completedSteps = currentStep + (animationProgress >= 1 ? 1 : 0);
  const totalProgress =
    effectiveFoldSteps.length > 0
      ? (currentStep + animationProgress) / effectiveFoldSteps.length
      : 0;

  const shadowOpacity = visualEffects?.shadowIntensity ?? 0.08;
  const lineThicknessMultiplier = visualEffects?.lineThicknessMultiplier ?? 1;
  const transparency = visualEffects?.transparency ?? 1;
  const textureOpacity = visualEffects?.textureOpacity ?? 0.05;
  const foldRounding = visualEffects?.foldRounding ?? 2;

  const handleMaterialSelect = (configId: string | null) => {
    if (id) {
      setActiveMaterialConfig(id, configId);
    }
  };

  const handleExport = () => {
    if (!project) return;
    const json = exportProject(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-${activeMaterial?.name ?? 'preview'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const riskConfig = activeAnalysis ? RISK_BADGE_CONFIG[activeAnalysis.overallRiskLevel] : null;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="w-10 h-10 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-serif font-medium text-stone-800">
                {project.name}
              </h1>
              <p className="text-sm text-stone-400">
                折叠步骤预览 · {effectiveFoldSteps.length} 步 · 复杂度 {project.complexity}
                {activeMaterial && (
                  <span className="ml-2 text-amber-600">· {activeMaterial.name}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="h-9 px-3 rounded-lg border border-stone-200 text-stone-600 text-xs hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={() => setShowWireframe(!showWireframe)}
              className={`h-9 px-3 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                showWireframe
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              线框
            </button>
            <button
              onClick={() => setShowMaterialInfo(!showMaterialInfo)}
              className={`h-9 px-3 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                showMaterialInfo
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              材质效果
            </button>
            <button
              onClick={() => navigate('/')}
              className="h-9 px-4 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
            >
              继续编辑
            </button>
          </div>
        </div>

        {materialConfigs.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 pb-3 flex items-center gap-2 flex-wrap border-t border-stone-100 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 mr-2">
              <Palette className="w-3.5 h-3.5" />
              切换材质:
            </div>
            {materialConfigs.map((config: PaperMaterialConfig) => {
              const isActive = config.id === activeMaterial?.id;
              return (
                <button
                  key={config.id}
                  onClick={() => handleMaterialSelect(config.id)}
                  className={`h-8 px-2.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-sm'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-stone-200"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="max-w-[100px] truncate">{config.name}</span>
                  {isActive && activeAnalysis && (
                    <span className={`text-[9px] px-1 py-0.5 rounded-full ${riskConfig?.bg} ${riskConfig?.color}`}>
                      {activeAnalysis.overallSuccessRate}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="relative">
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="drop-shadow-xl"
              style={{ opacity: transparency }}
            >
              <defs>
                <filter id="fold-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="8"
                    floodOpacity={shadowOpacity}
                  />
                </filter>
                <filter id="current-highlight" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.4" />
                </filter>
                <linearGradient id="paper-gradient-custom" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={visualEffects?.paperHighlight ?? '#FFFAF0'} />
                  <stop offset="50%" stopColor={visualEffects?.paperColor ?? '#F5EFE0'} />
                  <stop offset="100%" stopColor={visualEffects?.paperShadow ?? '#EDE4D3'} />
                </linearGradient>
                <linearGradient id="fold-highlight-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFF8E7" />
                  <stop offset="100%" stopColor="#FDE68A" />
                </linearGradient>
                <filter id="texture-filter" x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" />
                  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0" />
                  <feComposite in2="SourceGraphic" operator="in" />
                </filter>
              </defs>

              <rect
                x={20}
                y={20}
                width={svgSize - 40}
                height={svgSize - 40}
                fill="#FAFAFA"
                stroke="#E7E5E4"
                strokeWidth="1"
                rx="12"
              />

              <g
                transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}
                filter="url(#fold-shadow)"
              >
                <polygon
                  points={foldedPaperPath}
                  fill="url(#paper-gradient-custom)"
                  stroke="#D4C9B8"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: showMaterialInfo ? undefined : undefined,
                    strokeMiterlimit: foldRounding > 4 ? 1 : 4,
                  }}
                />

                {showMaterialInfo && textureOpacity > 0 && (
                  <polygon
                    points={foldedPaperPath}
                    filter="url(#texture-filter)"
                    opacity={textureOpacity * 3}
                  />
                )}

                {showWireframe &&
                  foldedLines
                    .filter((l) => !l.isCurrent)
                    .map((line) => (
                      <line
                        key={line.id}
                        x1={line.foldedStart.x}
                        y1={line.foldedStart.y}
                        x2={line.foldedEnd.x}
                        y2={line.foldedEnd.y}
                        stroke={lineColors[line.type]}
                        strokeWidth={(line.type === 'cut' ? 1.5 : 1.2) * lineThicknessMultiplier}
                        strokeDasharray={lineDashArrays[line.type]}
                        strokeLinecap="round"
                        opacity={0.55 * transparency}
                      />
                    ))}

                {highlightedLineIds.map((lineId) => {
                  const line = project.lines.find((l) => l.id === lineId);
                  if (!line) return null;

                  const foldStep = currentStepData;
                  const foldAngle = foldStep?.foldAngle ?? 0;
                  const isMountain = line.type === 'mountain';
                  const sign = isMountain ? 1 : -1;
                  void sign;
                  void foldAngle;

                  const foldedStart = applyFoldsToPoint(
                    line.start,
                    effectiveFoldSteps,
                    project.lines,
                    transformState,
                    layerMultiplier
                  );
                  const foldedEnd = applyFoldsToPoint(
                    line.end,
                    effectiveFoldSteps,
                    project.lines,
                    transformState,
                    layerMultiplier
                  );

                  const glowOpacity = 0.3 + animationProgress * 0.5;
                  const lineThickness = (2.5 + animationProgress * 1.5) * lineThicknessMultiplier;

                  return (
                    <g key={`highlight-${lineId}`} filter="url(#current-highlight)">
                      <line
                        x1={foldedStart.x}
                        y1={foldedStart.y}
                        x2={foldedEnd.x}
                        y2={foldedEnd.y}
                        stroke={lineColors[line.type]}
                        strokeWidth={lineThickness + 6}
                        strokeLinecap="round"
                        opacity={glowOpacity * 0.3}
                      />
                      <line
                        x1={foldedStart.x}
                        y1={foldedStart.y}
                        x2={foldedEnd.x}
                        y2={foldedEnd.y}
                        stroke={lineColors[line.type]}
                        strokeWidth={lineThickness}
                        strokeDasharray={lineDashArrays[line.type]}
                        strokeLinecap="round"
                        opacity={0.6 + animationProgress * 0.4}
                      />

                      {animationProgress > 0.1 && (
                        <g opacity={animationProgress}>
                          <circle
                            cx={foldedStart.x}
                            cy={foldedStart.y}
                            r={5 * animationProgress * lineThicknessMultiplier}
                            fill={lineColors[line.type]}
                            opacity={0.6}
                          />
                          <circle
                            cx={foldedEnd.x}
                            cy={foldedEnd.y}
                            r={5 * animationProgress * lineThicknessMultiplier}
                            fill={lineColors[line.type]}
                            opacity={0.6}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}

                {animationProgress > 0.2 && highlightedLineIds.length > 0 && (
                  <g opacity={(animationProgress - 0.2) * 1.4}>
                    <text
                      x={project.paper.origin.x + project.paper.width / 2}
                      y={project.paper.origin.y - 30}
                      textAnchor="middle"
                      fontSize="12"
                      fill={
                        currentStepData?.foldAngle && currentStepData.foldAngle >= 0
                          ? '#DC2626'
                          : '#2563EB'
                      }
                      fontWeight="600"
                    >
                      {currentStepData?.foldAngle && currentStepData.foldAngle >= 0 ? '▲ ' : '▼ '}
                      {Math.abs(currentStepData?.foldAngle ?? 0)}°
                    </text>
                  </g>
                )}
              </g>
            </svg>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <div className="text-sm text-stone-500">
                步骤 {currentStep + 1} / {effectiveFoldSteps.length}
              </div>
              <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-75"
                  style={{ width: `${totalProgress * 100}%` }}
                />
              </div>
              <div className="text-sm text-stone-400">
                {Math.round(totalProgress * 100)}%
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6 text-xs text-stone-400 flex-wrap justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: lineColors.mountain }} />
              <span>山折线 (向上)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: lineColors.valley }} />
              <span>谷折线 (向下)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: lineColors.cut }} />
              <span>剪口线</span>
            </div>
            {currentStepLayerOffset > 1 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <Layers className="w-3 h-3" />
                <span>层偏移 {currentStepLayerOffset.toFixed(1)}px</span>
              </div>
            )}
            {activeAnalysis && (
              <div className={`flex items-center gap-1.5 ${activeAnalysis.foldDifficultyColor}`}>
                <Target className="w-3 h-3" />
                <span>难度 {activeAnalysis.foldDifficultyLabel}</span>
              </div>
            )}
          </div>

          {activeAnalysis && showMaterialInfo && (
            <div className="mt-6 flex items-center gap-3 flex-wrap justify-center max-w-2xl">
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs ${riskConfig?.bg} ${riskConfig?.border} ${riskConfig?.color}`}>
                {activeAnalysis.overallRiskLevel === 'low' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">{riskConfig?.label}</span>
                <span className="opacity-70">· 成功率 {activeAnalysis.overallSuccessRate}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg border bg-stone-50 border-stone-200 text-stone-600 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{PROCESSING_METHOD_LABELS[activeMaterial!.processingMethod]}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg border bg-stone-50 border-stone-200 text-stone-600 flex items-center gap-1.5 text-xs">
                <Palette className="w-3.5 h-3.5" />
                <span>{MATERIAL_TYPE_LABELS[activeMaterial!.materialType]}</span>
                <span className="opacity-60">· {activeMaterial!.thicknessMm}mm</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg border bg-stone-50 border-stone-200 text-stone-600 flex items-center gap-1.5 text-xs">
                <GaugeCustom className="w-3.5 h-3.5" />
                <span>调整复杂度 {activeAnalysis.adjustedComplexity.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 bg-white border-l border-stone-200 flex flex-col">
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-stone-700">当前步骤</h3>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {completedSteps} / {effectiveFoldSteps.length} 完成
              </span>
            </div>
            <div className="text-2xl font-serif font-semibold text-stone-800">
              第 {currentStep + 1} 步
            </div>
            {currentStepData?.description.includes('[材质优化排序]') && (
              <div className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                已根据材质优化顺序
              </div>
            )}
          </div>

          {currentStepData && (
            <div className="p-4 border-b border-stone-100 bg-gradient-to-b from-amber-50 to-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  {currentStepData.foldAngle >= 0 ? (
                    <ChevronUp className="w-5 h-5 text-amber-700" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 mb-1">
                    {currentStepData.description.replace(' [材质优化排序]', '')}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded border border-stone-200 text-stone-600">
                      角度
                      <span className="font-medium text-amber-700">
                        {Math.abs(currentStepData.foldAngle)}°
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded border border-stone-200 text-stone-600">
                      <Layers className="w-3 h-3" />
                      P{currentStepData.priority}
                    </span>
                    {currentStepData.linkedLineIds.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded border border-purple-200 text-purple-700">
                        <Link2 className="w-3 h-3" />
                        联动 {currentStepData.linkedLineIds.length + 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {effectiveFoldSteps.map((step, index) => (
              <div
                key={step.step + '-' + index}
                className={`
                  p-3 border-b border-stone-50 cursor-pointer transition-all
                  ${index === currentStep
                    ? 'bg-amber-50 border-l-4 border-l-amber-400 shadow-sm'
                    : index < currentStep
                    ? 'bg-stone-50/50 opacity-60 border-l-4 border-l-green-300'
                    : 'hover:bg-stone-50 border-l-4 border-l-transparent'
                  }
                `}
                onClick={() => {
                  setCurrentStep(index);
                  setAnimationProgress(0);
                  setIsPlaying(false);
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5
                      ${index === currentStep
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : index < currentStep
                        ? 'bg-green-100 text-green-600'
                        : 'bg-stone-100 text-stone-400'
                      }
                    `}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {step.description.replace(' [材质优化排序]', '')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-stone-400">
                        {step.lineIds.length} 条折痕
                      </span>
                      {step.description.includes('[材质优化排序]') && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          材质优化
                        </span>
                      )}
                      {step.priority > 0 && (
                        <span className="text-[10px] text-amber-500">
                          · P{step.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-stone-100 space-y-4">
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={handleRestart}
                className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
                title="重新开始"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-colors
                  ${currentStep > 0
                    ? 'hover:bg-stone-100 text-stone-600'
                    : 'text-stone-300 cursor-not-allowed'
                  }
                `}
                title="上一步"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 mx-1 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentStep >= effectiveFoldSteps.length - 1}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-colors
                  ${currentStep < effectiveFoldSteps.length - 1
                    ? 'hover:bg-stone-100 text-stone-600'
                    : 'text-stone-300 cursor-not-allowed'
                  }
                `}
                title="下一步"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setCurrentStep(effectiveFoldSteps.length - 1);
                  setAnimationProgress(1);
                  setIsPlaying(false);
                }}
                className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
                title="跳到最后"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span>播放速度</span>
                <span className="font-medium text-stone-700">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="4"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-100 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GaugeCustom({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 14l4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}
