import type { LineSegment, FoldStep } from '@/types';
import { findClosedRegions, lineLength } from './geometry';

export function calculateComplexity(lines: LineSegment[]): number {
  const mountainCount = lines.filter(l => l.type === 'mountain').length;
  const valleyCount = lines.filter(l => l.type === 'valley').length;
  const cutCount = lines.filter(l => l.type === 'cut').length;
  const axisCount = lines.filter(l => l.type === 'axis').length;

  const closedRegions = findClosedRegions(
    lines.filter(l => l.type === 'mountain' || l.type === 'valley' || l.type === 'cut')
  );

  let totalLength = 0;
  for (const line of lines) {
    if (line.type !== 'axis' && line.type !== 'support') {
      totalLength += lineLength(line);
    }
  }

  const complexity =
    mountainCount * 2 +
    valleyCount * 2 +
    cutCount * 1 +
    axisCount * 3 +
    closedRegions.length * 1.5 +
    totalLength / 200;

  return Math.round(complexity * 10) / 10;
}

export function getComplexityLevel(complexity: number): string {
  if (complexity < 10) return '简单';
  if (complexity < 25) return '中等';
  if (complexity < 50) return '复杂';
  return '高难度';
}

export function getComplexityColor(complexity: number): string {
  if (complexity < 10) return 'text-green-600';
  if (complexity < 25) return 'text-yellow-600';
  if (complexity < 50) return 'text-orange-600';
  return 'text-red-600';
}

export function generateFoldSteps(lines: LineSegment[]): FoldStep[] {
  const steps: FoldStep[] = [];
  const mountains = lines.filter(l => l.type === 'mountain');
  const valleys = lines.filter(l => l.type === 'valley');

  let stepNum = 1;

  if (mountains.length > 0) {
    for (let i = 0; i < mountains.length; i += 2) {
      const batch = mountains.slice(i, i + 2);
      steps.push({
        step: stepNum,
        description: `沿山折线 ${i + 1}${batch.length > 1 ? `-${i + 2}` : ''} 向上折叠`,
        lineIds: batch.map(l => l.id),
        foldAngle: 90,
      });
      stepNum++;
    }
  }

  if (valleys.length > 0) {
    for (let i = 0; i < valleys.length; i += 2) {
      const batch = valleys.slice(i, i + 2);
      steps.push({
        step: stepNum,
        description: `沿谷折线 ${i + 1}${batch.length > 1 ? `-${i + 2}` : ''} 向下折叠`,
        lineIds: batch.map(l => l.id),
        foldAngle: -90,
      });
      stepNum++;
    }
  }

  if (steps.length === 0) {
    steps.push({
      step: 1,
      description: '暂无折痕，添加折痕后生成折叠步骤',
      lineIds: [],
      foldAngle: 0,
    });
  }

  return steps;
}
