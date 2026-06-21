import type { LineSegment, FoldStep } from '@/types';
import { findClosedRegions, lineLength, segmentsIntersect } from './geometry';

export function calculateComplexity(lines: LineSegment[]): number {
  const mountainCount = lines.filter(l => l.type === 'mountain').length;
  const valleyCount = lines.filter(l => l.type === 'valley').length;
  const cutCount = lines.filter(l => l.type === 'cut').length;
  const axisCount = lines.filter(l => l.type === 'axis').length;

  const foldLines = lines.filter(
    (l) => l.type === 'mountain' || l.type === 'valley'
  );

  const closedRegions = findClosedRegions(
    lines.filter(l => l.type === 'mountain' || l.type === 'valley' || l.type === 'cut')
  );

  const linkedCount = lines.filter(l => l.linkageIds && l.linkageIds.length > 0).length;
  const priorityCount = lines.filter(l => l.priority !== undefined).length;
  const customAngleCount = lines.filter(l => l.foldAngle !== undefined).length;

  let intersectionCount = 0;
  for (let i = 0; i < foldLines.length; i++) {
    for (let j = i + 1; j < foldLines.length; j++) {
      if (segmentsIntersect(foldLines[i], foldLines[j])) {
        intersectionCount++;
      }
    }
  }

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
    linkedCount * 1.5 +
    priorityCount * 0.5 +
    customAngleCount * 0.5 +
    intersectionCount * 2 +
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

function buildLinkageGroups(foldLines: LineSegment[]): LineSegment[][] {
  const visited = new Set<string>();
  const groups: LineSegment[][] = [];

  function dfs(lineId: string, group: LineSegment[]) {
    if (visited.has(lineId)) return;
    const line = foldLines.find((l) => l.id === lineId);
    if (!line) return;
    visited.add(lineId);
    group.push(line);

    if (line.linkageIds) {
      for (const linkedId of line.linkageIds) {
        dfs(linkedId, group);
      }
    }

    for (const other of foldLines) {
      if (other.linkageIds?.includes(lineId)) {
        dfs(other.id, group);
      }
    }
  }

  for (const line of foldLines) {
    if (!visited.has(line.id)) {
      const group: LineSegment[] = [];
      dfs(line.id, group);
      if (group.length > 0) {
        groups.push(group);
      }
    }
  }

  return groups;
}

export function generateFoldSteps(lines: LineSegment[]): FoldStep[] {
  const steps: FoldStep[] = [];
  const foldLines = lines.filter(
    (l) => l.type === 'mountain' || l.type === 'valley'
  );

  if (foldLines.length === 0) {
    return [
      {
        step: 1,
        description: '暂无折痕，添加折痕后生成折叠步骤',
        lineIds: [],
        foldAngle: 0,
        priority: 0,
        linkedLineIds: [],
      },
    ];
  }

  const linkageGroups = buildLinkageGroups(foldLines);

  const sortedGroups = linkageGroups.sort((a, b) => {
    const minPrioA = Math.min(...a.map((l) => l.priority ?? 0));
    const minPrioB = Math.min(...b.map((l) => l.priority ?? 0));
    if (minPrioA !== minPrioB) return minPrioA - minPrioB;
    const minOrderA = Math.min(...a.map((l) => l.order));
    const minOrderB = Math.min(...b.map((l) => l.order));
    return minOrderA - minOrderB;
  });

  let stepNum = 1;

  for (const group of sortedGroups) {
    const primaryLine = group.reduce((min, line) => {
      const prioDiff = (min.priority ?? 0) - (line.priority ?? 0);
      if (prioDiff !== 0) return prioDiff < 0 ? min : line;
      return min.order < line.order ? min : line;
    });

    const groupIds = group.map((l) => l.id);
    const primaryId = primaryLine.id;
    const linkedIds = groupIds.filter((id) => id !== primaryId);

    const isMountain = primaryLine.type === 'mountain';
    const defaultAngle = isMountain ? 90 : -90;
    const foldAngle = primaryLine.foldAngle ?? defaultAngle;
    const priority = primaryLine.priority ?? 0;

    const lineCount = group.length;
    const typeLabel = isMountain ? '山折线' : '谷折线';
    const dirLabel = isMountain ? '向上' : '向下';

    let description = '';
    if (lineCount === 1) {
      description = `沿${typeLabel} ${dirLabel}折叠 ${Math.abs(foldAngle)}°`;
    } else {
      const mountainInGroup = group.filter((l) => l.type === 'mountain').length;
      const valleyInGroup = group.filter((l) => l.type === 'valley').length;
      const parts: string[] = [];
      if (mountainInGroup > 0) parts.push(`${mountainInGroup}条山折`);
      if (valleyInGroup > 0) parts.push(`${valleyInGroup}条谷折`);
      description = `联动折叠：${parts.join(' + ')}，角度 ${Math.abs(foldAngle)}°`;
    }

    if (priority > 0) {
      description += ` [优先级${priority}]`;
    }

    steps.push({
      step: stepNum,
      description,
      lineIds: groupIds,
      foldAngle,
      priority,
      linkedLineIds: linkedIds,
    });

    stepNum++;
  }

  return steps;
}

export function getFoldOrderingSummary(lines: LineSegment[]): {
  totalSteps: number;
  maxPriority: number;
  linkedGroups: number;
  independentLines: number;
} {
  const foldLines = lines.filter(
    (l) => l.type === 'mountain' || l.type === 'valley'
  );

  const groups = buildLinkageGroups(foldLines);
  const steps = generateFoldSteps(lines);

  return {
    totalSteps: steps.length,
    maxPriority: foldLines.reduce(
      (max, l) => Math.max(max, l.priority ?? 0),
      0
    ),
    linkedGroups: groups.filter((g) => g.length > 1).length,
    independentLines: groups.filter((g) => g.length === 1).length,
  };
}
