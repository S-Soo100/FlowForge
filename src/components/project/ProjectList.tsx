import { useState } from 'react';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../../types';

interface Props {
  projects: Project[];
  userId: string;
  onCreate: (name: string, description?: string) => Promise<Project | null>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (id: string) => void;
}

export function ProjectList({ projects, userId, onCreate, onDelete, onOpen }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate(name.trim(), desc.trim() || undefined);
    setName('');
    setDesc('');
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">내 프로젝트</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          + 새 프로젝트
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="프로젝트 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="설명 (선택)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              만들기
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <img src="/forgi-empty-t.png" alt="Forgi" className="h-48 mb-4 opacity-80" />
          <p className="text-gray-400">
            아직 프로젝트가 없어요. 새 프로젝트를 만들어보세요!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              isOwner={p.owner_id === userId}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
