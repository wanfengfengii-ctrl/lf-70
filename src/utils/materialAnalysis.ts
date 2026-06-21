import type {
  PaperMaterialConfig,
  PaperMaterialType,
  TextureDirection,
  ProcessingMethod,
  MaterialAnalysisResult,
  MaterialVisualEffect,
  RiskAssessment,
  LineSegment,
  FoldStep,
  Point,
} from '@/types';
import { generateFoldSteps, calculateComplexity } from './complexity';
import { generateId } from './geometry';

export const MATERIAL_PRESETS: Record<PaperMaterialType, Omit<PaperMaterialConfig, 'id' | 'name' | 'createdAt' | 'updatedAt'>> = {
  kraft: {
    materialType: 'kraft',
    thicknessMm: 0.18,
    toughness: 75,
    textureDirection: 'grain_long',
    processingMethod: 'crease_fold',
    color: '#D4A574',
    customNotes: '标准牛皮纸，韧性好，适合基础折纸',
  },
  washi: {
    materialType: 'washi',
    thicknessMm: 0.12,
    toughness: 85,
    textureDirection: 'grain_long',
    processingMethod: 'wet_fold',
    color: '#F5E6D3',
    customNotes: '和纸，轻薄有韧性，适合精细折叠',
  },
  tant: {
    materialType: 'tant',
    thicknessMm: 0.15,
    toughness: 80,
    textureDirection: 'bidirectional',
    processingMethod: 'score_fold',
    color: '#E8D5C4',
    customNotes: 'TANT纸，两面双色，适合复杂模型',
  },
  lokta: {
    materialType: 'lokta',
    thicknessMm: 0.22,
    toughness: 90,
    textureDirection: 'grain_short',
    processingMethod: 'crease_fold',
    color: '#C4A77D',
    customNotes: '尼泊尔洛卡塔，天然纤维，高韧性',
  },
  foil: {
    materialType: 'foil',
    thicknessMm: 0.10,
    toughness: 50,
    textureDirection: 'bidirectional',
    processingMethod: 'dry_fold',
    color: '#D4D4D4',
    customNotes: '铝箔纸，易产生折痕记忆，但易撕裂',
  },
  tissue_foil: {
    materialType: 'tissue_foil',
    thicknessMm: 0.08,
    toughness: 70,
    textureDirection: 'bidirectional',
    processingMethod: 'mc_fold',
    color: '#C0C0C0',
    customNotes: '棉纸铝箔复合，适合复杂微型折叠',
  },
  elephant_hide: {
    materialType: 'elephant_hide',
    thicknessMm: 0.25,
    toughness: 95,
    textureDirection: 'bidirectional',
    processingMethod: 'wet_fold',
    color: '#B8956A',
    customNotes: '象皮纸，极高韧性，适合超复杂模型',
  },
  newsprint: {
    materialType: 'newsprint',
    thicknessMm: 0.07,
    toughness: 35,
    textureDirection: 'grain_long',
    processingMethod: 'dry_fold',
    color: '#EDE8D8',
    customNotes: '新闻纸，练习用，低韧性易破',
  },
  cardstock: {
    materialType: 'cardstock',
    thicknessMm: 0.35,
    toughness: 60,
    textureDirection: 'grain_short',
    processingMethod: 'score_fold',
    color: '#F0EAE0',
    customNotes: '卡片纸，厚度大，需压痕处理',
  },
  vellum: {
    materialType: 'vellum',
    thicknessMm: 0.09,
    toughness: 40,
    textureDirection: 'grain_long',
    processingMethod: 'dry_fold',
    color: '#FFF8F0',
    customNotes: '透明薄纸，半透明效果，精细操作',
  },
  custom: {
    materialType: 'custom',
    thicknessMm: 0.15,
    toughness: 60,
    textureDirection: 'grain_long',
    processingMethod: 'crease_fold',
    color: '#F5EFE0',
    customNotes: '自定义材质，可调整所有参数',
  },
};

export const MATERIAL_TYPE_LABELS: Record<PaperMaterialType, string> = {
  kraft: '牛皮纸',
  washi: '和纸',
  tant: 'TANT纸',
  lokta: '洛卡塔纸',
  foil: '铝箔纸',
  tissue_foil: '棉纸铝箔',
  elephant_hide: '象皮纸',
  newsprint: '新闻纸',
  cardstock: '卡片纸',
  vellum: '半透明纸',
  custom: '自定义',
};

export const TEXTURE_DIRECTION_LABELS: Record<TextureDirection, string> = {
  grain_long: '纵向纹理 (长边)',
  grain_short: '横向纹理 (短边)',
  bidirectional: '双向/无纹理',
};

export const PROCESSING_METHOD_LABELS: Record<ProcessingMethod, string> = {
  score_fold: '压痕折叠',
  wet_fold: '湿折法',
  dry_fold: '干折法',
  crease_fold: '预折痕折叠',
  mc_fold: 'MC复合折叠',
};

export function createDefaultMaterialConfig(): PaperMaterialConfig {
  const preset = MATERIAL_PRESETS.kraft;
  const now = Date.now();
  return {
    id: generateId(),
    name: '默认配置 - 牛皮纸',
    createdAt: now,
    updatedAt: now,
    ...preset,
  };
}

export function createMaterialFromPreset(
  type: PaperMaterialType,
  name?: string
): PaperMaterialConfig {
  const preset = MATERIAL_PRESETS[type];
  const now = Date.now();
  return {
    id: generateId(),
    name: name ?? `${MATERIAL_TYPE_LABELS[type]}配置`,
    createdAt: now,
    updatedAt: now,
    ...preset,
  };
}

export function getFoldDifficultyLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score < 25) return { label: '极易', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
  if (score < 50) return { label: '简单', color: 'text-green-700', bgColor: 'bg-green-100' };
  if (score < 70) return { label: '中等', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
  if (score < 85) return { label: '较难', color: 'text-orange-700', bgColor: 'bg-orange-100' };
  return { label: '极难', color: 'text-red-700', bgColor: 'bg-red-100' };
}

function getLineDirection(line: LineSegment): 'horizontal' | 'vertical' | 'diagonal' {
  const dx = Math.abs(line.end.x - line.start.x);
  const dy = Math.abs(line.end.y - line.start.y);
  if (dx < 2) return 'vertical';
  if (dy < 2) return 'horizontal';
  return 'diagonal';
}

function getLineAngle(line: LineSegment): number {
  return Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x);
}

function checkGrainMismatch(
  lines: LineSegment[],
  textureDirection: TextureDirection,
  paper: { width: number; height: number }
): LineSegment[] {
  const affected: LineSegment[] = [];
  if (textureDirection === 'bidirectional') return affected;

  for (const line of lines) {
    const angle = Math.abs(getLineAngle(line));
    const normalizedAngle = angle > Math.PI / 2 ? Math.PI - angle : angle;
    const dir = getLineDirection(line);

    let isGrainAligned = false;
    if (textureDirection === 'grain_long') {
      if (paper.width >= paper.height) {
        isGrainAligned = dir === 'horizontal' || normalizedAngle < Math.PI / 6;
      } else {
        isGrainAligned = dir === 'vertical' || normalizedAngle > Math.PI / 3;
      }
    } else {
      if (paper.width >= paper.height) {
        isGrainAligned = dir === 'vertical' || normalizedAngle > Math.PI / 3;
      } else {
        isGrainAligned = dir === 'horizontal' || normalizedAngle < Math.PI / 6;
      }
    }

    if (!isGrainAligned && dir === 'diagonal') {
      affected.push(line);
    }
  }
  return affected;
}

function countLayerOverlaps(lines: LineSegment[]): number {
  let overlaps = 0;
  const foldLines = lines.filter(l => l.type === 'mountain' || l.type === 'valley');
  for (let i = 0; i < foldLines.length; i++) {
    for (let j = i + 1; j < foldLines.length; j++) {
      const l1 = foldLines[i];
      const l2 = foldLines[j];
      const startDist = Math.sqrt(
        Math.pow(l1.start.x - l2.start.x, 2) + Math.pow(l1.start.y - l2.start.y, 2)
      );
      const endDist = Math.sqrt(
        Math.pow(l1.end.x - l2.end.x, 2) + Math.pow(l1.end.y - l2.end.y, 2)
      );
      if (startDist < 10 && endDist < 10) {
        overlaps++;
      }
    }
  }
  return overlaps;
}

export function analyzeMaterialForProject(
  material: PaperMaterialConfig,
  lines: LineSegment[],
  baseFoldSteps: FoldStep[],
  paper: { width: number; height: number; origin: Point },
  baseComplexity: number,
  isFoldable: boolean,
  conflictCount: number = 0
): MaterialAnalysisResult {
  const foldLines = lines.filter(l => l.type === 'mountain' || l.type === 'valley');
  const lineCount = foldLines.length;
  const mountainCount = foldLines.filter(l => l.type === 'mountain').length;
  const valleyCount = foldLines.filter(l => l.type === 'valley').length;

  const thicknessFactor = material.thicknessMm / 0.15;
  const toughnessFactor = (100 - material.toughness) / 100;
  const inverseToughness = 100 - material.toughness;

  let adjustedComplexity = baseComplexity;
  adjustedComplexity *= 1 + (thicknessFactor - 1) * 0.4;
  adjustedComplexity *= 1 + toughnessFactor * 0.25;

  switch (material.processingMethod) {
    case 'wet_fold':
      adjustedComplexity *= 1.1;
      break;
    case 'score_fold':
      adjustedComplexity *= 0.92;
      break;
    case 'crease_fold':
      adjustedComplexity *= 0.95;
      break;
    case 'mc_fold':
      adjustedComplexity *= 1.05;
      break;
    default:
      break;
  }

  const grainMismatchedLines = checkGrainMismatch(foldLines, material.textureDirection, paper);
  if (grainMismatchedLines.length > 0) {
    const mismatchRatio = grainMismatchedLines.length / Math.max(1, lineCount);
    adjustedComplexity *= 1 + mismatchRatio * 0.3;
  }

  adjustedComplexity = Math.round(adjustedComplexity * 10) / 10;

  let foldDifficulty = adjustedComplexity;
  foldDifficulty = Math.min(100, Math.max(0, foldDifficulty));
  const difficultyLevel = getFoldDifficultyLevel(foldDifficulty);

  const risks: RiskAssessment[] = [];

  const maxThicknessForFolds = 0.3;
  if (material.thicknessMm > maxThicknessForFolds && lineCount > 8) {
    const layerOverlaps = countLayerOverlaps(lines);
    risks.push({
      id: generateId(),
      type: 'thickness_issue',
      severity: material.thicknessMm > 0.4 ? 'critical' : layerOverlaps > 2 ? 'high' : 'medium',
      message: `纸张厚度 (${material.thicknessMm}mm) 与折痕数量不匹配，多层折叠处可能产生厚度堆积`,
      affectedLineIds: layerOverlaps > 0 ? foldLines.slice(0, 5).map(l => l.id) : undefined,
      recommendation: layerOverlaps > 0
        ? '建议使用压痕法(score_fold)提前处理多层叠加区域，或改用更薄的纸张'
        : '建议使用压痕法(score_fold)预处理折痕线',
    });
  }

  if (inverseToughness > 50 && lineCount > 6) {
    const acuteAngleLines = foldLines.filter(l => {
      const angle = Math.abs(l.foldAngle ?? (l.type === 'mountain' ? 90 : -90));
      return angle > 120;
    });
    if (acuteAngleLines.length > 0 || valleyCount > mountainCount) {
      risks.push({
        id: generateId(),
        type: 'tear',
        severity: inverseToughness > 70 ? 'critical' : inverseToughness > 55 ? 'high' : 'medium',
        message: `材质韧性较低 (${material.toughness}/100)，存在撕裂风险`,
        affectedLineIds: acuteAngleLines.length > 0 ? acuteAngleLines.map(l => l.id) : foldLines.slice(-3).map(l => l.id),
        recommendation: '建议采用湿折法(wet_fold)软化纸张，或改用韧性更高的材质如牛皮纸/象皮纸',
      });
    }
  }

  if (grainMismatchedLines.length > 0) {
    risks.push({
      id: generateId(),
      type: 'grain_mismatch',
      severity: grainMismatchedLines.length > lineCount * 0.4 ? 'high' : 'medium',
      message: `${grainMismatchedLines.length} 条折痕与纸张纹理方向不一致，可能产生裂纹或回弹`,
      affectedLineIds: grainMismatchedLines.map(l => l.id),
      recommendation: '调整纸张摆放方向或设置纹理方向为双向(bidirectional)',
    });
  }

  if (material.processingMethod === 'dry_fold' && baseComplexity > 25) {
    risks.push({
      id: generateId(),
      type: 'spring_back',
      severity: baseComplexity > 40 ? 'high' : 'medium',
      message: '干折法处理复杂设计时，折痕可能产生回弹，影响形状保持',
      recommendation: '建议改用预折痕折叠(crease_fold)或湿折法(wet_fold)以获得更稳定的折痕',
    });
  }

  if (conflictCount > 0) {
    risks.push({
      id: generateId(),
      type: 'layer_conflict',
      severity: conflictCount > 3 ? 'critical' : 'high',
      message: `检测到 ${conflictCount} 处设计冲突，配合当前材质可能加剧失败风险`,
      recommendation: '优先解决设计中的冲突问题，再考虑材质调整',
    });
  }

  if (material.thicknessMm < 0.1 && mountainCount > 5) {
    risks.push({
      id: generateId(),
      type: 'crack',
      severity: material.thicknessMm < 0.08 ? 'high' : 'medium',
      message: `纸张较薄 (${material.thicknessMm}mm)，多处山折可能导致表层开裂`,
      recommendation: '折叠时注意力度控制，可在折痕处轻微加湿以减少开裂',
    });
  }

  if (risks.length === 0 && isFoldable) {
    risks.push({
      id: generateId(),
      type: 'other',
      severity: 'low',
      message: '材质与设计兼容性良好，预计可顺利折叠',
      recommendation: '建议先进行小范围测试折叠以确认实际效果',
    });
  }

  const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
  const totalRiskScore = risks.reduce(
    (acc, r) => acc + severityWeight[r.severity],
    0
  );
  let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (risks.some(r => r.severity === 'critical')) {
    overallRiskLevel = 'critical';
  } else if (totalRiskScore >= 8) {
    overallRiskLevel = 'high';
  } else if (totalRiskScore >= 4) {
    overallRiskLevel = 'medium';
  } else {
    overallRiskLevel = 'low';
  }

  let overallSuccessRate = 100;
  if (!isFoldable) overallSuccessRate -= 35;
  overallSuccessRate -= conflictCount * 6;

  switch (overallRiskLevel) {
    case 'critical':
      overallSuccessRate -= 30;
      break;
    case 'high':
      overallSuccessRate -= 18;
      break;
    case 'medium':
      overallSuccessRate -= 8;
      break;
    default:
      overallSuccessRate -= 2;
  }

  if (adjustedComplexity > 50) overallSuccessRate -= 12;
  else if (adjustedComplexity > 25) overallSuccessRate -= 6;
  else if (adjustedComplexity > 10) overallSuccessRate -= 2;

  if (material.toughness > 80 && material.thicknessMm >= 0.12 && material.thicknessMm <= 0.25) {
    overallSuccessRate += 5;
  }

  overallSuccessRate = Math.max(5, Math.min(98, Math.round(overallSuccessRate)));

  const recommendedOrder = recommendFoldOrderWithMaterial(
    baseFoldSteps,
    material,
    foldLines
  );

  const materialEffects = computeMaterialVisualEffects(material);
  const specialTips = generateSpecialTips(material, adjustedComplexity, overallRiskLevel, risks);

  return {
    adjustedComplexity,
    foldDifficulty,
    foldDifficultyLabel: difficultyLevel.label,
    foldDifficultyColor: difficultyLevel.color,
    recommendedFoldOrder: recommendedOrder,
    riskAssessments: risks,
    overallRiskLevel,
    overallSuccessRate,
    materialEffects,
    specialTips,
  };
}

function recommendFoldOrderWithMaterial(
  baseSteps: FoldStep[],
  material: PaperMaterialConfig,
  _foldLines: LineSegment[]
): FoldStep[] {
  if (baseSteps.length === 0) return baseSteps;

  const reordered = [...baseSteps];

  switch (material.processingMethod) {
    case 'wet_fold': {
      reordered.sort((a, b) => {
        const aHasLargeAngle = a.foldAngle && Math.abs(a.foldAngle) > 90;
        const bHasLargeAngle = b.foldAngle && Math.abs(b.foldAngle) > 90;
        if (aHasLargeAngle && !bHasLargeAngle) return -1;
        if (!aHasLargeAngle && bHasLargeAngle) return 1;
        return a.step - b.step;
      });
      break;
    }
    case 'score_fold': {
      reordered.sort((a, b) => {
        const aLinkCount = a.linkedLineIds.length;
        const bLinkCount = b.linkedLineIds.length;
        if (aLinkCount !== bLinkCount) return bLinkCount - aLinkCount;
        return a.step - b.step;
      });
      break;
    }
    default:
      break;
  }

  if (material.textureDirection !== 'bidirectional') {
    reordered.sort((a, b) => {
      if (b.lineIds.length !== a.lineIds.length) return 0;
      return a.step - b.step;
    });
  }

  return reordered.map((step, idx) => ({
    ...step,
    step: idx + 1,
    description: step.description + (idx !== step.step - 1 ? ' [材质优化排序]' : ''),
  }));
}

function computeMaterialVisualEffects(material: PaperMaterialConfig): MaterialVisualEffect {
  const baseColor = material.color ?? MATERIAL_PRESETS[material.materialType].color ?? '#F5EFE0';
  const thicknessRatio = material.thicknessMm / 0.15;

  function adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  let shadowIntensity = 0.08 + thicknessRatio * 0.04;
  let lineThicknessMultiplier = 1;
  let foldRounding = 2;
  let textureOpacity = 0.05;
  let layerOffsetMultiplier = 1;
  let transparency = 1;

  switch (material.materialType) {
    case 'kraft':
      shadowIntensity = 0.1;
      foldRounding = 3;
      textureOpacity = 0.08;
      break;
    case 'washi':
      shadowIntensity = 0.06;
      textureOpacity = 0.12;
      transparency = 0.95;
      break;
    case 'tant':
      shadowIntensity = 0.09;
      foldRounding = 2.5;
      break;
    case 'lokta':
      shadowIntensity = 0.12;
      textureOpacity = 0.15;
      foldRounding = 4;
      break;
    case 'foil':
      shadowIntensity = 0.15;
      lineThicknessMultiplier = 0.9;
      foldRounding = 1;
      textureOpacity = 0.02;
      break;
    case 'tissue_foil':
      shadowIntensity = 0.1;
      layerOffsetMultiplier = 1.2;
      transparency = 0.9;
      break;
    case 'elephant_hide':
      shadowIntensity = 0.13;
      foldRounding = 5;
      layerOffsetMultiplier = 1.3;
      textureOpacity = 0.1;
      break;
    case 'newsprint':
      shadowIntensity = 0.05;
      lineThicknessMultiplier = 1.1;
      transparency = 0.97;
      break;
    case 'cardstock':
      shadowIntensity = 0.14;
      foldRounding = 6;
      layerOffsetMultiplier = 1.5;
      lineThicknessMultiplier = 1.2;
      break;
    case 'vellum':
      shadowIntensity = 0.04;
      transparency = 0.75;
      textureOpacity = 0.01;
      break;
    default:
      break;
  }

  if (material.processingMethod === 'wet_fold') {
    foldRounding *= 1.5;
  } else if (material.processingMethod === 'score_fold') {
    foldRounding *= 0.7;
  }

  layerOffsetMultiplier *= thicknessRatio;

  return {
    shadowIntensity: Math.round(shadowIntensity * 100) / 100,
    paperColor: baseColor,
    paperHighlight: adjustColor(baseColor, 20),
    paperShadow: adjustColor(baseColor, -25),
    lineThicknessMultiplier: Math.round(lineThicknessMultiplier * 100) / 100,
    foldRounding: Math.round(foldRounding * 100) / 100,
    textureOpacity: Math.round(textureOpacity * 100) / 100,
    layerOffsetMultiplier: Math.round(layerOffsetMultiplier * 100) / 100,
    transparency: Math.round(transparency * 100) / 100,
  };
}

function generateSpecialTips(
  material: PaperMaterialConfig,
  adjustedComplexity: number,
  riskLevel: string,
  risks: RiskAssessment[]
): string[] {
  const tips: string[] = [];

  tips.push(`推荐使用 ${PROCESSING_METHOD_LABELS[material.processingMethod]} 进行折叠`);

  if (material.textureDirection === 'grain_long') {
    tips.push('沿纸张长边方向的纹理将优先受力，横向折痕需更小心处理');
  } else if (material.textureDirection === 'grain_short') {
    tips.push('沿纸张短边方向的纹理将优先受力，纵向折痕需更小心处理');
  }

  if (adjustedComplexity > 40) {
    tips.push('复杂度较高，建议先完成所有预折痕再进行立体折叠');
  }

  if (material.toughness < 50) {
    tips.push('材质韧性较低，建议在折痕处使用骨刀或圆角工具辅助，避免直接用指甲刮痕');
  }

  if (material.thicknessMm > 0.25) {
    tips.push('纸张较厚，多层折叠区域建议提前压痕，避免成品变形');
  }

  if (riskLevel === 'high' || riskLevel === 'critical') {
    tips.push(`当前配置有 ${risks.filter(r => r.severity === 'high' || r.severity === 'critical').length} 个高风险项，建议先用廉价测试纸试折`);
  }

  if (material.processingMethod === 'wet_fold') {
    tips.push('湿折法：使用喷壶轻微加湿纸张，湿度控制在表面微湿即可，避免过度湿润导致破损');
  } else if (material.processingMethod === 'score_fold') {
    tips.push('压痕法：沿折线背面对折后，用圆滑工具均匀按压形成压痕');
  }

  return tips;
}

export function compareMaterialsForProject(
  project: {
    id: string;
    name: string;
    lines: LineSegment[];
    foldSteps: FoldStep[];
    paper: { width: number; height: number; origin: Point };
    complexity: number;
    isFoldable: boolean;
    conflictCount?: number;
  },
  materialConfigs: PaperMaterialConfig[]
) {
  const baseComplexity = project.complexity;
  const comparisons: { [key: string]: any } = {};

  for (const config of materialConfigs) {
    const analysis = analyzeMaterialForProject(
      config,
      project.lines,
      project.foldSteps,
      project.paper,
      baseComplexity,
      project.isFoldable,
      project.conflictCount ?? 0
    );

    const foldabilityScore = Math.round(
      (analysis.overallSuccessRate * 0.5) +
      ((100 - analysis.foldDifficulty) * 0.3) +
      ((['low', 'medium', 'high', 'critical'].indexOf(analysis.overallRiskLevel) === 0 ? 100 :
        ['low', 'medium', 'high', 'critical'].indexOf(analysis.overallRiskLevel) === 1 ? 70 :
          ['low', 'medium', 'high', 'critical'].indexOf(analysis.overallRiskLevel) === 2 ? 40 : 10) * 0.2)
    );

    comparisons[config.id] = {
      materialConfigId: config.id,
      materialName: config.name,
      materialType: config.materialType,
      thicknessMm: config.thicknessMm,
      toughness: config.toughness,
      foldabilityScore,
      adjustedComplexity: analysis.adjustedComplexity,
      overallSuccessRate: analysis.overallSuccessRate,
      overallRiskLevel: analysis.overallRiskLevel,
      riskCount: analysis.riskAssessments.filter(r => r.severity !== 'low').length,
      criticalRiskCount: analysis.riskAssessments.filter(r => r.severity === 'critical' || r.severity === 'high').length,
    };
  }

  return {
    projectId: project.id,
    projectName: project.name,
    baseComplexity,
    comparisons,
  };
}
