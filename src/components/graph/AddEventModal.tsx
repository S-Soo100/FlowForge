import { useState } from 'react';
import type { NodeType } from '../../types';

interface Props {
  onSubmit: (name: string, nodeType: NodeType) => void;
  onClose: () => void;
}

export function AddEventModal({ onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [nodeType, setNodeType] = useState<NodeType>('event');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nodeType === 'setter' ? (name.trim() || '새 세터') : name.trim();
    if (!finalName) return;
    onSubmit(finalName, nodeType);
  };

  const canSubmit = nodeType === 'setter' ? true : !!name.trim();

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">새 노드 추가</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 노드 타입 선택 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              노드 타입
            </label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setNodeType('event')}
                className={`flex-1 py-2 text-sm rounded-lg border-2 transition ${
                  nodeType === 'event'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                이벤트
              </button>
              <button
                type="button"
                onClick={() => setNodeType('switch')}
                className={`flex-1 py-2 text-sm rounded-lg border-2 transition ${
                  nodeType === 'switch'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                스위치
              </button>
              <button
                type="button"
                onClick={() => setNodeType('setter')}
                className={`flex-1 py-2 text-sm rounded-lg border-2 transition ${
                  nodeType === 'setter'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                세터
              </button>
            </div>
          </div>

          {/* 이름 */}
          {nodeType !== 'setter' ? (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {nodeType === 'event' ? '이벤트 이름' : '스위치 이름'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={nodeType === 'event' ? '예: 촌장 첫 만남' : '예: 선택 분기'}
                autoFocus
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
              세터가 추가되면 디테일 패널에서 대상 스위치와 값을 설정하세요.
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-1 py-2 text-white rounded-lg disabled:opacity-50 transition ${
                nodeType === 'setter'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : nodeType === 'switch'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
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

