import { useState } from 'react';

interface Props {
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function AddEventModal({ onSubmit, onClose }: Props) {
  console.log('[DEBUG] AddEventModal rendered (no switch option)');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) return;
    onSubmit(finalName);
  };

  const canSubmit = !!name.trim();

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">새 이벤트 추가</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              이벤트 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 촌장 첫 만남"
              autoFocus
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2 text-white rounded-lg disabled:opacity-50 transition bg-blue-600 hover:bg-blue-700"
            >
              추가
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
