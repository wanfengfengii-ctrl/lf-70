export type LineType = 'mountain' | 'valley' | 'cut' | 'axis' | 'support';

export type ToolType = 'select' | 'mountain' | 'valley' | 'cut' | 'axis' | 'eraser';

export type PaperMaterialType =
  | 'kraft'
  | 'washi'
  | 'tant'
  | 'lokta'
  | 'foil'
  | 'tissue_foil'
  | 'elephant_hide'
  | 'newsprint'
  | 'cardstock'
  | 'vellum'
  | 'custom';

export type TextureDirection = 'grain_long' | 'grain_short' | 'bidirectional';

export type ProcessingMethod =
  | 'score_fold'
  | 'wet_fold'
  | 'dry_fold'
  | 'crease_fold'
  | 'mc_fold';

export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  id: string;
  type: LineType;
  start: Point;
  end: Point;
  visible: boolean;
  order: number;
  foldAngle?: number;
  priority?: number;
  linkageIds?: string[];
  symmetried?: boolean;
  originalId?: string;
}

export interface FoldConstraint {
  foldAngle?: number | null;
  priority?: number | null;
  linkageIds?: string[] | null;
}

export interface Paper {
  width: number;
  height: number;
  origin: Point;
}

export interface PaperMaterialConfig {
  id: string;
  name: string;
  materialType: PaperMaterialType;
  thicknessMm: number;
  toughness: number;
  textureDirection: TextureDirection;
  processingMethod: ProcessingMethod;
  color?: string;
  customNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MaterialAnalysisResult {
  adjustedComplexity: number;
  foldDifficulty: number;
  foldDifficultyLabel: string;
  foldDifficultyColor: string;
  recommendedFoldOrder: FoldStep[];
  riskAssessments: RiskAssessment[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  overallSuccessRate: number;
  materialEffects: MaterialVisualEffect;
  specialTips: string[];
}

export interface RiskAssessment {
  id: string;
  type: 'tear' | 'crack' | 'layer_conflict' | 'thickness_issue' | 'grain_mismatch' | 'spring_back' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedLineIds?: string[];
  recommendation: string;
}

export interface MaterialVisualEffect {
  shadowIntensity: number;
  paperColor: string;
  paperHighlight: string;
  paperShadow: string;
  lineThicknessMultiplier: number;
  foldRounding: number;
  textureOpacity: number;
  layerOffsetMultiplier: number;
  transparency: number;
}

export interface MaterialComparisonStats {
  materialConfigId: string;
  materialName: string;
  materialType: PaperMaterialType;
  thicknessMm: number;
  toughness: number;
  foldabilityScore: number;
  adjustedComplexity: number;
  overallSuccessRate: number;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskCount: number;
  criticalRiskCount: number;
}

export interface MaterialComparison {
  projectId: string;
  projectName: string;
  baseComplexity: number;
  comparisons: {
    [materialConfigId: string]: MaterialComparisonStats;
  };
}

export type ValidationErrorType = 
  | 'boundary' 
  | 'conflict' 
  | 'unclosed' 
  | 'support_cut' 
  | 'symmetry'
  | 'duplicate'
  | 'fold_order_conflict'
  | 'circular_dependency'
  | 'angle_out_of_bounds'
  | 'layer_penetration';

export interface ValidationError {
  id: string;
  type: ValidationErrorType;
  message: string;
  lineIds: string[];
  severity: 'error' | 'warning';
}

export interface FoldStep {
  step: number;
  description: string;
  lineIds: string[];
  foldAngle: number;
  priority?: number;
  linkedLineIds: string[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  paper: Paper;
  lines: LineSegment[];
  isFoldable: boolean;
  complexity: number;
  foldSteps: FoldStep[];
  conflictCount?: number;
  thumbnail?: string;
  activeMaterialConfigId?: string | null;
  materialConfigs?: PaperMaterialConfig[];
}

export interface ProjectComparisonStats {
  id: string;
  name: string;
  complexity: number;
  stepCount: number;
  conflictCount: number;
  lineCount: number;
  mountainCount: number;
  valleyCount: number;
  successRate: number;
  materialConfigId?: string;
  materialName?: string;
  adjustedComplexity?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProjectComparison {
  projectA: ProjectComparisonStats;
  projectB: ProjectComparisonStats;
}

export interface CanvasState {
  zoom: number;
  pan: Point;
  paper: Paper;
  showGrid: boolean;
  gridSize: number;
}
