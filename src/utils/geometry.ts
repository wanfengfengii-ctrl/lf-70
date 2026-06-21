import type { Point, LineSegment, Paper } from '@/types';

const EPSILON = 0.0001;

export function pointsEqual(p1: Point, p2: Point, tolerance = EPSILON): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function lineLength(line: LineSegment): number {
  return distance(line.start, line.end);
}

export function pointToLineDistance(point: Point, line: LineSegment): number {
  const { start, end } = line;
  const A = point.x - start.x;
  const B = point.y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx: number, yy: number;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  return distance(point, { x: xx, y: yy });
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function segmentsIntersect(
  line1: LineSegment,
  line2: LineSegment
): boolean {
  const { start: a, end: b } = line1;
  const { start: c, end: d } = line2;

  if (
    pointsEqual(a, c) ||
    pointsEqual(a, d) ||
    pointsEqual(b, c) ||
    pointsEqual(b, d)
  ) {
    return false;
  }

  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
}

export function findIntersection(
  line1: LineSegment,
  line2: LineSegment
): Point | null {
  if (!segmentsIntersect(line1, line2)) return null;

  const { start: p1, end: p2 } = line1;
  const { start: p3, end: p4 } = line2;

  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < EPSILON) return null;

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;

  return {
    x: p1.x + ua * (p2.x - p1.x),
    y: p1.y + ua * (p2.y - p1.y),
  };
}

export function isPointOnSegment(
  point: Point,
  line: LineSegment,
  tolerance = 1
): boolean {
  const dist = pointToLineDistance(point, line);
  if (dist > tolerance) return false;

  const minX = Math.min(line.start.x, line.end.x) - tolerance;
  const maxX = Math.max(line.start.x, line.end.x) + tolerance;
  const minY = Math.min(line.start.y, line.end.y) - tolerance;
  const maxY = Math.max(line.start.y, line.end.y) + tolerance;

  return (
    point.x >= minX &&
    point.x <= maxX &&
    point.y >= minY &&
    point.y <= maxY
  );
}

export function isPointInPaper(point: Point, paper: Paper): boolean {
  const { origin, width, height } = paper;
  return (
    point.x >= origin.x - EPSILON &&
    point.x <= origin.x + width + EPSILON &&
    point.y >= origin.y - EPSILON &&
    point.y <= origin.y + height + EPSILON
  );
}

export function isSegmentInPaper(line: LineSegment, paper: Paper): boolean {
  return isPointInPaper(line.start, paper) && isPointInPaper(line.end, paper);
}

export function getPaperEdges(paper: Paper): LineSegment[] {
  const { origin, width, height } = paper;
  const tl = origin;
  const tr = { x: origin.x + width, y: origin.y };
  const bl = { x: origin.x, y: origin.y + height };
  const br = { x: origin.x + width, y: origin.y + height };

  return [
    { id: 'edge-top', type: 'support', start: tl, end: tr, visible: true, order: -1 },
    { id: 'edge-right', type: 'support', start: tr, end: br, visible: true, order: -1 },
    { id: 'edge-bottom', type: 'support', start: br, end: bl, visible: true, order: -1 },
    { id: 'edge-left', type: 'support', start: bl, end: tl, visible: true, order: -1 },
  ];
}

export function snapToGrid(point: Point, gridSize: number, origin: Point): Point {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + Math.round(dx / gridSize) * gridSize,
    y: origin.y + Math.round(dy / gridSize) * gridSize,
  };
}

export function snapToEndpoint(point: Point, lines: LineSegment[], threshold = 8): Point | null {
  for (const line of lines) {
    if (distance(point, line.start) < threshold) return { ...line.start };
    if (distance(point, line.end) < threshold) return { ...line.end };
  }
  return null;
}

export function reflectPointOverLine(point: Point, axis: LineSegment): Point {
  const { start: a, end: b } = axis;
  
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  
  if (lenSq === 0) return { ...point };
  
  const t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq;
  
  const proj = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
  
  return {
    x: 2 * proj.x - point.x,
    y: 2 * proj.y - point.y,
  };
}

export function reflectSegmentOverLine(line: LineSegment, axis: LineSegment): LineSegment {
  return {
    ...line,
    id: `${line.id}-sym`,
    start: reflectPointOverLine(line.start, axis),
    end: reflectPointOverLine(line.end, axis),
    symmetried: true,
    originalId: line.id,
  };
}

export function areLinesOverlapping(
  line1: LineSegment,
  line2: LineSegment,
  tolerance = 2
): boolean {
  const d1 = pointToLineDistance(line1.start, line2);
  const d2 = pointToLineDistance(line1.end, line2);
  const d3 = pointToLineDistance(line2.start, line1);
  const d4 = pointToLineDistance(line2.end, line1);
  
  return d1 < tolerance && d2 < tolerance && d3 < tolerance && d4 < tolerance;
}

export function isPointOnPaperEdge(point: Point, paper: Paper, tolerance = 2): boolean {
  const edges = getPaperEdges(paper);
  return edges.some(edge => pointToLineDistance(point, edge) < tolerance);
}

interface GraphNode {
  key: string;
  point: Point;
  edges: string[];
}

export function buildGraph(lines: LineSegment[]): Map<string, GraphNode> {
  const nodes = new Map<string, GraphNode>();
  
  const getKey = (p: Point): string => {
    const snap = 0.1;
    return `${Math.round(p.x / snap) * snap},${Math.round(p.y / snap) * snap}`;
  };
  
  for (const line of lines) {
    const startKey = getKey(line.start);
    const endKey = getKey(line.end);
    
    if (!nodes.has(startKey)) {
      nodes.set(startKey, { key: startKey, point: line.start, edges: [] });
    }
    if (!nodes.has(endKey)) {
      nodes.set(endKey, { key: endKey, point: line.end, edges: [] });
    }
    
    nodes.get(startKey)!.edges.push(line.id);
    nodes.get(endKey)!.edges.push(line.id);
  }
  
  return nodes;
}

export function findClosedRegions(lines: LineSegment[]): string[][] {
  const regions: string[][] = [];
  const usedLines = new Set<string>();
  const nodeMap = buildGraph(lines);
  
  const nodes = Array.from(nodeMap.values());
  
  for (const startNode of nodes) {
    if (startNode.edges.length < 2) continue;
    
    const visited = new Set<string>();
    const path: string[] = [];
    
    function dfs(currentKey: string, prevLineId: string | null): boolean {
      if (visited.has(currentKey)) {
        if (currentKey === startNode.key && path.length >= 3) {
          regions.push([...path]);
          return true;
        }
        return false;
      }
      
      visited.add(currentKey);
      const node = nodeMap.get(currentKey)!;
      
      for (const lineId of node.edges) {
        if (lineId === prevLineId || usedLines.has(lineId)) continue;
        
        const line = lines.find(l => l.id === lineId);
        if (!line) continue;
        
        const otherPoint = pointsEqual(line.start, node.point) ? line.end : line.start;
        const otherKey = getNodeKey(otherPoint);
        
        if (!otherKey) continue;
        
        path.push(lineId);
        if (dfs(otherKey, lineId)) {
          usedLines.add(lineId);
          return true;
        }
        path.pop();
      }
      
      visited.delete(currentKey);
      return false;
    }
    
    const getNodeKey = (p: Point): string | null => {
      const snap = 0.1;
      const key = `${Math.round(p.x / snap) * snap},${Math.round(p.y / snap) * snap}`;
      return nodeMap.has(key) ? key : null;
    };
    
    dfs(startNode.key, null);
  }
  
  return regions;
}

export function hasUnclosedStructures(lines: LineSegment[]): boolean {
  const nodeMap = buildGraph(lines);
  let oddDegreeNodes = 0;
  
  for (const node of nodeMap.values()) {
    if (node.edges.length % 2 !== 0) {
      oddDegreeNodes++;
    }
  }
  
  return oddDegreeNodes > 2;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function midpoint(line: LineSegment): Point {
  return {
    x: (line.start.x + line.end.x) / 2,
    y: (line.start.y + line.end.y) / 2,
  };
}
