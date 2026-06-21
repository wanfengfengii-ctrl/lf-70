import { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import type {
  PaperMaterialType,
  TextureDirection,
  ProcessingMethod,
  TrialOptimizationTarget,
  BatchTrialConfig,
  TrialResult,
} from '@/types';
import { TRIAL_OPTIMIZATION_TARGET_LABELS } from '@/types';
import {
  MATERIAL_TYPE_LABELS,
  TEXTURE_DIRECTION_LABELS,
  PROCESSING_METHOD_LABELS,
  MATERIAL_PRESETS,
  createDefaultTrialConfig,
  estimateMaterialCost,
} from '@/utils/materialAnalysis';
import {
  FlaskConical,
  Play,
  Download,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  DollarSign,
  Crosshair,
  BarChart3,
  Zap,
  Trophy,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  RefreshCw,
  X,
  Settings2,
  Table,
  Layers,
} from 'lucide-react';

interface BatchTrialPanelProps {
  projectId: string;
}

const RISK_CONFIG = {
  low: { label: '低', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  medium: { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { label: '高', color: 'text-orange-600', bg: 'bg-orange-100' },
  critical: { label: '极高', color: 'text-red-600', bg: 'bg-red-100' },
};

const COST_CONFIG = {
  low: { label: '低成本', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  medium: { label: '中等成本', color: 'text-blue-600', bg: 'bg-blue-50' },
  high: { label: '较高成本', color: 'text-orange-600', bg: 'bg-orange-50' },
  very_high: { label: '高成本', color: 'text-red-600', bg: 'bg-red-50' },
};

const TARGET_CONFIG: Record<TrialOptimizationTarget, { icon: any; color: string; bg: string }> = {
  highest_success: { icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
  lowest_risk: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  lowest_cost: { icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
  best_precision: { icon: Crosshair, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export function BatchTrialPanel({ projectId }: BatchTrialPanelProps) {
  const project = useProjectStore((s) => s.getProject(projectId));
  const {
    createBatchTrial,
    getBatchTrialResults,
    deleteBatchTrial,
    applyTrialAsActive,
    reoptimizeBatchTrial,
    exportBatchTrial,
  } = useProjectStore();

  const trialResults = useMemo(() => getBatchTrialResults(projectId), [projectId, getBatchTrialResults]);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(
    trialResults.length > 0 ? trialResults[trialResults.length - 1].id : null
  );
  const [expandedTrialIds, setExpandedTrialIds] = useState<Set<string>>(new Set());
  const [showConfig, setShowConfig] = useState(trialResults.length === 0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [trialConfig, setTrialConfig] = useState<BatchTrialConfig>(() =>
    createDefaultTrialConfig('工艺试验配置')
  );
  const [optimizationTarget, setOptimizationTarget] = useState<TrialOptimizationTarget>('highest_success');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedTrial = trialResults.find((r) => r.id === selectedTrialId);

  const toggleMaterialType = (type: PaperMaterialType) => {
    setTrialConfig((prev) => ({
      ...prev,
      materialTypes: prev.materialTypes.includes(type)
        ? prev.materialTypes.filter((t) => t !== type)
        : [...prev.materialTypes, type],
    }));
  };

  const toggleTextureDirection = (dir: TextureDirection) => {
    setTrialConfig((prev) => ({
      ...prev,
      textureDirections: prev.textureDirections.includes(dir)
        ? prev.textureDirections.filter((d) => d !== dir)
        : [...prev.textureDirections, dir],
    }));
  };

  const toggleProcessingMethod = (method: ProcessingMethod) => {
    setTrialConfig((prev) => ({
      ...prev,
      processingMethods: prev.processingMethods.includes(method)
        ? prev.processingMethods.filter((m) => m !== method)
        : [...prev.processingMethods, method],
    }));
  };

  const handleRunTrial = async () => {
    if (trialConfig.materialTypes.length === 0) return;
    if (trialConfig.textureDirections.length === 0) return;
    if (trialConfig.processingMethods.length === 0) return;

    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 300));

    const result = createBatchTrial(projectId, trialConfig, optimizationTarget);
    if (result) {
      setSelectedTrialId(result.id);
      setShowConfig(false);
    }
    setIsGenerating(false);
  };

  const handleApplyTrial = (trialResultId: string) => {
    if (!selectedTrialId) return;
    const success = applyTrialAsActive(projectId, selectedTrialId, trialResultId);
    if (success) {
      // 可以添加成功提示
    }
  };

  const handleReoptimize = (newTarget: TrialOptimizationTarget) => {
    if (!selectedTrialId) return;
    const result = reoptimizeBatchTrial(projectId, selectedTrialId, newTarget);
    if (result) {
      setOptimizationTarget(newTarget);
    }
  };

  const handleExport = () => {
    if (!selectedTrialId) return;
    const data = exportBatchTrial(projectId, selectedTrialId);
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-trial-${project?.name ?? 'project'}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleTrialExpand = (id: string) => {
    setExpandedTrialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const estimatedCombinationCount = useMemo(() => {
    const thicknessSteps = Math.ceil(
      (trialConfig.thicknessRange.max - trialConfig.thicknessRange.min) / trialConfig.thicknessRange.step + 1
    );
    const toughnessSteps = Math.ceil(
      (trialConfig.toughnessRange.max - trialConfig.toughnessRange.min) / trialConfig.toughnessRange.step + 1
    );
    return (
      trialConfig.materialTypes.length *
      thicknessSteps *
      toughnessSteps *
      trialConfig.textureDirections.length *
      trialConfig.processingMethods.length
    );
  }, [trialConfig]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-stone-200 bg-stone-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-indigo-600" />
            <h3 className="font-medium text-stone-800 text-sm">批量工艺试验引擎</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-500"
              title={viewMode === 'cards' ? '表格视图' : '卡片视图'}
            >
              {viewMode === 'cards' ? <Table className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-1.5 rounded transition-colors ${
                showConfig ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-stone-100 text-stone-500'
              }`}
              title="试验配置"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="text-[10px] text-stone-500">
          自动生成多组工艺参数组合，智能筛选最优方案
        </div>
      </div>

      {showConfig && (
        <div className="p-3 border-b border-stone-200 bg-stone-50 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-stone-600 mb-2">
              优化目标
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(TRIAL_OPTIMIZATION_TARGET_LABELS) as TrialOptimizationTarget[]).map((target) => {
                const cfg = TARGET_CONFIG[target];
                const Icon = cfg.icon;
                return (
                  <button
                    key={target}
                    onClick={() => setOptimizationTarget(target)}
                    className={`p-2 rounded-lg border transition-all text-left ${
                      optimizationTarget === target
                        ? `${cfg.bg} border-indigo-300 ring-1 ring-indigo-300`
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className={`text-[11px] font-medium ${
                        optimizationTarget === target ? cfg.color : 'text-stone-600'
                      }`}>
                        {TRIAL_OPTIMIZATION_TARGET_LABELS[target]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-600 mb-2">
              纸张材质类型
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(MATERIAL_PRESETS) as PaperMaterialType[]).filter(t => t !== 'custom').map((type) => {
                const preset = MATERIAL_PRESETS[type];
                const selected = trialConfig.materialTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleMaterialType(type)}
                    className={`p-2 rounded-lg border transition-all text-left ${
                      selected
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded border border-stone-200 flex-shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className={`text-[11px] ${
                        selected ? 'text-indigo-700 font-medium' : 'text-stone-600'
                      }`}>
                        {MATERIAL_TYPE_LABELS[type]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1.5">
                厚度范围 (mm)
              </label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={trialConfig.thicknessRange.min}
                    onChange={(e) => setTrialConfig((prev) => ({
                      ...prev,
                      thicknessRange: { ...prev.thicknessRange, min: parseFloat(e.target.value) || 0 },
                    }))}
                    className="w-full px-2 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    step="0.01"
                    min="0.05"
                    max="0.5"
                  />
                  <span className="text-xs text-stone-400">~</span>
                  <input
                    type="number"
                    value={trialConfig.thicknessRange.max}
                    onChange={(e) => setTrialConfig((prev) => ({
                      ...prev,
                      thicknessRange: { ...prev.thicknessRange, max: parseFloat(e.target.value) || 0 },
                    }))}
                    className="w-full px-2 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    step="0.01"
                    min="0.05"
                    max="0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500">步长: {trialConfig.thicknessRange.step}mm</label>
                  <input
                    type="range"
                    value={trialConfig.thicknessRange.step}
                    onChange={(e) => setTrialConfig((prev) => ({
                      ...prev,
                      thicknessRange: { ...prev.thicknessRange, step: parseFloat(e.target.value) },
                    }))}
                    className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    min="0.01"
                    max="0.1"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 mb-1.5">
                韧性范围
              </label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={trialConfig.toughnessRange.min}
                    onChange={(e) => setTrialConfig((prev) => ({
                      ...prev,
                      toughnessRange: { ...prev.toughnessRange, min: parseInt(e.target.value) || 0 },
                    }))}
                    className="w-full px-2 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    min="10"
                    max="100"
                  />
                  <span className="text-xs text-stone-400">~</span>
                  <input
                    type="number"
                    value={trialConfig.toughnessRange.max}
                    onChange={(e) => setTrialConfig((prev) => ({
                      ...prev,
                      toughnessRange: { ...prev.toughnessRange, max: parseInt(e.target.value) || 0 },
                    }))}
                    className="w-full px-2 py-1 text-xs border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    min="10"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500">步长: {trialConfig.toughnessRange.step}</label>
                  <input
                    type="range"
                    value={trialConfig.toughnessRange.step}
                    onChange={(e) => setTrialConfig((prev) => ({
                      ...prev,
                      toughnessRange: { ...prev.toughnessRange, step: parseInt(e.target.value) },
                    }))}
                    className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    min="5"
                    max="30"
                    step="5"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-600 mb-2">
              纹理方向
            </label>
            <div className="flex gap-1.5">
              {(Object.keys(TEXTURE_DIRECTION_LABELS) as TextureDirection[]).map((dir) => {
                const selected = trialConfig.textureDirections.includes(dir);
                return (
                  <button
                    key={dir}
                    onClick={() => toggleTextureDirection(dir)}
                    className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] transition-all ${
                      selected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {TEXTURE_DIRECTION_LABELS[dir].split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-600 mb-2">
              加工方式
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(PROCESSING_METHOD_LABELS) as ProcessingMethod[]).map((method) => {
                const selected = trialConfig.processingMethods.includes(method);
                return (
                  <button
                    key={method}
                    onClick={() => toggleProcessingMethod(method)}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] transition-all ${
                      selected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {PROCESSING_METHOD_LABELS[method].replace('折叠', '')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-600 mb-1.5">
              最大试验数量: <span className="text-indigo-600">{trialConfig.maxTrialCount}</span>
              <span className="text-[10px] text-stone-400 ml-2">
                (预计生成 {estimatedCombinationCount} 组，将抽样 {Math.min(estimatedCombinationCount, trialConfig.maxTrialCount)} 组)
              </span>
            </label>
            <input
              type="range"
              value={trialConfig.maxTrialCount}
              onChange={(e) => setTrialConfig((prev) => ({
                ...prev,
                maxTrialCount: parseInt(e.target.value),
              }))}
              className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
              min="6"
              max="36"
              step="6"
            />
          </div>

          <button
            onClick={handleRunTrial}
            disabled={isGenerating || trialConfig.materialTypes.length === 0}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                正在生成试验方案...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                开始批量试验
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {trialResults.length > 0 && (
          <div className="p-3 border-b border-stone-100">
            <label className="block text-[11px] font-medium text-stone-600 mb-2">
              历史试验记录
            </label>
            <div className="space-y-1.5">
              {[...trialResults].reverse().map((result) => {
                const isSelected = result.id === selectedTrialId;
                const targetCfg = TARGET_CONFIG[result.optimizationTarget];
                const TargetIcon = targetCfg.icon;
                return (
                  <div
                    key={result.id}
                    className={`rounded-lg border transition-all ${
                      isSelected ? 'border-indigo-400 bg-indigo-50/40' : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedTrialId(result.id)}
                      className="w-full p-2.5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${targetCfg.bg}`}>
                            <TargetIcon className={`w-3.5 h-3.5 ${targetCfg.color}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-stone-700">
                              {result.config.name}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {TRIAL_OPTIMIZATION_TARGET_LABELS[result.optimizationTarget]} · {result.trials.length} 组方案
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBatchTrial(projectId, result.id);
                            if (selectedTrialId === result.id) {
                              setSelectedTrialId(null);
                            }
                          }}
                          className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTrial && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-stone-600 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                试验结果 - 按 {TRIAL_OPTIMIZATION_TARGET_LABELS[selectedTrial.optimizationTarget]} 排序
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExport}
                  className="p-1.5 rounded hover:bg-stone-100 text-stone-500"
                  title="导出结果"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[10px] text-stone-500 mb-1.5">切换优化目标重新排序</label>
              <div className="flex gap-1 flex-wrap">
                {(Object.keys(TRIAL_OPTIMIZATION_TARGET_LABELS) as TrialOptimizationTarget[]).map((target) => {
                  const cfg = TARGET_CONFIG[target];
                  const Icon = cfg.icon;
                  const isActive = selectedTrial.optimizationTarget === target;
                  return (
                    <button
                      key={target}
                      onClick={() => handleReoptimize(target)}
                      className={`px-2 py-1 rounded-full text-[10px] flex items-center gap-1 transition-all ${
                        isActive
                          ? `${cfg.bg} ${cfg.color} font-medium`
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {TRIAL_OPTIMIZATION_TARGET_LABELS[target]}
                    </button>
                  );
                })}
              </div>
            </div>

            {viewMode === 'cards' ? (
              <div className="space-y-2">
                {selectedTrial.trials.map((trial) => (
                  <TrialCard
                    key={trial.id}
                    trial={trial}
                    expanded={expandedTrialIds.has(trial.id)}
                    onToggle={() => toggleTrialExpand(trial.id)}
                    onApply={() => handleApplyTrial(trial.id)}
                  />
                ))}
              </div>
            ) : (
              <TrialTable
                trials={selectedTrial.trials}
                onApply={handleApplyTrial}
                expandedTrialIds={expandedTrialIds}
                onToggleExpand={toggleTrialExpand}
              />
            )}
          </div>
        )}

        {!selectedTrial && trialResults.length === 0 && !showConfig && (
          <div className="p-8 text-center">
            <FlaskConical className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500 mb-3">暂无批量试验记录</p>
            <button
              onClick={() => setShowConfig(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              创建首次试验
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TrialCard({
  trial,
  expanded,
  onToggle,
  onApply,
}: {
  trial: TrialResult;
  expanded: boolean;
  onToggle: () => void;
  onApply: () => void;
}) {
  const riskCfg = RISK_CONFIG[trial.analysis.overallRiskLevel];
  const costEstimate = estimateMaterialCost(trial.materialConfig);
  const costCfg = COST_CONFIG[costEstimate.costLevel];

  return (
    <div className={`rounded-lg border overflow-hidden ${
      trial.isRecommended ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200 bg-white'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-3 text-left"
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            trial.isRecommended ? 'bg-amber-400 text-white' : 'bg-stone-200 text-stone-600'
          }`}>
            {trial.isRecommended ? <Trophy className="w-4 h-4" /> : <span className="text-sm font-bold">#{trial.rank}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-stone-700 truncate">
                {trial.materialConfig.name}
              </span>
              {trial.isRecommended && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-medium">
                  推荐
                </span>
              )}
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-stone-400 ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-400 ml-auto" />
              )}
            </div>

            <div className="text-[10px] text-stone-500 mb-2">
              {MATERIAL_TYPE_LABELS[trial.materialConfig.materialType]} · {trial.materialConfig.thicknessMm}mm · 韧性{trial.materialConfig.toughness}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <MetricBar
                label="成功率"
                value={trial.analysis.overallSuccessRate}
                max={100}
                color="emerald"
                unit="%"
              />
              <MetricBar
                label="可折叠性"
                value={trial.foldabilityScore}
                max={100}
                color="blue"
              />
              <MetricBar
                label="精密度"
                value={trial.precisionScore}
                max={100}
                color="purple"
              />
              <div>
                <div className="text-[9px] text-stone-500 mb-1">综合</div>
                <div className="text-sm font-bold text-indigo-600">{trial.overallScore}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${riskCfg.bg} ${riskCfg.color} font-medium`}>
                {riskCfg.label}风险
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${costCfg.bg} ${costCfg.color} font-medium`}>
                ¥{trial.costEstimate.toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-500">
                {PROCESSING_METHOD_LABELS[trial.materialConfig.processingMethod]}
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-stone-100">
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-stone-50 rounded">
                <div className="text-[10px] text-stone-500 mb-1">调整后复杂度</div>
                <div className="text-sm font-medium text-stone-700">{trial.analysis.adjustedComplexity.toFixed(1)}</div>
              </div>
              <div className="p-2 bg-stone-50 rounded">
                <div className="text-[10px] text-stone-500 mb-1">折叠难度</div>
                <div className="text-sm font-medium text-stone-700">{trial.analysis.foldDifficultyLabel}</div>
              </div>
              <div className="p-2 bg-stone-50 rounded">
                <div className="text-[10px] text-stone-500 mb-1">纹理方向</div>
                <div className="text-sm font-medium text-stone-700">
                  {TEXTURE_DIRECTION_LABELS[trial.materialConfig.textureDirection]}
                </div>
              </div>
              <div className="p-2 bg-stone-50 rounded">
                <div className="text-[10px] text-stone-500 mb-1">风险项</div>
                <div className="text-sm font-medium text-stone-700">
                  {trial.analysis.riskAssessments.length} 项
                  {trial.analysis.riskAssessments.some(r => r.severity === 'critical' || r.severity === 'high') && (
                    <span className="text-red-500 ml-1">!</span>
                  )}
                </div>
              </div>
            </div>

            {trial.analysis.recommendedFoldOrder.length > 0 && (
              <div className="p-2 bg-indigo-50 rounded">
                <div className="text-[10px] text-indigo-600 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  推荐折叠顺序已优化
                </div>
                <div className="text-[11px] text-stone-600">
                  共 {trial.analysis.recommendedFoldOrder.length} 步，已根据工艺参数调整
                </div>
              </div>
            )}

            <button
              onClick={onApply}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              应用此方案为当前正式配置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBar({
  label,
  value,
  max,
  color,
  unit = '',
}: {
  label: string;
  value: number;
  max: number;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
  unit?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <div>
      <div className="text-[9px] text-stone-500 mb-1">{label}</div>
      <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] font-medium text-stone-600 mt-0.5">
        {value}{unit}
      </div>
    </div>
  );
}

function TrialTable({
  trials,
  onApply,
  expandedTrialIds,
  onToggleExpand,
}: {
  trials: TrialResult[];
  onApply: (id: string) => void;
  expandedTrialIds: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-stone-200">
            <th className="text-left py-2 px-1.5 font-medium text-stone-500">#</th>
            <th className="text-left py-2 px-1.5 font-medium text-stone-500">材质</th>
            <th className="text-left py-2 px-1.5 font-medium text-stone-500">厚度</th>
            <th className="text-left py-2 px-1.5 font-medium text-stone-500">韧性</th>
            <th className="text-left py-2 px-1.5 font-medium text-stone-500">工艺</th>
            <th className="text-center py-2 px-1.5 font-medium text-stone-500">成功率</th>
            <th className="text-center py-2 px-1.5 font-medium text-stone-500">风险</th>
            <th className="text-center py-2 px-1.5 font-medium text-stone-500">成本</th>
            <th className="text-center py-2 px-1.5 font-medium text-stone-500">综合</th>
            <th className="text-center py-2 px-1.5 font-medium text-stone-500">操作</th>
          </tr>
        </thead>
        <tbody>
          {trials.map((trial) => {
            const riskCfg = RISK_CONFIG[trial.analysis.overallRiskLevel];
            const isExpanded = expandedTrialIds.has(trial.id);
            return (
              <>
                <tr
                  key={trial.id}
                  className={`border-b border-stone-100 hover:bg-stone-50 ${
                    trial.isRecommended ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <td className="py-2 px-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      trial.isRecommended ? 'bg-amber-400 text-white' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {trial.rank}
                    </div>
                  </td>
                  <td className="py-2 px-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded border border-stone-200"
                        style={{ backgroundColor: trial.materialConfig.color }}
                      />
                      <span className="text-stone-700">{MATERIAL_TYPE_LABELS[trial.materialConfig.materialType]}</span>
                    </div>
                  </td>
                  <td className="py-2 px-1.5 text-stone-600">{trial.materialConfig.thicknessMm}mm</td>
                  <td className="py-2 px-1.5 text-stone-600">{trial.materialConfig.toughness}</td>
                  <td className="py-2 px-1.5 text-stone-600">
                    {PROCESSING_METHOD_LABELS[trial.materialConfig.processingMethod]}
                  </td>
                  <td className="py-2 px-1.5 text-center">
                    <span className={`font-medium ${
                      trial.analysis.overallSuccessRate >= 80 ? 'text-emerald-600' :
                      trial.analysis.overallSuccessRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {trial.analysis.overallSuccessRate}%
                    </span>
                  </td>
                  <td className="py-2 px-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${riskCfg.bg} ${riskCfg.color} font-medium`}>
                      {riskCfg.label}
                    </span>
                  </td>
                  <td className="py-2 px-1.5 text-center text-stone-600">¥{trial.costEstimate.toFixed(1)}</td>
                  <td className="py-2 px-1.5 text-center">
                    <span className="font-bold text-indigo-600">{trial.overallScore}</span>
                  </td>
                  <td className="py-2 px-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onToggleExpand(trial.id)}
                        className="p-1 rounded hover:bg-stone-200 text-stone-500"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onApply(trial.id)}
                        className="p-1 rounded hover:bg-indigo-100 text-indigo-500"
                        title="应用方案"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-stone-50">
                    <td colSpan={10} className="py-3 px-4">
                      <div className="grid grid-cols-4 gap-3 text-[11px]">
                        <div>
                          <div className="text-stone-500 mb-1">可折叠性评分</div>
                          <div className="font-medium text-stone-700">{trial.foldabilityScore}</div>
                        </div>
                        <div>
                          <div className="text-stone-500 mb-1">精密度评分</div>
                          <div className="font-medium text-stone-700">{trial.precisionScore}</div>
                        </div>
                        <div>
                          <div className="text-stone-500 mb-1">调整后复杂度</div>
                          <div className="font-medium text-stone-700">{trial.analysis.adjustedComplexity.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-stone-500 mb-1">折叠难度</div>
                          <div className="font-medium text-stone-700">{trial.analysis.foldDifficultyLabel}</div>
                        </div>
                        <div>
                          <div className="text-stone-500 mb-1">纹理方向</div>
                          <div className="font-medium text-stone-700">
                            {TEXTURE_DIRECTION_LABELS[trial.materialConfig.textureDirection]}
                          </div>
                        </div>
                        <div>
                          <div className="text-stone-500 mb-1">风险项数量</div>
                          <div className="font-medium text-stone-700">{trial.analysis.riskAssessments.length} 项</div>
                        </div>
                        <div>
                          <div className="text-stone-500 mb-1">推荐折叠步骤</div>
                          <div className="font-medium text-stone-700">{trial.analysis.recommendedFoldOrder.length} 步</div>
                        </div>
                        <div>
                          <div className="text-stone-500 mb-1">材质颜色</div>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded border border-stone-200"
                              style={{ backgroundColor: trial.materialConfig.color }}
                            />
                            <span className="font-mono text-stone-700">{trial.materialConfig.color}</span>
                          </div>
                        </div>
                      </div>
                      {trial.analysis.specialTips.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-200">
                          <div className="text-stone-500 mb-2 text-[10px]">智能建议</div>
                          <div className="space-y-1">
                            {trial.analysis.specialTips.map((tip, idx) => (
                              <div key={idx} className="text-[11px] text-stone-600 flex items-start gap-1.5">
                                <AlertCircle className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                                {tip}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
