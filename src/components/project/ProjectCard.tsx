import type { Project } from '../../types';

interface Props {
  project: Project;
  isOwner: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, isOwner, onOpen, onDelete }: Props) {
  return (
    <div
      className="p-5 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
      onClick={() => onOpen(project.id)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>

        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('정말 삭제할까?')) onDelete(project.id);
            }}
            className="text-gray-400 hover:text-red-500 text-sm px-2"
            title="삭제"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        {isOwner ? (
          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Owner</span>
        ) : (
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Shared</span>
        )}
        <span>
          {project.updated_at
            ? new Date(project.updated_at).toLocaleDateString('ko-KR')
            : ''}
        </span>
      </div>
    </div>
  );
}
