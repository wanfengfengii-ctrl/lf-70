import { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import type {
  PaperMaterialConfig,
  PaperMaterialType,
  TextureDirection,
  ProcessingMethod,
  RiskAssessment,
  MaterialAnalysisResult,
} from '@/types';
import {
  MATERIAL_PRESETS,
  MATERIAL_TYPE_LABELS,
  TEXTURE_DIRECTION_LABELS,
  PROCESSING_METHOD_LABELS,
  createMaterialFromPreset,
  getFoldDifficultyLevel,
} from '@/utils/materialAnalysis';
import {
  Layers,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckCircle,
  Trash2,
  Copy,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  BookOpen,
  Gauge,
  Target,
  ShieldCheck,
  Shuffle,
  Palette,
  Droplets,
  ScrollText,
} from 'lucide-react';
import { generateId } from '@/utils/geometry';

interface PaperMaterialPanelProps {
  projectId: string;
}

const RISK_SEVERITY_CONFIG = {
  low: {
    label: '低风险',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: ShieldCheck,
  },
  medium: {
    label: '中等风险',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertCircle,
  },
  high: {
    label: '高风险',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: AlertTriangle,
  },
  critical: {
    label: '严重风险',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: ShieldAlert,
  },
};

const RISK_TYPE_LABELS: Record<string, string> = {
  tear: '撕裂风险',
  crack: '开裂风险',
  layer_conflict: '层冲突',
  thickness_issue: '厚度问题',
  grain_mismatch: '纹理不匹配',
  spring_back: '折痕回弹',
  other: '其他',
};

export function PaperMaterialPanel({ projectId }: PaperMaterialPanelProps) {
  const project = useProjectStore((s) => s.getProject(projectId));
  const {
    addMaterialConfig,
    updateMaterialConfig,
    deleteMaterialConfig,
    setActiveMaterialConfig,
    analyzeActiveMaterial,
    analyzeMaterial,
    duplicateMaterialConfig,
  } = useProjectStore();

  const materialConfigs = project?.materialConfigs ?? [];
  const activeId = project?.activeMaterialConfigId ?? null;
  const activeConfig = materialConfigs.find((c) => c.id === activeId);

  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareConfigIds, setCompareConfigIds] = useState<string[]>([]);

  const analysis: MaterialAnalysisResult | null = useMemo(() => {
    if (!project || !activeConfig) return null;
    return analyzeActiveMaterial(projectId);
  }, [projectId, activeConfig, project]);

  const toggleRisk = (id: string) => {
    setExpandedRisks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFromPreset = (presetType: PaperMaterialType) => {
    const config = createMaterialFromPreset(
      presetType,
      `${project?.name ?? '项目'} - ${MATERIAL_TYPE_LABELS[presetType]}`
    );
    addMaterialConfig(projectId, config);
    setActiveMaterialConfig(projectId, config.id);
    setShowPresetMenu(false);
  };

  const handleDuplicate = (configId: string, name: string) => {
    duplicateMaterialConfig(projectId, configId, `${name} (副本)`);
  };

  const handleUpdate = (configId: string, updates: Partial<PaperMaterialConfig>) => {
    updateMaterialConfig(projectId, configId, updates);
  };

  const handleSelect = (configId: string) => {
    setActiveMaterialConfig(projectId, configId);
  };

  const MAX_COMPARE_COUNT = 4;

  const toggleCompare = (configId: string) => {
    setCompareConfigIds((prev) => {
      if (prev.includes(configId)) {
        return prev.filter((id) => id !== configId);
      }
      if (prev.length >= MAX_COMPARE_COUNT) {
        return prev;
      }
      return [...prev, configId];
    });
  };

  const comparisonResults = useMemo(() => {
    if (compareMode && compareConfigIds.length >= 2) {
      return compareConfigIds.map((id) => ({
        id,
        analysis: analyzeMaterial(projectId, id),
        config: materialConfigs.find((c) => c.id === id),
      })).filter((x) => x.analysis && x.config);
    }
    return [];
  }, [compareMode, compareConfigIds, projectId, materialConfigs]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-stone-200 bg-stone-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="font-medium text-stone-800 text-sm">纸张材质与工艺</h3>
          </div>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              compareMode
                ? 'bg-amber-100 text-amber-700'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-1">
              <Shuffle className="w-3 h-3" />
              对比{compareMode && compareConfigIds.length > 0 ? ` (${compareConfigIds.length}/${MAX_COMPARE_COUNT})` : ''}
            </span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="w-full p-2.5 rounded-lg border border-dashed border-stone-300 bg-white hover:border-amber-400 hover:bg-amber-50/30 transition-colors flex items-center justify-center gap-2 text-sm text-stone-600"
          >
            <Plus className="w-4 h-4" />
            新增材质配置 (从预设)
          </button>

          {showPresetMenu && (
            <div className="absolute z-40 top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden">
              {(Object.keys(MATERIAL_PRESETS) as PaperMaterialType[]).map((type) => {
                const preset = MATERIAL_PRESETS[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleCreateFromPreset(type)}
                    className="w-full p-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-stone-200 flex-shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-700">
                          {MATERIAL_TYPE_LABELS[type]}
                        </div>
                        <div className="text-[10px] text-stone-400 truncate">
                          {preset.thicknessMm}mm · 韧性{preset.toughness} · {PROCESSING_METHOD_LABELS[preset.processingMethod]}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2 border-b border-stone-100">
          {materialConfigs.length === 0 && (
            <div className="text-center py-8 text-stone-400 text-sm">
              暂无材质配置，请从上方添加
            </div>
          )}

          {materialConfigs.map((config) => {
            const isActive = config.id === activeId;
            const inCompare = compareMode && compareConfigIds.includes(config.id);
            return (
              <div
                key={config.id}
                className={`rounded-lg border transition-all ${
                  isActive
                    ? 'border-amber-400 bg-amber-50/40 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="p-2.5">
                  <div className="flex items-start gap-2">
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={inCompare}
                        onChange={() => toggleCompare(config.id)}
                        disabled={!inCompare && compareConfigIds.length >= MAX_COMPARE_COUNT}
                        className="mt-1 disabled:opacity-30"
                      />
                    )}
                    <button
                      onClick={() => !compareMode && handleSelect(config.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded border border-stone-200 flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-stone-700 truncate">
                              {config.name}
                            </span>
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                                使用中
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            {MATERIAL_TYPE_LABELS[config.materialType]} · {config.thicknessMm}mm
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(config.id, config.name)}
                        className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600"
                        title="复制配置"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMaterialConfig(projectId, config.id)}
                        className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-400"
                        title={
                          compareMode && compareConfigIds.includes(config.id)
                            ? '请先取消对比再删除'
                            : '删除配置'
                        }
                        disabled={materialConfigs.length <= 1 || (compareMode && compareConfigIds.includes(config.id))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {compareMode && comparisonResults.length >= 2 ? (
          <div className="p-3 border-b border-stone-100">
            <h4 className="text-xs font-medium text-stone-600 mb-3 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              材质对比结果
            </h4>
            <div className="space-y-2">
              {['foldabilityScore', 'adjustedComplexity', 'overallSuccessRate', 'riskCount'].map((key) => {
                const labelMap: Record<string, string> = {
                  foldabilityScore: '可折叠性评分',
                  adjustedComplexity: '调整后复杂度',
                  overallSuccessRate: '预计成功率',
                  riskCount: '风险项数量',
                };
                const higherIsBetter = key === 'foldabilityScore' || key === 'overallSuccessRate';
                const values = comparisonResults.map((r) => ({
                  ...r,
                  val: (r.analysis as any)?.[key] ?? (r as any)?.[key],
                }));
                const maxVal = Math.max(...values.map((v) => Number(v.val) || 0), 1);
                const minVal = Math.min(...values.map((v) => Number(v.val) || 0));
                return (
                  <div key={key} className="p-2 bg-stone-50 rounded-lg">
                    <div className="text-[10px] text-stone-500 mb-1.5">
                      {labelMap[key]}
                    </div>
                    <div className="space-y-1">
                      {values.map((v) => {
                        const isBest = higherIsBetter
                          ? Number(v.val) === maxVal
                          : Number(v.val) === minVal;
                        const pct = key === 'overallSuccessRate'
                          ? Number(v.val)
                          : key === 'adjustedComplexity'
                          ? Math.min(100, Number(v.val))
                          : (Number(v.val) / Math.max(maxVal, 1)) * 100;
                        return (
                          <div key={v.id} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded flex-shrink-0 border border-stone-200"
                              style={{ backgroundColor: v.config?.color }}
                            />
                            <div className="flex-1 h-4 bg-white rounded border border-stone-200 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isBest ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-stone-300'
                                }`}
                                style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-medium w-10 text-right ${
                              isBest ? 'text-amber-700' : 'text-stone-500'
                            }`}>
                              {key === 'overallSuccessRate' ? `${v.val}%` :
                               typeof v.val === 'number' ? v.val.toFixed(1) : v.val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeConfig && analysis && !compareMode && (
          <div className="flex-1 p-3 space-y-4">
            <div>
              <h4 className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                材质参数配置
              </h4>
              <div className="space-y-3 bg-stone-50 rounded-lg p-3">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">配置名称</label>
                  <input
                    type="text"
                    value={activeConfig.name}
                    onChange={(e) => handleUpdate(activeConfig.id, { name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">
                    纸张厚度: <span className="font-medium text-stone-700">{activeConfig.thicknessMm}mm</span>
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.01"
                    value={activeConfig.thicknessMm}
                    onChange={(e) => handleUpdate(activeConfig.id, { thicknessMm: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                    <span>0.05mm 薄</span>
                    <span>0.5mm 厚</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">
                    韧性: <span className="font-medium text-stone-700">{activeConfig.toughness}/100</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={activeConfig.toughness}
                    onChange={(e) => handleUpdate(activeConfig.id, { toughness: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                    <span>易撕裂</span>
                    <span>高韧性</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">纹理方向</label>
                  <select
                    value={activeConfig.textureDirection}
                    onChange={(e) => handleUpdate(activeConfig.id, { textureDirection: e.target.value as TextureDirection })}
                    className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  >
                    {(Object.keys(TEXTURE_DIRECTION_LABELS) as TextureDirection[]).map((k) => (
                      <option key={k} value={k}>
                        {TEXTURE_DIRECTION_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">加工方式</label>
                  <select
                    value={activeConfig.processingMethod}
                    onChange={(e) => handleUpdate(activeConfig.id, { processingMethod: e.target.value as ProcessingMethod })}
                    className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  >
                    {(Object.keys(PROCESSING_METHOD_LABELS) as ProcessingMethod[]).map((k) => (
                      <option key={k} value={k}>
                        {PROCESSING_METHOD_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">材质颜色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeConfig.color ?? '#F5EFE0'}
                      onChange={(e) => handleUpdate(activeConfig.id, { color: e.target.value })}
                      className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={activeConfig.color ?? ''}
                      onChange={(e) => handleUpdate(activeConfig.id, { color: e.target.value })}
                      placeholder="#RRGGBB"
                      className="flex-1 px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">备注说明</label>
                  <textarea
                    value={activeConfig.customNotes ?? ''}
                    onChange={(e) => handleUpdate(activeConfig.id, { customNotes: e.target.value })}
                    rows={2}
                    placeholder="关于此材质的备注信息..."
                    className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 resize-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                折叠难度评估
              </h4>
              <div className="bg-stone-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">基础复杂度</span>
                  <span className="text-sm font-medium text-stone-700">{project?.complexity.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">材质调整后</span>
                  <span className={`text-sm font-bold ${analysis.foldDifficultyColor}`}>
                    {analysis.adjustedComplexity.toFixed(1)}
                    <span className="text-[10px] ml-1 opacity-70">
                      ({analysis.adjustedComplexity >= project!.complexity ? '+' : ''}
                      {(analysis.adjustedComplexity - project!.complexity).toFixed(1)})
                    </span>
                  </span>
                </div>
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-500">折叠难度</span>
                    <span className={`text-sm font-bold ${analysis.foldDifficultyColor}`}>
                      {analysis.foldDifficultyLabel} ({analysis.foldDifficulty.toFixed(0)}/100)
                    </span>
                  </div>
                  <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        analysis.foldDifficulty < 25
                          ? 'bg-emerald-500'
                          : analysis.foldDifficulty < 50
                          ? 'bg-green-500'
                          : analysis.foldDifficulty < 70
                          ? 'bg-yellow-500'
                          : analysis.foldDifficulty < 85
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, analysis.foldDifficulty)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-1 border-t border-stone-200 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      预计成功率
                    </span>
                    <span className={`text-sm font-bold ${
                      analysis.overallSuccessRate >= 80
                        ? 'text-emerald-600'
                        : analysis.overallSuccessRate >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {analysis.overallSuccessRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                风险评估 ({analysis.riskAssessments.length}项)
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] ${RISK_SEVERITY_CONFIG[analysis.overallRiskLevel].bg} ${RISK_SEVERITY_CONFIG[analysis.overallRiskLevel].color} border ${RISK_SEVERITY_CONFIG[analysis.overallRiskLevel].border}`}>
                  {RISK_SEVERITY_CONFIG[analysis.overallRiskLevel].label}
                </span>
              </h4>
              <div className="space-y-2">
                {analysis.riskAssessments.map((risk) => (
                  <RiskCard
                    key={risk.id}
                    risk={risk}
                    expanded={expandedRisks.has(risk.id)}
                    onToggle={() => toggleRisk(risk.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                智能建议
              </h4>
              <div className="space-y-1.5">
                {analysis.specialTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-stone-600 bg-blue-50/50 rounded-lg p-2 border border-blue-100/50">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {analysis.recommendedFoldOrder.length > 0 &&
             analysis.recommendedFoldOrder.some((s) => s.description.includes('[材质优化排序]')) && (
              <div>
                <h4 className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  材质优化的折叠顺序
                </h4>
                <div className="bg-stone-50 rounded-lg p-2.5 text-xs text-stone-500">
                  当前工艺配置已优化折叠顺序，在预览页查看具体步骤调整
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5" />
                视觉效果预览
              </h4>
              <div
                className="h-20 rounded-lg border border-stone-200 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${analysis.materialEffects.paperHighlight} 0%, ${analysis.materialEffects.paperColor} 50%, ${analysis.materialEffects.paperShadow} 100%)`,
                  opacity: analysis.materialEffects.transparency,
                  boxShadow: `0 4px 12px rgba(0,0,0,${analysis.materialEffects.shadowIntensity})`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-stone-700/70 bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    纸张视觉效果
                  </div>
                </div>
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent ${4 + analysis.materialEffects.foldRounding}px, rgba(0,0,0,0.03) ${4 + analysis.materialEffects.foldRounding}px, rgba(0,0,0,0.03) ${8 + analysis.materialEffects.foldRounding}px)`,
                    opacity: analysis.materialEffects.textureOpacity,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskCard({
  risk,
  expanded,
  onToggle,
}: {
  risk: RiskAssessment;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = RISK_SEVERITY_CONFIG[risk.severity];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full p-2.5 text-left flex items-start gap-2"
      >
        <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.color} bg-white/50`}>
              {RISK_TYPE_LABELS[risk.type] || '风险'}
            </span>
            <span className={`text-[10px] font-medium ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-stone-700 mt-1 leading-relaxed">
            {risk.message}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0 mt-1" />
        )}
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 pt-0 border-t border-white/60">
          <div className="flex items-start gap-1.5 mt-2 p-2 bg-white/60 rounded">
            <ScrollText className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] font-medium text-amber-700 mb-0.5">建议方案</div>
              <p className="text-xs text-stone-600 leading-relaxed">{risk.recommendation}</p>
            </div>
          </div>
          {risk.affectedLineIds && risk.affectedLineIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {risk.affectedLineIds.map((id) => (
                <span
                  key={id}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-stone-500 font-mono"
                >
                  #{id.slice(-4)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
