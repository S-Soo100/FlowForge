import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../hooks/useProfile';

interface Props {
  profile: Profile;
  email: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ProfileModal({ profile, email, onClose, onSaved }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile.display_name);
    setJobTitle(profile.job_title ?? '');
    setAvatarUrl(profile.avatar_url ?? '');
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || email.split('@')[0],
        job_title: jobTitle.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setSaving(false);
    onSaved();
    onClose();
  };

  const avatarSrc = avatarUrl.trim() || '/forgi-icon-t.png';

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-5">프로필 수정</h3>

        <div className="space-y-4">
          {/* 아바타 */}
          <div className="flex items-center gap-4">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).src = '/forgi-icon-t.png'; }}
            />
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                아바타 URL
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... (비우면 기본 아이콘)"
                className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              이름 (닉네임)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 직책 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              직책 / 역할
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="예: 게임 기획자"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 이메일 (읽기 전용) */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              이메일
            </label>
            <p className="mt-1 px-3 py-2 text-sm text-gray-400 bg-gray-50 rounded-lg">
              {email}
            </p>
          </div>
        </div>

        {/* 액션 */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
            className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? '저장중...' : '저장'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
