import type { LineSegment, Paper, ValidationError, ValidationErrorType } from '@/types';
import {
  isSegmentInPaper,
  segmentsIntersect,
  areLinesOverlapping,
  hasUnclosedStructures,
  getPaperEdges,
  generateId,
} from './geometry';

export function validateLines(
  lines: LineSegment[],
  paper: Paper
): ValidationError[] {
  const errors: ValidationError[] = [];

  errors.push(...checkBoundaries(lines, paper));
  errors.push(...checkConflicts(lines));
  errors.push(...checkDuplicates(lines));
  errors.push(...checkCutSupportIntersections(lines, paper));
  errors.push(...checkClosedStructure(lines, paper));

  return errors;
}

function createError(
  type: ValidationErrorType,
  message: string,
  lineIds: string[],
  severity: 'error' | 'warning' = 'error'
): ValidationError {
  return {
    id: generateId(),
    type,
    message,
    lineIds,
    severity,
  };
}

function checkBoundaries(lines: LineSegment[], paper: Paper): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const line of lines) {
    if (line.type === 'axis' || line.type === 'support') continue;
    if (!isSegmentInPaper(line, paper)) {
      errors.push(
        createError(
          'boundary',
          '折痕线超出纸张边界',
          [line.id],
          'error'
        )
      );
    }
  }

  return errors;
}

function checkConflicts(lines: LineSegment[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const foldLines = lines.filter(l => l.type === 'mountain' || l.type === 'valley');

  for (let i = 0; i < foldLines.length; i++) {
    for (let j = i + 1; j < foldLines.length; j++) {
      const line1 = foldLines[i];
      const line2 = foldLines[j];

      if (segmentsIntersect(line1, line2)) {
        errors.push(
          createError(
            'conflict',
            '折痕线存在交叉冲突',
            [line1.id, line2.id],
            'error'
          )
        );
      }
    }
  }

  return errors;
}

function checkDuplicates(lines: LineSegment[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const line1 = lines[i];
      const line2 = lines[j];

      if (line1.type === 'support' || line2.type === 'support') continue;

      if (areLinesOverlapping(line1, line2)) {
        if (line1.type !== line2.type) {
          if (
            (line1.type === 'mountain' && line2.type === 'valley') ||
            (line1.type === 'valley' && line2.type === 'mountain')
          ) {
            errors.push(
              createError(
                'duplicate',
                '同一线段不能同时标记为山折和谷折',
                [line1.id, line2.id],
                'error'
              )
            );
          }
        } else {
          errors.push(
            createError(
              'duplicate',
              '存在重复的折痕线',
              [line1.id, line2.id],
              'warning'
            )
          );
        }
      }
    }
  }

  return errors;
}

function checkCutSupportIntersections(
  lines: LineSegment[],
  paper: Paper
): ValidationError[] {
  const errors: ValidationError[] = [];
  const cuts = lines.filter(l => l.type === 'cut');
  const supports = lines.filter(l => l.type === 'support');
  const paperEdges = getPaperEdges(paper);

  const allSupports = [...supports, ...paperEdges];

  for (const cut of cuts) {
    for (const support of allSupports) {
      if (segmentsIntersect(cut, support)) {
        errors.push(
          createError(
            'support_cut',
            '剪口不能穿过关键支撑线',
            [cut.id, support.id],
            'error'
          )
        );
      }
    }
  }

  return errors;
}

function checkClosedStructure(
  lines: LineSegment[],
  _paper: Paper
): ValidationError[] {
  const errors: ValidationError[] = [];
  const foldLines = lines.filter(
    l => l.type === 'mountain' || l.type === 'valley' || l.type === 'cut'
  );

  if (foldLines.length === 0) return errors;

  if (hasUnclosedStructures(foldLines)) {
    errors.push(
      createError(
        'unclosed',
        '存在未闭合的折痕结构，不能标记为可折叠',
        foldLines.map(l => l.id),
        'error'
      )
    );
  }

  return errors;
}

export function isFoldable(errors: ValidationError[]): boolean {
  return !errors.some(e => e.severity === 'error');
}
