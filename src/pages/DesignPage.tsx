import { useState, useCallback, useEffect } from 'react';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { LayerPanel } from '@/components/panels/LayerPanel';
import { ValidationPanel } from '@/components/panels/ValidationPanel';
import { DesignCanvas } from '@/components/canvas/DesignCanvas';
import { StatusBar } from '@/components/StatusBar';
import { useNavigate } from 'react-router-dom';
import { useCanvasStore } from '@/store/canvasStore';
import { useProjectStore } from '@/store/projectStore';
import type { ValidationError, Project } from '@/types';
import { isFoldable as checkFoldable } from '@/utils/validation';
import { calculateComplexity, getComplexityLevel, getComplexityColor } from '@/utils/complexity';

export function DesignPage() {
  const navigate = useNavigate();
  const { lines, paper } = useCanvasStore();
  const { setCurrentProject, loadProjects } = useProjectStore();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

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
        
        <ValidationPanel
          errors={validationErrors}
          isFoldable={isFoldable}
          complexity={complexity}
          complexityLevel={complexityLevel}
          complexityColor={complexityColor}
        />
      </div>
    </div>
  );
}
