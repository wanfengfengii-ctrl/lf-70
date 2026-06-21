export type LineType = 'mountain' | 'valley' | 'cut' | 'axis' | 'support';

export type ToolType = 'select' | 'mountain' | 'valley' | 'cut' | 'axis' | 'eraser';

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
