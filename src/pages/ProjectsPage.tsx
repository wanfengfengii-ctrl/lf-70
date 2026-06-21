import { ProjectList } from '@/components/projects/ProjectList';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useEffect } from 'react';
import type { Project } from '@/types';

export function ProjectsPage() {
  const { loadProjects, setCurrentProject } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleLoadProject = (project: Project) => {
    useCanvasStore.getState().loadLines(project.lines);
    useCanvasStore.getState().setPaper(project.paper);
    setCurrentProject(project.id);
  };

  return <ProjectList onLoadProject={handleLoadProject} />;
}
