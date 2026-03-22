import { useState } from 'react';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import type { Project, ProjectRole } from '../../types';

interface Props {
  project: Project;
  currentUserId: string;
  onClose: () => void;
}

export function ProjectSettingsPanel({ project, currentUserId, onClose }: Props) {
  const { members, inviteByEmail, updateRole, removeMember } = useProjectMembers(project.id);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('viewer');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const isOwner = project.owner_id === currentUserId;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteError(null);
    setInviting(true);

    const { error } = await inviteByEmail(email.trim(), role);
    if (error) {
      setInviteError(error);
    } else {
      setEmail('');
    }
    setInviting(false);
  };

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">프로젝트 설정</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="p-4 space-y-6 flex-1">
        {/* 프로젝트 정보 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            프로젝트 정보
          </h4>
          <div className="text-sm text-gray-800 font-medium">{project.name}</div>
          {project.description && (
            <div className="text-xs text-gray-400 mt-1">{project.description}</div>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* 멤버 목록 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            멤버 ({members.length + 1})
          </h4>

          {/* Owner */}
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-2">
            <div className="text-sm text-gray-700">
              {project.owner_id === currentUserId ? '나 (Owner)' : 'Owner'}
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
              Owner
            </span>
          </div>

          {/* Members */}
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700 truncate flex-1">{m.email}</div>

              <div className="flex items-center gap-2 shrink-0">
                {isOwner ? (
                  <select
                    value={m.role}
                    onChange={(e) => updateRole(m.id, e.target.value as ProjectRole)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    m.role === 'editor'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {m.role === 'editor' ? 'Editor' : 'Viewer'}
                  </span>
                )}

                {isOwner && (
                  <button
                    onClick={() => {
                      if (confirm(`${m.email}을(를) 제거할까요?`)) removeMember(m.id);
                    }}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <hr className="border-gray-100" />

        {/* 초대 */}
        {isOwner && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              멤버 초대
            </h4>

            <form onSubmit={handleInvite} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex gap-2">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectRole)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option value="editor">Editor (편집 가능)</option>
                  <option value="viewer">Viewer (읽기만)</option>
                </select>

                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {inviting ? '초대중...' : '초대'}
                </button>
              </div>

              {inviteError && (
                <p className="text-red-500 text-xs">{inviteError}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
