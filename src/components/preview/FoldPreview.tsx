import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PaperLayer } from '@/components/canvas/PaperLayer';
import { LineRenderer } from '@/components/canvas/LineRenderer';
import { lineColors, lineDashArrays } from '@/components/canvas/lineStyles';

export function FoldPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, loadProjects } = useProjectStore();
  const project = id ? getProject(id) : null;

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!project) return;
    setCurrentStep(0);
    setAnimationProgress(0);
  }, [project?.id]);

  useEffect(() => {
    if (!isPlaying || !project) return;

    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        const next = prev + 0.02 * speed;
        if (next >= 1) {
          if (currentStep < project.foldSteps.length - 1) {
            setCurrentStep((s) => s + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 1;
          }
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, project, speed]);

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

  const currentStepData = project.foldSteps[currentStep];
  const highlightedLineIds = currentStepData?.lineIds || [];

  const svgSize = 500;
  const paperMaxSize = Math.max(project.paper.width, project.paper.height);
  const scale = (svgSize - 80) / paperMaxSize;
  const offsetX = (svgSize - project.paper.width * scale) / 2 - project.paper.origin.x * scale;
  const offsetY = (svgSize - project.paper.height * scale) / 2 - project.paper.origin.y * scale;

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAnimationProgress(1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < project.foldSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setAnimationProgress(0);
    }
  };

  const handlePlayPause = () => {
    if (currentStep >= project.foldSteps.length - 1 && animationProgress >= 1) {
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

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
              <p className="text-sm text-stone-400">折叠步骤预览</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="h-9 px-4 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
            >
              继续编辑
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="relative">
            <svg
              width="500"
              height="500"
              viewBox="0 0 500 500"
              className="drop-shadow-lg"
            >
              <defs>
                <filter id="preview-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="8" dy="8" stdDeviation="10" floodOpacity="0.1" />
                </filter>
              </defs>

              <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`} filter="url(#preview-shadow)">
                <PaperLayer paper={project.paper} />

                <LineRenderer
                  lines={project.lines.filter((l) => !highlightedLineIds.includes(l.id))}
                  selectedIds={[]}
                  errorIds={[]}
                  highlightIds={[]}
                />

                {highlightedLineIds.map((lineId) => {
                  const line = project.lines.find((l) => l.id === lineId);
                  if (!line) return null;

                  const foldOffset = animationProgress * 20;
                  const isMountain = line.type === 'mountain';
                  const offsetY = isMountain ? -foldOffset : foldOffset;

                  return (
                    <g key={lineId}>
                      <line
                        x1={line.start.x}
                        y1={line.start.y}
                        x2={line.end.x}
                        y2={line.end.y}
                        stroke={lineColors[line.type]}
                        strokeWidth={3}
                        strokeDasharray={lineDashArrays[line.type]}
                        strokeLinecap="round"
                        opacity={0.3 + animationProgress * 0.7}
                        style={{
                          transform: `translateY(${offsetY}px)`,
                          transformOrigin: `${(line.start.x + line.end.x) / 2}px ${(line.start.y + line.end.y) / 2}px`,
                        }}
                      />

                      {animationProgress > 0.5 && (
                        <g opacity={(animationProgress - 0.5) * 2}>
                          <path
                            d={`M ${line.start.x} ${line.start.y} 
                                Q ${(line.start.x + line.end.x) / 2} ${line.start.y + offsetY * 1.5}
                                  ${line.end.x} ${line.end.y}`}
                            fill="none"
                            stroke={lineColors[line.type]}
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            opacity="0.5"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-stone-400">
              步骤 {currentStep + 1} / {project.foldSteps.length}
            </div>
          </div>
        </div>

        <div className="w-80 bg-white border-l border-stone-200 flex flex-col">
          <div className="p-4 border-b border-stone-100">
            <h3 className="font-medium text-stone-700 mb-1">当前步骤</h3>
            <div className="text-sm text-stone-500">
              第 {currentStep + 1} 步 · 共 {project.foldSteps.length} 步
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {project.foldSteps.map((step, index) => (
              <div
                key={step.step}
                className={`
                  p-4 border-b border-stone-50 cursor-pointer transition-colors
                  ${index === currentStep
                    ? 'bg-amber-50 border-l-4 border-l-amber-400'
                    : index < currentStep
                    ? 'bg-stone-50 opacity-60'
                    : 'hover:bg-stone-50'
                  }
                `}
                onClick={() => {
                  setCurrentStep(index);
                  setAnimationProgress(0);
                  setIsPlaying(false);
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
                      ${index === currentStep
                        ? 'bg-amber-500 text-white'
                        : index < currentStep
                        ? 'bg-green-100 text-green-600'
                        : 'bg-stone-100 text-stone-400'
                      }
                    `}
                  >
                    {index < currentStep ? '✓' : step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700">{step.description}</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {step.lineIds.length} 条折痕
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-stone-100 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleRestart}
                className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
                title="重新开始"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${currentStep > 0
                    ? 'hover:bg-stone-100 text-stone-600'
                    : 'text-stone-300 cursor-not-allowed'
                  }
                `}
                title="上一步"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentStep >= project.foldSteps.length - 1}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${currentStep < project.foldSteps.length - 1
                    ? 'hover:bg-stone-100 text-stone-600'
                    : 'text-stone-300 cursor-not-allowed'
                  }
                `}
                title="下一步"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  setCurrentStep(project.foldSteps.length - 1);
                  setAnimationProgress(1);
                  setIsPlaying(false);
                }}
                className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
                title="跳到最后"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span>速度</span>
                <span>{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-100 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-75"
                style={{
                  width: `${((currentStep + animationProgress) / project.foldSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
