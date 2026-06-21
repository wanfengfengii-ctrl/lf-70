import { create } from 'zustand';
import type {
  Project,
  LineSegment,
  Paper,
  ProjectComparison,
  PaperMaterialConfig,
  MaterialAnalysisResult,
  MaterialComparison,
} from '@/types';
import { generateId } from '@/utils/geometry';
import { calculateComplexity, generateFoldSteps, calculateSuccessRate } from '@/utils/complexity';
import { validateLines, isFoldable, countConflicts } from '@/utils/validation';
import {
  createDefaultMaterialConfig,
  createMaterialFromPreset,
  analyzeMaterialForProject,
  compareMaterialsForProject,
} from '@/utils/materialAnalysis';

const STORAGE_KEY = 'origami-projects';

function createSampleProjects(): Project[] {
  const now = Date.now();
  const defaultMaterialsFor = (projectName: string): PaperMaterialConfig[] => {
    const kraft = createMaterialFromPreset('kraft', `${projectName} - 牛皮纸`);
    const washi = createMaterialFromPreset('washi', `${projectName} - 和纸`);
    const tant = createMaterialFromPreset('tant', `${projectName} - TANT纸`);
    return [kraft, washi, tant];
  };

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

  const waterbombMaterials = defaultMaterialsFor('经典水雷基础');
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
    activeMaterialConfigId: waterbombMaterials[0]?.id ?? null,
    materialConfigs: waterbombMaterials,
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

  const craneMaterials = defaultMaterialsFor('纸鹤基础折痕');
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
    activeMaterialConfigId: craneMaterials[0]?.id ?? null,
    materialConfigs: craneMaterials,
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

  const envelopeMaterials = defaultMaterialsFor('简易信封');
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
    activeMaterialConfigId: envelopeMaterials[0]?.id ?? null,
    materialConfigs: envelopeMaterials,
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

  const symmetricMaterials = defaultMaterialsFor('对称折痕示例');
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
    activeMaterialConfigId: symmetricMaterials[0]?.id ?? null,
    materialConfigs: symmetricMaterials,
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
  compareProjects: (idA: string, idB: string) => ProjectComparison | null;
  getComparisonStats: (project: Project) => ProjectComparison['projectA'];

  addMaterialConfig: (projectId: string, config: PaperMaterialConfig) => void;
  updateMaterialConfig: (projectId: string, configId: string, updates: Partial<PaperMaterialConfig>) => void;
  deleteMaterialConfig: (projectId: string, configId: string) => void;
  setActiveMaterialConfig: (projectId: string, configId: string | null) => void;
  getActiveMaterialConfig: (projectId: string) => PaperMaterialConfig | null;
  analyzeActiveMaterial: (projectId: string) => MaterialAnalysisResult | null;
  analyzeMaterial: (projectId: string, configId: string) => MaterialAnalysisResult | null;
  compareMaterials: (projectId: string, configIds: string[]) => MaterialComparison | null;
  duplicateMaterialConfig: (projectId: string, configId: string, newName: string) => PaperMaterialConfig | null;
  applyPresetToMaterial: (projectId: string, configId: string, presetType: import('@/types').PaperMaterialType) => void;
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
    const materialConfigs = [
      createMaterialFromPreset('kraft', `${name} - 牛皮纸`),
      createMaterialFromPreset('washi', `${name} - 和纸`),
    ];
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
      conflictCount: countConflicts(validationErrors),
      activeMaterialConfigId: materialConfigs[0]?.id ?? null,
      materialConfigs,
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
        const existingConfigs = project.materialConfigs ?? [];
        let materialConfigs = existingConfigs;
        let activeMaterialConfigId = project.activeMaterialConfigId;

        if (existingConfigs.length === 0) {
          materialConfigs = [
            createMaterialFromPreset('kraft', `${name} - 牛皮纸`),
            createMaterialFromPreset('washi', `${name} - 和纸`),
          ];
          activeMaterialConfigId = materialConfigs[0].id;
        }

        get().updateProject(currentProjectId, {
          name,
          paper,
          lines: [...lines],
          isFoldable: isFoldable(validationErrors),
          complexity: calculateComplexity(lines),
          foldSteps: generateFoldSteps(lines),
          conflictCount: countConflicts(validationErrors),
          materialConfigs,
          activeMaterialConfigId,
        });
        return { ...project, name, paper, lines: [...lines] };
      }
    }

    return get().createProject(name, paper, lines);
  },

  exportProject: (project) => {
    const activeConfig = project.materialConfigs?.find(
      (c) => c.id === project.activeMaterialConfigId
    );
    const activeAnalysis = project.activeMaterialConfigId
      ? (() => {
          try {
            return analyzeMaterialForProject(
              activeConfig!,
              project.lines,
              project.foldSteps,
              project.paper,
              project.complexity,
              project.isFoldable,
              project.conflictCount ?? 0
            );
          } catch {
            return null;
          }
        })()
      : null;

    const exportData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      project: {
        ...project,
        lines: project.lines
          .sort((a, b) => a.order - b.order)
          .map(({ id, type, start, end, order, foldAngle, priority, linkageIds, symmetried, originalId }) => ({
            id,
            type,
            start,
            end,
            order,
            ...(foldAngle !== undefined ? { foldAngle } : {}),
            ...(priority !== undefined ? { priority } : {}),
            ...(linkageIds && linkageIds.length > 0 ? { linkageIds } : {}),
            ...(symmetried ? { symmetried } : {}),
            ...(originalId ? { originalId } : {}),
          })),
        foldSteps: project.foldSteps.map((step) => ({
          step: step.step,
          description: step.description,
          lineIds: step.lineIds,
          foldAngle: step.foldAngle,
          priority: step.priority,
          linkedLineIds: step.linkedLineIds,
        })),
        activeMaterialConfigId: project.activeMaterialConfigId ?? null,
        materialConfigs: (project.materialConfigs ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          materialType: c.materialType,
          thicknessMm: c.thicknessMm,
          toughness: c.toughness,
          textureDirection: c.textureDirection,
          processingMethod: c.processingMethod,
          ...(c.color ? { color: c.color } : {}),
          ...(c.customNotes ? { customNotes: c.customNotes } : {}),
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      },
      materialAnalysis: activeAnalysis
        ? {
            activeMaterialConfigName: activeConfig?.name,
            adjustedComplexity: activeAnalysis.adjustedComplexity,
            foldDifficulty: activeAnalysis.foldDifficulty,
            foldDifficultyLabel: activeAnalysis.foldDifficultyLabel,
            overallRiskLevel: activeAnalysis.overallRiskLevel,
            overallSuccessRate: activeAnalysis.overallSuccessRate,
            riskAssessments: activeAnalysis.riskAssessments.map((r) => ({
              type: r.type,
              severity: r.severity,
              message: r.message,
              affectedLineIds: r.affectedLineIds,
              recommendation: r.recommendation,
            })),
            recommendedFoldOrder: activeAnalysis.recommendedFoldOrder.map((s) => ({
              step: s.step,
              description: s.description,
              lineIds: s.lineIds,
              foldAngle: s.foldAngle,
            })),
            specialTips: activeAnalysis.specialTips,
            visualEffects: activeAnalysis.materialEffects,
          }
        : null,
    };
    return JSON.stringify(exportData, null, 2);
  },

  importProject: (json) => {
    try {
      const data = JSON.parse(json);
      if (!data.project || !data.project.lines) return null;

      const importedConfigs = data.project.materialConfigs ?? [];
      const materialConfigs: PaperMaterialConfig[] = importedConfigs.length > 0
        ? importedConfigs.map((c: any) => ({
            ...c,
            id: generateId(),
            createdAt: c.createdAt ?? Date.now(),
            updatedAt: c.updatedAt ?? Date.now(),
          }))
        : [];

      const project: Project = {
        ...data.project,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lines: data.project.lines.map((l: LineSegment) => ({
          ...l,
          visible: true,
        })),
        materialConfigs,
        activeMaterialConfigId: materialConfigs.length > 0
          ? materialConfigs[0].id
          : null,
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

  getComparisonStats: (project) => {
    const mountainCount = project.lines.filter((l) => l.type === 'mountain').length;
    const valleyCount = project.lines.filter((l) => l.type === 'valley').length;
    const conflictCount = project.conflictCount ?? 0;

    let adjustedComplexity = project.complexity;
    let materialName: string | undefined;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' | undefined;

    if (project.activeMaterialConfigId && project.materialConfigs) {
      const activeConfig = project.materialConfigs.find(
        (c) => c.id === project.activeMaterialConfigId
      );
      if (activeConfig) {
        materialName = activeConfig.name;
        try {
          const analysis = analyzeMaterialForProject(
            activeConfig,
            project.lines,
            project.foldSteps,
            project.paper,
            project.complexity,
            project.isFoldable,
            conflictCount
          );
          adjustedComplexity = analysis.adjustedComplexity;
          riskLevel = analysis.overallRiskLevel;
        } catch {
          // ignore analysis errors
        }
      }
    }

    const successRate = calculateSuccessRate(
      project.isFoldable,
      conflictCount,
      adjustedComplexity,
      project.foldSteps.length
    );
    return {
      id: project.id,
      name: project.name,
      complexity: project.complexity,
      stepCount: project.foldSteps.length,
      conflictCount,
      lineCount: project.lines.length,
      mountainCount,
      valleyCount,
      successRate,
      materialConfigId: project.activeMaterialConfigId ?? undefined,
      materialName,
      adjustedComplexity,
      riskLevel,
    };
  },

  compareProjects: (idA, idB) => {
    const projectA = get().getProject(idA);
    const projectB = get().getProject(idB);
    if (!projectA || !projectB) return null;

    return {
      projectA: get().getComparisonStats(projectA),
      projectB: get().getComparisonStats(projectB),
    };
  },

  addMaterialConfig: (projectId, config) => {
    const project = get().getProject(projectId);
    if (!project) return;
    const existingConfigs = project.materialConfigs ?? [];
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              materialConfigs: [...existingConfigs, config],
              activeMaterialConfigId: p.activeMaterialConfigId ?? config.id,
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    get().saveProjects();
  },

  updateMaterialConfig: (projectId, configId, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              materialConfigs: (p.materialConfigs ?? []).map((c) =>
                c.id === configId ? { ...c, ...updates, updatedAt: Date.now() } : c
              ),
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    get().saveProjects();
  },

  deleteMaterialConfig: (projectId, configId) => {
    const project = get().getProject(projectId);
    if (!project) return;
    const remaining = (project.materialConfigs ?? []).filter((c) => c.id !== configId);
    const isActive = project.activeMaterialConfigId === configId;
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              materialConfigs: remaining,
              activeMaterialConfigId: isActive
                ? remaining.length > 0
                  ? remaining[0].id
                  : null
                : p.activeMaterialConfigId,
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    get().saveProjects();
  },

  setActiveMaterialConfig: (projectId, configId) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, activeMaterialConfigId: configId, updatedAt: Date.now() }
          : p
      ),
    }));
    get().saveProjects();
  },

  getActiveMaterialConfig: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return null;
    const configs = project.materialConfigs ?? [];
    if (configs.length === 0) return null;
    const active = configs.find((c) => c.id === project.activeMaterialConfigId);
    return active ?? configs[0] ?? null;
  },

  analyzeActiveMaterial: (projectId) => {
    const project = get().getProject(projectId);
    if (!project) return null;
    const config = get().getActiveMaterialConfig(projectId);
    if (!config) return null;
    return analyzeMaterialForProject(
      config,
      project.lines,
      project.foldSteps,
      project.paper,
      project.complexity,
      project.isFoldable,
      project.conflictCount ?? 0
    );
  },

  analyzeMaterial: (projectId, configId) => {
    const project = get().getProject(projectId);
    if (!project) return null;
    const config = (project.materialConfigs ?? []).find((c) => c.id === configId);
    if (!config) return null;
    return analyzeMaterialForProject(
      config,
      project.lines,
      project.foldSteps,
      project.paper,
      project.complexity,
      project.isFoldable,
      project.conflictCount ?? 0
    );
  },

  compareMaterials: (projectId, configIds) => {
    const project = get().getProject(projectId);
    if (!project) return null;
    const configs = (project.materialConfigs ?? []).filter((c) => configIds.includes(c.id));
    if (configs.length === 0) return null;
    return compareMaterialsForProject(project, configs);
  },

  duplicateMaterialConfig: (projectId, configId, newName) => {
    const project = get().getProject(projectId);
    if (!project) return null;
    const source = (project.materialConfigs ?? []).find((c) => c.id === configId);
    if (!source) return null;
    const now = Date.now();
    const duplicate: PaperMaterialConfig = {
      ...source,
      id: generateId(),
      name: newName,
      createdAt: now,
      updatedAt: now,
    };
    get().addMaterialConfig(projectId, duplicate);
    return duplicate;
  },

  applyPresetToMaterial: (projectId, configId, presetType) => {
    const preset = MATERIAL_PRESETS_OR_NEEDED[presetType];
    if (!preset) return;
    const now = Date.now();
    get().updateMaterialConfig(projectId, configId, {
      ...preset,
      updatedAt: now,
    });
  },
}));

const MATERIAL_PRESETS_OR_NEEDED: Record<string, Omit<PaperMaterialConfig, 'id' | 'name' | 'createdAt' | 'updatedAt'>> = {
  kraft: {
    materialType: 'kraft',
    thicknessMm: 0.18,
    toughness: 75,
    textureDirection: 'grain_long',
    processingMethod: 'crease_fold',
    color: '#D4A574',
    customNotes: '标准牛皮纸，韧性好，适合基础折纸',
  },
  washi: {
    materialType: 'washi',
    thicknessMm: 0.12,
    toughness: 85,
    textureDirection: 'grain_long',
    processingMethod: 'wet_fold',
    color: '#F5E6D3',
    customNotes: '和纸，轻薄有韧性，适合精细折叠',
  },
  tant: {
    materialType: 'tant',
    thicknessMm: 0.15,
    toughness: 80,
    textureDirection: 'bidirectional',
    processingMethod: 'score_fold',
    color: '#E8D5C4',
    customNotes: 'TANT纸，两面双色，适合复杂模型',
  },
  lokta: {
    materialType: 'lokta',
    thicknessMm: 0.22,
    toughness: 90,
    textureDirection: 'grain_short',
    processingMethod: 'crease_fold',
    color: '#C4A77D',
    customNotes: '尼泊尔洛卡塔，天然纤维，高韧性',
  },
  foil: {
    materialType: 'foil',
    thicknessMm: 0.10,
    toughness: 50,
    textureDirection: 'bidirectional',
    processingMethod: 'dry_fold',
    color: '#D4D4D4',
    customNotes: '铝箔纸，易产生折痕记忆，但易撕裂',
  },
  tissue_foil: {
    materialType: 'tissue_foil',
    thicknessMm: 0.08,
    toughness: 70,
    textureDirection: 'bidirectional',
    processingMethod: 'mc_fold',
    color: '#C0C0C0',
    customNotes: '棉纸铝箔复合，适合复杂微型折叠',
  },
  elephant_hide: {
    materialType: 'elephant_hide',
    thicknessMm: 0.25,
    toughness: 95,
    textureDirection: 'bidirectional',
    processingMethod: 'wet_fold',
    color: '#B8956A',
    customNotes: '象皮纸，极高韧性，适合超复杂模型',
  },
  newsprint: {
    materialType: 'newsprint',
    thicknessMm: 0.07,
    toughness: 35,
    textureDirection: 'grain_long',
    processingMethod: 'dry_fold',
    color: '#EDE8D8',
    customNotes: '新闻纸，练习用，低韧性易破',
  },
  cardstock: {
    materialType: 'cardstock',
    thicknessMm: 0.35,
    toughness: 60,
    textureDirection: 'grain_short',
    processingMethod: 'score_fold',
    color: '#F0EAE0',
    customNotes: '卡片纸，厚度大，需压痕处理',
  },
  vellum: {
    materialType: 'vellum',
    thicknessMm: 0.09,
    toughness: 40,
    textureDirection: 'grain_long',
    processingMethod: 'dry_fold',
    color: '#FFF8F0',
    customNotes: '透明薄纸，半透明效果，精细操作',
  },
  custom: {
    materialType: 'custom',
    thicknessMm: 0.15,
    toughness: 60,
    textureDirection: 'grain_long',
    processingMethod: 'crease_fold',
    color: '#F5EFE0',
    customNotes: '自定义材质，可调整所有参数',
  },
};
