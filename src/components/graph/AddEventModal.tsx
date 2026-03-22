import { useState } from 'react';
import { EVENT_TYPES, EVENT_TYPE_CONFIG, type EventType } from '../../types';

interface Props {
  onSubmit: (name: string, eventType: EventType) => void;
  onClose: () => void;
}

export function AddEventModal({ onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState<EventType>('other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), eventType);
  };

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

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              이벤트 타입
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {EVENT_TYPES.map((t) => {
                const config = EVENT_TYPE_CONFIG[t];
                const selected = eventType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 transition ${
                      selected
                        ? `${config.border} ${config.color} font-semibold`
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
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
