import { create } from 'zustand';
import type {
  Project,
  LineSegment,
  Paper,
  ProjectComparison,
  PaperMaterialConfig,
  MaterialAnalysisResult,
  MaterialComparison,
  BatchTrialConfig,
  BatchTrialResult,
  TrialResult,
  TrialOptimizationTarget,
  PaperMaterialType,
} from '@/types';
import { generateId } from '@/utils/geometry';
import { calculateComplexity, generateFoldSteps, calculateSuccessRate } from '@/utils/complexity';
import { validateLines, isFoldable, countConflicts } from '@/utils/validation';
import {
  createDefaultMaterialConfig,
  createMaterialFromPreset,
  analyzeMaterialForProject,
  compareMaterialsForProject,
  runBatchTrial,
  createDefaultTrialConfig,
  exportTrialComparison,
  MATERIAL_PRESETS,
  calculateOverallScore,
} from '@/utils/materialAnalysis';

const STORAGE_KEY = 'origami-projects';

const MATERIAL_PRESETS_BY_TYPE: Record<PaperMaterialType, Omit<PaperMaterialConfig, 'id' | 'name' | 'createdAt' | 'updatedAt'>> = MATERIAL_PRESETS;

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

  createBatchTrial: (projectId: string, config: BatchTrialConfig, target: TrialOptimizationTarget) => BatchTrialResult | null;
  getBatchTrialResults: (projectId: string) => BatchTrialResult[];
  getBatchTrialResult: (projectId: string, trialId: string) => BatchTrialResult | undefined;
  deleteBatchTrial: (projectId: string, trialId: string) => void;
  applyTrialAsActive: (projectId: string, trialId: string, trialResultId: string) => boolean;
  reoptimizeBatchTrial: (projectId: string, trialId: string, newTarget: TrialOptimizationTarget) => BatchTrialResult | null;
  exportBatchTrial: (projectId: string, trialId: string) => string | null;
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
      const idMapping = new Map<string, string>();
      const materialConfigs: PaperMaterialConfig[] = importedConfigs.length > 0
        ? importedConfigs.map((c: any) => {
            const newId = generateId();
            idMapping.set(c.id, newId);
            return {
              ...c,
              id: newId,
              createdAt: c.createdAt ?? Date.now(),
              updatedAt: c.updatedAt ?? Date.now(),
            };
          })
        : [];

      let activeMaterialConfigId: string | null = null;
      if (data.project.activeMaterialConfigId) {
        activeMaterialConfigId = idMapping.get(data.project.activeMaterialConfigId) ?? null;
      }
      if (!activeMaterialConfigId && materialConfigs.length > 0) {
        activeMaterialConfigId = materialConfigs[0].id;
      }

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
        activeMaterialConfigId,
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
          return {
            id: project.id,
            name: project.name,
            complexity: project.complexity,
            stepCount: project.foldSteps.length,
            conflictCount,
            lineCount: project.lines.length,
            mountainCount,
            valleyCount,
            successRate: analysis.overallSuccessRate,
            materialConfigId: project.activeMaterialConfigId ?? undefined,
            materialName,
            adjustedComplexity,
            riskLevel,
          };
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
    const preset = MATERIAL_PRESETS_BY_TYPE[presetType];
    if (!preset) return;
    const now = Date.now();
    get().updateMaterialConfig(projectId, configId, {
      ...preset,
      updatedAt: now,
    });
  },

  createBatchTrial: (projectId, config, target) => {
    const project = get().getProject(projectId);
    if (!project) return null;

    const trials = runBatchTrial(
      {
        id: project.id,
        name: project.name,
        lines: project.lines,
        foldSteps: project.foldSteps,
        paper: project.paper,
        complexity: project.complexity,
        isFoldable: project.isFoldable,
        conflictCount: project.conflictCount ?? 0,
      },
      config,
      target
    );

    const recommended = trials.find(t => t.isRecommended);
    const result: BatchTrialResult = {
      id: generateId(),
      projectId,
      config,
      trials,
      createdAt: Date.now(),
      completedAt: Date.now(),
      optimizationTarget: target,
      recommendedTrialId: recommended?.id,
    };

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              batchTrialResults: [...(p.batchTrialResults ?? []), result],
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    get().saveProjects();
    return result;
  },

  getBatchTrialResults: (projectId) => {
    const project = get().getProject(projectId);
    return project?.batchTrialResults ?? [];
  },

  getBatchTrialResult: (projectId, trialId) => {
    const project = get().getProject(projectId);
    return project?.batchTrialResults?.find(r => r.id === trialId);
  },

  deleteBatchTrial: (projectId, trialId) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              batchTrialResults: (p.batchTrialResults ?? []).filter(r => r.id !== trialId),
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    get().saveProjects();
  },

  applyTrialAsActive: (projectId, trialId, trialResultId) => {
    const project = get().getProject(projectId);
    if (!project) return false;

    const trialResult = project.batchTrialResults?.find(r => r.id === trialId);
    if (!trialResult) return false;

    const trial = trialResult.trials.find(t => t.id === trialResultId);
    if (!trial) return false;

    const existingConfigs = project.materialConfigs ?? [];
    const configToAdd: PaperMaterialConfig = {
      ...trial.materialConfig,
      id: generateId(),
      name: `${trial.materialConfig.name} (推荐方案)`,
      customNotes: `${trial.materialConfig.customNotes ?? ''}\n来自批量试验 - 排名第${trial.rank}名，综合评分${trial.overallScore}分`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              materialConfigs: [...existingConfigs, configToAdd],
              activeMaterialConfigId: configToAdd.id,
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    get().saveProjects();
    return true;
  },

  reoptimizeBatchTrial: (projectId, trialId, newTarget) => {
    const project = get().getProject(projectId);
    if (!project) return null;

    const existingResult = project.batchTrialResults?.find(r => r.id === trialId);
    if (!existingResult) return null;

    const reoptimizedTrials = existingResult.trials.map(trial => {
      const trialWithoutRank: Omit<TrialResult, 'overallScore' | 'rank'> = {
        id: trial.id,
        trialConfigId: trial.trialConfigId,
        materialConfig: trial.materialConfig,
        analysis: trial.analysis,
        foldabilityScore: trial.foldabilityScore,
        costEstimate: trial.costEstimate,
        precisionScore: trial.precisionScore,
        isRecommended: trial.isRecommended,
      };
      const overallScore = calculateOverallScore(trialWithoutRank, newTarget);
      return { ...trial, overallScore };
    });

    reoptimizedTrials.sort((a, b) => b.overallScore - a.overallScore);
    const finalTrials = reoptimizedTrials.map((trial, idx) => ({
      ...trial,
      rank: idx + 1,
      isRecommended: idx === 0,
    }));

    const recommended = finalTrials.find(t => t.isRecommended);
    const updatedResult: BatchTrialResult = {
      ...existingResult,
      trials: finalTrials,
      optimizationTarget: newTarget,
      recommendedTrialId: recommended?.id,
      completedAt: Date.now(),
    };

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              batchTrialResults: (p.batchTrialResults ?? []).map(r =>
                r.id === trialId ? updatedResult : r
              ),
              updatedAt: Date.now(),
            }
          : p
      ),
    }));
    get().saveProjects();
    return updatedResult;
  },

  exportBatchTrial: (projectId, trialId) => {
    const project = get().getProject(projectId);
    if (!project) return null;

    const trialResult = project.batchTrialResults?.find(r => r.id === trialId);
    if (!trialResult) return null;

    return exportTrialComparison(
      project.name,
      trialResult.trials,
      trialResult.optimizationTarget,
      project.complexity
    );
  },
}));
