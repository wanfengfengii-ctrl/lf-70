import { create } from 'zustand';
import type { LineSegment, ToolType, Point, Paper, LineType } from '@/types';
import {
  generateId,
  snapToGrid,
  snapToEndpoint,
  reflectSegmentOverLine,
  isSegmentInPaper,
} from '@/utils/geometry';

interface HistoryState {
  past: LineSegment[][];
  future: LineSegment[][];
}

interface CanvasStore {
  lines: LineSegment[];
  currentTool: ToolType;
  selectedLineIds: string[];
  paper: Paper;
  zoom: number;
  pan: Point;
  showGrid: boolean;
  gridSize: number;
  isDrawing: boolean;
  drawStart: Point | null;
  drawEnd: Point | null;
  orderCounter: number;
  history: HistoryState;
  axisLine: LineSegment | null;
  symmetricMode: boolean;

  setCurrentTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  setShowGrid: (show: boolean) => void;
  addLine: (line: LineSegment) => void;
  removeLine: (id: string) => void;
  updateLine: (id: string, updates: Partial<LineSegment>) => void;
  clearLines: () => void;
  startDrawing: (point: Point) => void;
  updateDrawing: (point: Point) => void;
  finishDrawing: (point: Point) => void;
  cancelDrawing: () => void;
  selectLine: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  toggleLineVisibility: (id: string) => void;
  setAxisLine: (line: LineSegment | null) => void;
  setSymmetricMode: (enabled: boolean) => void;
  setPaper: (paper: Paper) => void;
  getSnapPoint: (point: Point) => Point;
  loadLines: (lines: LineSegment[]) => void;
}

const defaultPaper: Paper = {
  width: 400,
  height: 400,
  origin: { x: 50, y: 50 },
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  lines: [],
  currentTool: 'mountain',
  selectedLineIds: [],
  paper: defaultPaper,
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: true,
  gridSize: 20,
  isDrawing: false,
  drawStart: null,
  drawEnd: null,
  orderCounter: 0,
  history: { past: [], future: [] },
  axisLine: null,
  symmetricMode: false,

  setCurrentTool: (tool) => {
    set({ currentTool: tool, selectedLineIds: [] });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),

  setPan: (pan) => set({ pan }),

  setShowGrid: (show) => set({ showGrid: show }),

  addLine: (line) => {
    const state = get();
    const newLines = [...state.lines, line];
    set((state) => ({
      lines: newLines,
      history: {
        past: [...state.history.past, state.lines],
        future: [],
      },
    }));
  },

  removeLine: (id) => {
    const state = get();
    const newLines = state.lines.filter((l) => l.id !== id);
    set((state) => ({
      lines: newLines,
      selectedLineIds: state.selectedLineIds.filter((lid) => lid !== id),
      history: {
        past: [...state.history.past, state.lines],
        future: [],
      },
    }));
  },

  updateLine: (id, updates) => {
    const state = get();
    const newLines = state.lines.map((l) =>
      l.id === id ? { ...l, ...updates } : l
    );
    set((state) => ({
      lines: newLines,
      history: {
        past: [...state.history.past, state.lines],
        future: [],
      },
    }));
  },

  clearLines: () => {
    const state = get();
    set((s) => ({
      lines: [],
      selectedLineIds: [],
      orderCounter: 0,
      history: {
        past: [...s.history.past, state.lines],
        future: [],
      },
    }));
  },

  startDrawing: (point) => {
    const state = get();
    if (state.currentTool === 'select' || state.currentTool === 'eraser') return;

    const snappedPoint = get().getSnapPoint(point);
    set({ isDrawing: true, drawStart: snappedPoint, drawEnd: snappedPoint });
  },

  updateDrawing: (point) => {
    const state = get();
    if (!state.isDrawing) return;

    const snappedPoint = get().getSnapPoint(point);
    set({ drawEnd: snappedPoint });
  },

  finishDrawing: (point) => {
    const state = get();
    if (!state.isDrawing || !state.drawStart) return;

    const snappedEnd = get().getSnapPoint(point);

    if (state.drawStart.x === snappedEnd.x && state.drawStart.y === snappedEnd.y) {
      set({ isDrawing: false, drawStart: null, drawEnd: null });
      return;
    }

    if (state.currentTool === 'axis') {
      const axisLine: LineSegment = {
        id: generateId(),
        type: 'axis',
        start: state.drawStart,
        end: snappedEnd,
        visible: true,
        order: state.orderCounter,
      };

      const oldAxis = state.axisLine;
      const newLines = state.lines.filter((l) => l.type !== 'axis');

      if (state.symmetricMode && oldAxis) {
        const symLines = state.lines.filter((l) => l.symmetried);
        const filteredNew = newLines.filter((l) => !l.symmetried);
        
        const newSymLines: LineSegment[] = [];
        for (const line of filteredNew) {
          if (line.type !== 'axis' && line.type !== 'support') {
            const symLine = reflectSegmentOverLine(line, axisLine);
            if (isSegmentInPaper(symLine, state.paper)) {
              newSymLines.push(symLine);
            }
          }
        }
        
        set({
          lines: [...filteredNew, axisLine, ...newSymLines],
          axisLine: axisLine,
          isDrawing: false,
          drawStart: null,
          drawEnd: null,
          orderCounter: state.orderCounter + 1,
          history: {
            past: [...state.history.past, state.lines],
            future: [],
          },
        });
      } else {
        set({
          lines: [...newLines, axisLine],
          axisLine: axisLine,
          isDrawing: false,
          drawStart: null,
          drawEnd: null,
          orderCounter: state.orderCounter + 1,
          history: {
            past: [...state.history.past, state.lines],
            future: [],
          },
        });
      }
      return;
    }

    const lineType = state.currentTool as LineType;
    const newLine: LineSegment = {
      id: generateId(),
      type: lineType,
      start: state.drawStart,
      end: snappedEnd,
      visible: true,
      order: state.orderCounter,
    };

    let newLines = [...state.lines, newLine];

    if (state.symmetricMode && state.axisLine && lineType !== 'axis') {
      const symLine = reflectSegmentOverLine(newLine, state.axisLine);
      if (isSegmentInPaper(symLine, state.paper)) {
        newLines.push(symLine);
      }
    }

    set({
      lines: newLines,
      isDrawing: false,
      drawStart: null,
      drawEnd: null,
      orderCounter: state.orderCounter + 1,
      history: {
        past: [...state.history.past, state.lines],
        future: [],
      },
    });
  },

  cancelDrawing: () => {
    set({ isDrawing: false, drawStart: null, drawEnd: null });
  },

  selectLine: (id, multi = false) => {
    if (multi) {
      set((state) => ({
        selectedLineIds: state.selectedLineIds.includes(id)
          ? state.selectedLineIds.filter((lid) => lid !== id)
          : [...state.selectedLineIds, id],
      }));
    } else {
      set({ selectedLineIds: [id] });
    }
  },

  deselectAll: () => set({ selectedLineIds: [] }),

  deleteSelected: () => {
    const state = get();
    if (state.selectedLineIds.length === 0) return;

    const newLines = state.lines.filter(
      (l) => !state.selectedLineIds.includes(l.id)
    );
    set((s) => ({
      lines: newLines,
      selectedLineIds: [],
      history: {
        past: [...s.history.past, state.lines],
        future: [],
      },
    }));
  },

  undo: () => {
    set((state) => {
      if (state.history.past.length === 0) return state;

      const past = [...state.history.past];
      const previous = past.pop()!;

      return {
        lines: previous,
        selectedLineIds: [],
        history: {
          past,
          future: [state.lines, ...state.history.future],
        },
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.history.future.length === 0) return state;

      const future = [...state.history.future];
      const next = future.shift()!;

      return {
        lines: next,
        selectedLineIds: [],
        history: {
          past: [...state.history.past, state.lines],
          future,
        },
      };
    });
  },

  toggleLineVisibility: (id) => {
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    }));
  },

  setAxisLine: (line) => set({ axisLine: line }),

  setSymmetricMode: (enabled) => {
    const state = get();

    if (enabled && !state.axisLine) {
      return;
    }

    if (enabled) {
      const newSymLines: LineSegment[] = [];
      for (const line of state.lines) {
        if (line.type !== 'axis' && line.type !== 'support' && !line.symmetried) {
          const symLine = reflectSegmentOverLine(line, state.axisLine!);
          if (isSegmentInPaper(symLine, state.paper)) {
            newSymLines.push(symLine);
          }
        }
      }
      set({
        symmetricMode: true,
        lines: [...state.lines.filter((l) => !l.symmetried), ...newSymLines],
      });
    } else {
      set({
        symmetricMode: false,
        lines: state.lines.filter((l) => !l.symmetried),
      });
    }
  },

  setPaper: (paper) => set({ paper }),

  getSnapPoint: (point) => {
    const state = get();
    let snapped = point;

    if (state.showGrid) {
      snapped = snapToGrid(point, state.gridSize, state.paper.origin);
    }

    const endpointSnap = snapToEndpoint(point, state.lines, 8 / state.zoom);
    if (endpointSnap) {
      snapped = endpointSnap;
    }

    return snapped;
  },

  loadLines: (lines) => {
    const state = get();
    set((s) => ({
      lines,
      selectedLineIds: [],
      orderCounter: lines.length,
      history: {
        past: [...s.history.past, state.lines],
        future: [],
      },
    }));
  },
}));
