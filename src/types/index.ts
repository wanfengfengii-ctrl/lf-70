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
  symmetried?: boolean;
  originalId?: string;
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
  | 'duplicate';

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
  thumbnail?: string;
}

export interface CanvasState {
  zoom: number;
  pan: Point;
  paper: Paper;
  showGrid: boolean;
  gridSize: number;
}
