import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../../hooks/useProfile';

interface Props {
  profile: Profile | null;
  email: string;
  onEditProfile: () => void;
  onSignOut: () => void;
}

export function ProfileDropdown({ profile, email, onEditProfile, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const avatarSrc = profile?.avatar_url || '/forgi-icon-t.png';
  const name = profile?.display_name || email;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition"
      >
        <img
          src={avatarSrc}
          alt="Avatar"
          className="w-7 h-7 rounded-full object-cover border border-gray-200"
          onError={(e) => { (e.target as HTMLImageElement).src = '/forgi-icon-t.png'; }}
        />
        <span className="text-sm text-gray-600">{name}</span>
        <span className="text-xs text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
            {profile?.job_title && (
              <p className="text-xs text-gray-400">{profile.job_title}</p>
            )}
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>

          <button
            onClick={() => { setOpen(false); onEditProfile(); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            프로필 수정
          </button>
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
