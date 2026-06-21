import { useState, useCallback, useEffect } from 'react';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { LayerPanel } from '@/components/panels/LayerPanel';
import { ValidationPanel } from '@/components/panels/ValidationPanel';
import { ConstraintPanel } from '@/components/panels/ConstraintPanel';
import { PaperMaterialPanel } from '@/components/panels/PaperMaterialPanel';
import { BatchTrialPanel } from '@/components/panels/BatchTrialPanel';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { StatusBar } from '@/components/StatusBar';
import { useNavigate } from 'react-router-dom';
import { useCanvasStore } from '@/store/canvasStore';
import { useProjectStore } from '@/store/projectStore';
import type { ValidationError, Project } from '@/types';
import { isFoldable as checkFoldable } from '@/utils/validation';
import { calculateComplexity, getComplexityLevel, getComplexityColor } from '@/utils/complexity';
import { AlertCircle, Settings, Layers, FlaskConical } from 'lucide-react';

type RightPanelTab = 'validation' | 'constraint' | 'material' | 'batchTrial';

export function DesignPage() {
  const navigate = useNavigate();
  const { lines, paper } = useCanvasStore();
  const { loadProjects, saveCurrentState, currentProjectId, projects, setCurrentProject } = useProjectStore();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('validation');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleValidationChange = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors);
  }, []);

  const isFoldable = checkFoldable(validationErrors);
  const complexity = calculateComplexity(lines);
  const complexityLevel = getComplexityLevel(complexity);
  const complexityColor = getComplexityColor(complexity);

  const errorCount = validationErrors.filter((e) => e.severity === 'error').length;
  const warningCount = validationErrors.filter((e) => e.severity === 'warning').length;

  const handlePreview = () => {
    const project = saveCurrentProject();
    if (project) {
      navigate(`/preview/${project.id}`);
    }
  };

  const saveCurrentProject = (): Project | null => {
    const { saveCurrentState } = useProjectStore.getState();
    const name = `设计方案 ${new Date().toLocaleDateString()}`;
    const project = saveCurrentState(name, paper, lines);
    if (project && project.id !== currentProjectId) {
      setCurrentProject(project.id);
    }
    return project;
  };

  const handleOpenProjects = () => {
    navigate('/projects');
  };

  return (
    <div className="h-screen flex flex-col bg-stone-50 overflow-hidden">
      <Toolbar onPreview={handlePreview} onOpenProjects={handleOpenProjects} />
      
      <div className="flex-1 flex overflow-hidden">
        <LayerPanel />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <DesignCanvas
              validationErrors={validationErrors}
              onValidationChange={handleValidationChange}
            />
          </div>
          <StatusBar />
        </div>
        
        <div className="flex flex-col h-full border-l border-stone-200 bg-white">
          <div className="flex items-stretch border-b border-stone-200 bg-stone-50">
            <button
              onClick={() => setRightPanelTab('validation')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors relative ${
                rightPanelTab === 'validation'
                  ? 'bg-white text-amber-700'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>校验</span>
              {(errorCount > 0 || warningCount > 0) && (
                <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold ${
                  errorCount > 0
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {errorCount > 0 ? errorCount : warningCount}
                </span>
              )}
              {rightPanelTab === 'validation' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => setRightPanelTab('constraint')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors relative ${
                rightPanelTab === 'constraint'
                  ? 'bg-white text-amber-700'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>约束</span>
              {rightPanelTab === 'constraint' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => {
                saveCurrentProject();
                setRightPanelTab('material');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors relative ${
                rightPanelTab === 'material'
                  ? 'bg-white text-amber-700'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>材质</span>
              {rightPanelTab === 'material' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => {
                saveCurrentProject();
                setRightPanelTab('batchTrial');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-medium transition-colors relative ${
                rightPanelTab === 'batchTrial'
                  ? 'bg-white text-indigo-700'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>批量试验</span>
              {rightPanelTab === 'batchTrial' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightPanelTab === 'validation' ? (
              <ValidationPanel
                errors={validationErrors}
                isFoldable={isFoldable}
                complexity={complexity}
                complexityLevel={complexityLevel}
                complexityColor={complexityColor}
              />
            ) : rightPanelTab === 'constraint' ? (
              <ConstraintPanel />
            ) : rightPanelTab === 'material' && currentProjectId ? (
              <PaperMaterialPanel projectId={currentProjectId} />
            ) : rightPanelTab === 'batchTrial' && currentProjectId ? (
              <BatchTrialPanel projectId={currentProjectId} />
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6">
                <div>
                  <Layers className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm text-stone-500 mb-3">请先保存方案</p>
                  <button
                    onClick={handlePreview}
                    className="text-xs px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  >
                    保存并预览
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
