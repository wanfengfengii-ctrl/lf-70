import { useState, useCallback, useEffect } from 'react';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { LayerPanel } from '@/components/panels/LayerPanel';
import { ValidationPanel } from '@/components/panels/ValidationPanel';
import { ConstraintPanel } from '@/components/panels/ConstraintPanel';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { StatusBar } from '@/components/StatusBar';
import { useNavigate } from 'react-router-dom';
import { useCanvasStore } from '@/store/canvasStore';
import { useProjectStore } from '@/store/projectStore';
import type { ValidationError, Project } from '@/types';
import { isFoldable as checkFoldable } from '@/utils/validation';
import { calculateComplexity, getComplexityLevel, getComplexityColor } from '@/utils/complexity';
import { AlertCircle, Settings } from 'lucide-react';

type RightPanelTab = 'validation' | 'constraint';

export function DesignPage() {
  const navigate = useNavigate();
  const { lines, paper } = useCanvasStore();
  const { loadProjects } = useProjectStore();
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
    return saveCurrentState(name, paper, lines);
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
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors relative ${
                rightPanelTab === 'validation'
                  ? 'bg-white text-amber-700'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>校验</span>
              {(errorCount > 0 || warningCount > 0) && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-semibold ${
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
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors relative ${
                rightPanelTab === 'constraint'
                  ? 'bg-white text-amber-700'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>约束</span>
              {rightPanelTab === 'constraint' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
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
            ) : (
              <ConstraintPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
