import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';
import { ProjectList } from '../components/project/ProjectList';

export function ProjectListPage() {
  const { user, signOut } = useAuth();
  const { projects, loading, createProject, deleteProject } = useProject(user?.id);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <img src="/forgi-writing-t.png" alt="Loading" className="h-40 opacity-70 animate-pulse" />
        <p className="text-gray-400">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 포지 — 우측 하단 */}
      <img
        src="/forgi-empty-t.png"
        alt="Forgi"
        className="fixed bottom-0 right-4 h-[45vh] max-h-[400px] object-contain opacity-80 pointer-events-none select-none hidden md:block"
      />

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between relative z-10">
        <h1 className="text-lg font-bold text-gray-800"><img src="/forgi-icon-t.png" alt="Forgi" className="inline-block h-7 mr-1 -mt-0.5" />FlowForge</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <ProjectList
          projects={projects}
          userId={user!.id}
          onCreate={createProject}
          onDelete={deleteProject}
          onOpen={(id) => navigate(`/project/${id}`)}
        />
      </main>
    </div>
  );
}
