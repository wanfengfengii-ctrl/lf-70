import { create } from 'zustand';
import type { Project, LineSegment, Paper } from '@/types';
import { generateId } from '@/utils/geometry';
import { calculateComplexity, generateFoldSteps } from '@/utils/complexity';
import { validateLines, isFoldable } from '@/utils/validation';

const STORAGE_KEY = 'origami-projects';

function createSampleProjects(): Project[] {
  const paper1: Paper = { width: 400, height: 400, origin: { x: 50, y: 50 } };
  const cx = paper1.origin.x + paper1.width / 2;
  const cy = paper1.origin.y + paper1.height / 2;

  const waterbombLines: LineSegment[] = [
    {
      id: 'wb-1',
      type: 'mountain',
      start: paper1.origin,
      end: { x: cx, y: cy },
      visible: true,
      order: 0,
    },
    {
      id: 'wb-2',
      type: 'valley',
      start: { x: paper1.origin.x + paper1.width, y: paper1.origin.y },
      end: { x: cx, y: cy },
      visible: true,
      order: 1,
    },
    {
      id: 'wb-3',
      type: 'mountain',
      start: { x: paper1.origin.x + paper1.width, y: paper1.origin.y + paper1.height },
      end: { x: cx, y: cy },
      visible: true,
      order: 2,
    },
    {
      id: 'wb-4',
      type: 'valley',
      start: { x: paper1.origin.x, y: paper1.origin.y + paper1.height },
      end: { x: cx, y: cy },
      visible: true,
      order: 3,
    },
  ];

  const waterbombErrors = validateLines(waterbombLines, paper1);
  const waterbomb: Project = {
    id: 'sample-waterbomb',
    name: '经典水雷基础',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 2,
    paper: paper1,
    lines: waterbombLines,
    isFoldable: isFoldable(waterbombErrors),
    complexity: calculateComplexity(waterbombLines),
    foldSteps: generateFoldSteps(waterbombLines),
  };

  const paper2: Paper = { width: 400, height: 400, origin: { x: 50, y: 50 } };
  const cx2 = paper2.origin.x + paper2.width / 2;
  const cy2 = paper2.origin.y + paper2.height / 2;
  const top2 = paper2.origin.y;
  const bottom2 = paper2.origin.y + paper2.height;
  const left2 = paper2.origin.x;
  const right2 = paper2.origin.x + paper2.width;

  const craneLines: LineSegment[] = [
    {
      id: 'crane-1',
      type: 'valley',
      start: { x: left2, y: top2 },
      end: { x: right2, y: bottom2 },
      visible: true,
      order: 0,
    },
    {
      id: 'crane-2',
      type: 'valley',
      start: { x: right2, y: top2 },
      end: { x: left2, y: bottom2 },
      visible: true,
      order: 1,
    },
    {
      id: 'crane-3',
      type: 'mountain',
      start: { x: left2, y: cy2 },
      end: { x: right2, y: cy2 },
      visible: true,
      order: 2,
    },
    {
      id: 'crane-4',
      type: 'mountain',
      start: { x: cx2, y: top2 },
      end: { x: cx2, y: bottom2 },
      visible: true,
      order: 3,
    },
    {
      id: 'crane-5',
      type: 'valley',
      start: { x: left2, y: top2 + 80 },
      end: { x: cx2, y: cy2 - 40 },
      visible: true,
      order: 4,
    },
    {
      id: 'crane-6',
      type: 'valley',
      start: { x: right2, y: top2 + 80 },
      end: { x: cx2, y: cy2 - 40 },
      visible: true,
      order: 5,
    },
  ];

  const craneErrors = validateLines(craneLines, paper2);
  const crane: Project = {
    id: 'sample-crane',
    name: '纸鹤基础折痕',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    paper: paper2,
    lines: craneLines,
    isFoldable: isFoldable(craneErrors),
    complexity: calculateComplexity(craneLines),
    foldSteps: generateFoldSteps(craneLines),
  };

  const paper3: Paper = { width: 300, height: 200, origin: { x: 100, y: 150 } };
  const envelopeLines: LineSegment[] = [
    {
      id: 'env-1',
      type: 'valley',
      start: { x: paper3.origin.x, y: paper3.origin.y + 60 },
      end: { x: paper3.origin.x + paper3.width, y: paper3.origin.y + 60 },
      visible: true,
      order: 0,
    },
    {
      id: 'env-2',
      type: 'cut',
      start: { x: paper3.origin.x + 60, y: paper3.origin.y + 60 },
      end: { x: paper3.origin.x + 60, y: paper3.origin.y + paper3.height },
      visible: true,
      order: 1,
    },
    {
      id: 'env-3',
      type: 'cut',
      start: { x: paper3.origin.x + paper3.width - 60, y: paper3.origin.y + 60 },
      end: { x: paper3.origin.x + paper3.width - 60, y: paper3.origin.y + paper3.height },
      visible: true,
      order: 2,
    },
    {
      id: 'env-4',
      type: 'mountain',
      start: { x: paper3.origin.x, y: paper3.origin.y },
      end: { x: paper3.origin.x + paper3.width / 2, y: paper3.origin.y + 60 },
      visible: true,
      order: 3,
    },
    {
      id: 'env-5',
      type: 'mountain',
      start: { x: paper3.origin.x + paper3.width, y: paper3.origin.y },
      end: { x: paper3.origin.x + paper3.width / 2, y: paper3.origin.y + 60 },
      visible: true,
      order: 4,
    },
  ];

  const envelopeErrors = validateLines(envelopeLines, paper3);
  const envelope: Project = {
    id: 'sample-envelope',
    name: '简易信封',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
    paper: paper3,
    lines: envelopeLines,
    isFoldable: isFoldable(envelopeErrors),
    complexity: calculateComplexity(envelopeLines),
    foldSteps: generateFoldSteps(envelopeLines),
  };

  const paper4: Paper = { width: 400, height: 400, origin: { x: 50, y: 50 } };
  const cx4 = paper4.origin.x + paper4.width / 2;
  const cy4 = paper4.origin.y + paper4.height / 2;
  const top4 = paper4.origin.y;
  const bottom4 = paper4.origin.y + paper4.height;
  const left4 = paper4.origin.x;
  const right4 = paper4.origin.x + paper4.width;

  const symmetricLines: LineSegment[] = [
    {
      id: 'sym-1',
      type: 'axis',
      start: { x: cx4, y: top4 },
      end: { x: cx4, y: bottom4 },
      visible: true,
      order: 0,
    },
    {
      id: 'sym-2',
      type: 'mountain',
      start: { x: left4, y: top4 },
      end: { x: cx4, y: cy4 },
      visible: true,
      order: 1,
    },
    {
      id: 'sym-3',
      type: 'valley',
      start: { x: left4, y: cy4 },
      end: { x: cx4, y: bottom4 },
      visible: true,
      order: 2,
    },
    {
      id: 'sym-2-sym',
      type: 'mountain',
      start: { x: right4, y: top4 },
      end: { x: cx4, y: cy4 },
      visible: true,
      order: 3,
      symmetried: true,
      originalId: 'sym-2',
    },
    {
      id: 'sym-3-sym',
      type: 'valley',
      start: { x: right4, y: cy4 },
      end: { x: cx4, y: bottom4 },
      visible: true,
      order: 4,
      symmetried: true,
      originalId: 'sym-3',
    },
  ];

  const symmetricErrors = validateLines(symmetricLines, paper4);
  const symmetricDemo: Project = {
    id: 'sample-symmetric',
    name: '对称折痕示例',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    paper: paper4,
    lines: symmetricLines,
    isFoldable: isFoldable(symmetricErrors),
    complexity: calculateComplexity(symmetricLines),
    foldSteps: generateFoldSteps(symmetricLines),
  };

  return [crane, waterbomb, envelope, symmetricDemo];
}

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;

  loadProjects: () => void;
  saveProjects: () => void;
  createProject: (name: string, paper: Paper, lines: LineSegment[]) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  setCurrentProject: (id: string | null) => void;
  saveCurrentState: (name: string, paper: Paper, lines: LineSegment[]) => Project;
  exportProject: (project: Project) => string;
  importProject: (json: string) => Project | null;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProjectId: null,
  isLoading: true,

  loadProjects: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const projects = JSON.parse(stored) as Project[];
        set({ projects, isLoading: false });
      } else {
        const samples = createSampleProjects();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
        set({ projects: samples, isLoading: false });
      }
    } catch {
      const samples = createSampleProjects();
      set({ projects: samples, isLoading: false });
    }
  },

  saveProjects: () => {
    const { projects } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      console.error('Failed to save projects');
    }
  },

  createProject: (name, paper, lines) => {
    const validationErrors = validateLines(lines, paper);
    const project: Project = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      paper,
      lines: [...lines],
      isFoldable: isFoldable(validationErrors),
      complexity: calculateComplexity(lines),
      foldSteps: generateFoldSteps(lines),
    };

    set((state) => {
      const newProjects = [...state.projects, project];
      return { projects: newProjects };
    });

    get().saveProjects();
    return project;
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: Date.now() }
          : p
      ),
    }));
    get().saveProjects();
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    }));
    get().saveProjects();
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  setCurrentProject: (id) => {
    set({ currentProjectId: id });
  },

  saveCurrentState: (name, paper, lines) => {
    const { currentProjectId } = get();

    if (currentProjectId) {
      const validationErrors = validateLines(lines, paper);
      const project = get().getProject(currentProjectId);
      if (project) {
        get().updateProject(currentProjectId, {
          name,
          paper,
          lines: [...lines],
          isFoldable: isFoldable(validationErrors),
          complexity: calculateComplexity(lines),
          foldSteps: generateFoldSteps(lines),
        });
        return { ...project, name, paper, lines: [...lines] };
      }
    }

    return get().createProject(name, paper, lines);
  },

  exportProject: (project) => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: {
        ...project,
        lines: project.lines
          .sort((a, b) => a.order - b.order)
          .map(({ id, type, start, end, order }) => ({
            id,
            type,
            start,
            end,
            order,
          })),
      },
    };
    return JSON.stringify(exportData, null, 2);
  },

  importProject: (json) => {
    try {
      const data = JSON.parse(json);
      if (!data.project || !data.project.lines) return null;

      const project: Project = {
        ...data.project,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lines: data.project.lines.map((l: LineSegment) => ({
          ...l,
          visible: true,
        })),
      };

      set((state) => ({
        projects: [...state.projects, project],
      }));
      get().saveProjects();
      return project;
    } catch {
      return null;
    }
  },
}));
