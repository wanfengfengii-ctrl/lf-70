import { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { ProjectCard } from './ProjectCard';
import { Search, Plus, SortAsc, ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/types';

interface ProjectListProps {
  onLoadProject?: (project: Project) => void;
}

export function ProjectList({ onLoadProject }: ProjectListProps) {
  const navigate = useNavigate();
  const { projects, deleteProject, exportProject, importProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'complexity'>('date');

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'complexity':
          return b.complexity - a.complexity;
        case 'date':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个方案吗？')) {
      deleteProject(id);
    }
  };

  const handleExport = (project: Project) => {
    const json = exportProject(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const project = importProject(content);
      if (project) {
        alert('导入成功！');
      } else {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOpen = (id: string) => {
    if (onLoadProject) {
      const project = projects.find((p) => p.id === id);
      if (project) {
        onLoadProject(project);
        navigate('/');
      }
    } else {
      navigate(`/preview/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-serif font-medium text-stone-800">设计方案</h1>
                <p className="text-sm text-stone-400">{projects.length} 个方案</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="h-9 px-3 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-2 text-sm cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                导入
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <button
                onClick={() => navigate('/')}
                className="h-9 px-4 rounded-lg bg-stone-800 text-white flex items-center gap-2 text-sm hover:bg-stone-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建设计
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="搜索方案..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-white border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-10 px-3 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            >
              <option value="date">按时间</option>
              <option value="name">按名称</option>
              <option value="complexity">按复杂度</option>
            </select>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 rounded-2xl flex items-center justify-center">
              <Plus className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-medium text-stone-600 mb-2">暂无设计方案</h3>
            <p className="text-sm text-stone-400 mb-6">
              {searchQuery ? '没有找到匹配的方案' : '开始创建你的第一个纸艺设计'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="h-10 px-6 rounded-lg bg-stone-800 text-white text-sm hover:bg-stone-700 transition-colors"
            >
              开始设计
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onPreview={(id) => navigate(`/preview/${id}`)}
                onDelete={handleDelete}
                onExport={handleExport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
