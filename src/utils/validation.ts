import type { LineSegment, Paper, ValidationError, ValidationErrorType } from '@/types';
import {
  isSegmentInPaper,
  segmentsIntersect,
  areLinesOverlapping,
  hasUnclosedStructures,
  getPaperEdges,
  generateId,
  findIntersection,
  midpoint,
  distance,
} from './geometry';

const MIN_FOLD_ANGLE = -180;
const MAX_FOLD_ANGLE = 180;

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
  errors.push(...checkFoldOrderConflicts(lines));
  errors.push(...checkCircularDependency(lines));
  errors.push(...checkAngleOutOfBounds(lines));
  errors.push(...checkLayerPenetration(lines));

  return errors;
}

export function countConflicts(errors: ValidationError[]): number {
  return errors.filter(
    (e) =>
      e.type === 'fold_order_conflict' ||
      e.type === 'circular_dependency' ||
      e.type === 'angle_out_of_bounds' ||
      e.type === 'layer_penetration'
  ).length;
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
  void _paper;
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

function checkFoldOrderConflicts(lines: LineSegment[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const foldLines = lines.filter(
    (l) => l.type === 'mountain' || l.type === 'valley'
  );

  for (let i = 0; i < foldLines.length; i++) {
    for (let j = i + 1; j < foldLines.length; j++) {
      const lineA = foldLines[i];
      const lineB = foldLines[j];

      if (
        lineA.priority !== undefined &&
        lineB.priority !== undefined &&
        lineA.priority === lineB.priority &&
        segmentsIntersect(lineA, lineB)
      ) {
        errors.push(
          createError(
            'fold_order_conflict',
            `两条相交折痕具有相同优先级 (${lineA.priority})，折叠顺序冲突`,
            [lineA.id, lineB.id],
            'error'
          )
        );
      }
    }
  }

  return errors;
}

function checkCircularDependency(lines: LineSegment[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const foldLines = lines.filter(
    (l) =>
      (l.type === 'mountain' || l.type === 'valley') &&
      l.linkageIds &&
      l.linkageIds.length > 0
  );

  if (foldLines.length === 0) return errors;

  const lineMap = new Map<string, LineSegment>();
  for (const line of foldLines) {
    lineMap.set(line.id, line);
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycleLines: string[] = [];

  function dfs(lineId: string): boolean {
    if (recursionStack.has(lineId)) {
      cycleLines.push(lineId);
      return true;
    }
    if (visited.has(lineId)) return false;

    visited.add(lineId);
    recursionStack.add(lineId);

    const line = lineMap.get(lineId);
    if (line && line.linkageIds) {
      for (const linkedId of line.linkageIds) {
        if (lineMap.has(linkedId) && dfs(linkedId)) {
          cycleLines.push(lineId);
          return true;
        }
      }
    }

    recursionStack.delete(lineId);
    return false;
  }

  for (const line of foldLines) {
    if (!visited.has(line.id)) {
      if (dfs(line.id)) {
        const uniqueCycleIds = [...new Set(cycleLines)];
        errors.push(
          createError(
            'circular_dependency',
            '折痕联动关系存在循环依赖，无法确定折叠顺序',
            uniqueCycleIds,
            'error'
          )
        );
        break;
      }
    }
  }

  return errors;
}

function checkAngleOutOfBounds(lines: LineSegment[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const foldLines = lines.filter(
    (l) =>
      (l.type === 'mountain' || l.type === 'valley') &&
      l.foldAngle !== undefined
  );

  for (const line of foldLines) {
    const angle = line.foldAngle!;
    if (angle < MIN_FOLD_ANGLE || angle > MAX_FOLD_ANGLE) {
      errors.push(
        createError(
          'angle_out_of_bounds',
          `折叠角度 ${angle}° 超出范围 [${MIN_FOLD_ANGLE}°, ${MAX_FOLD_ANGLE}°]`,
          [line.id],
          'error'
        )
      );
    } else if (line.type === 'mountain' && angle < 0) {
      errors.push(
        createError(
          'angle_out_of_bounds',
          `山折线折叠角度应为正值，当前 ${angle}°`,
          [line.id],
          'warning'
        )
      );
    } else if (line.type === 'valley' && angle > 0) {
      errors.push(
        createError(
          'angle_out_of_bounds',
          `谷折线折叠角度应为负值，当前 ${angle}°`,
          [line.id],
          'warning'
        )
      );
    }
  }

  return errors;
}

function checkLayerPenetration(lines: LineSegment[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const foldLines = lines.filter(
    (l) =>
      (l.type === 'mountain' || l.type === 'valley') &&
      l.foldAngle !== undefined &&
      l.foldAngle !== 0
  );

  if (foldLines.length < 2) return errors;

  const sortedByPriority = [...foldLines].sort((a, b) => {
    const pA = a.priority ?? 0;
    const pB = b.priority ?? 0;
    return pA - pB;
  });

  for (let i = 0; i < sortedByPriority.length; i++) {
    for (let j = i + 1; j < sortedByPriority.length; j++) {
      const lineA = sortedByPriority[i];
      const lineB = sortedByPriority[j];

      if (!segmentsIntersect(lineA, lineB)) continue;

      const interPt = findIntersection(lineA, lineB);
      if (!interPt) continue;

      const midA = midpoint(lineA);
      const midB = midpoint(lineB);
      const distA = distance(midA, interPt);
      const distB = distance(midB, interPt);

      const angleA = lineA.foldAngle ?? 0;
      const angleB = lineB.foldAngle ?? 0;

      const foldHeightA = Math.abs(Math.sin((angleA * Math.PI) / 180)) * distA;
      const foldHeightB = Math.abs(Math.sin((angleB * Math.PI) / 180)) * distB;

      if (foldHeightA > 0 && foldHeightB > 0) {
        const heightDiff = Math.abs(foldHeightA - foldHeightB);
        if (heightDiff < 5) {
          errors.push(
            createError(
              'layer_penetration',
              '折叠后可能发生层级穿插，相交折痕的折叠高度过于接近',
              [lineA.id, lineB.id],
              'warning'
            )
          );
        }
      }
    }
  }

  return errors;
}
