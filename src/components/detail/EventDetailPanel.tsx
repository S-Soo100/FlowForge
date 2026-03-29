import { useEffect, useState } from 'react';
import type { EventNodeData, ProgressionBlock } from '../../types';

interface Props {
  nodeId: string;
  data: EventNodeData;
  onSave: (nodeId: string, updates: { name?: string; node_data?: Record<string, unknown> }) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
}

export function EventDetailPanel({ nodeId, data, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(data.label);
  const [declaration, setDeclaration] = useState(data.declaration ?? '');
  const [progressionText, setProgressionText] = useState(
    data.progression ? JSON.stringify(data.progression, null, 2) : ''
  );
  const [choicesText, setChoicesText] = useState(
    data.choices ? JSON.stringify(data.choices, null, 2) : ''
  );
  const [saving, setSaving] = useState(false);

  // 노드 변경 시 폼 리셋
  useEffect(() => {
    setName(data.label);
    setDeclaration(data.declaration ?? '');
    setProgressionText(data.progression ? JSON.stringify(data.progression, null, 2) : '');
    setChoicesText(data.choices ? JSON.stringify(data.choices, null, 2) : '');
  }, [nodeId, data]);

  const handleSave = async () => {
    setSaving(true);

    let progression: ProgressionBlock[] | null = null;
    if (progressionText.trim()) {
      try {
        progression = JSON.parse(progressionText) as ProgressionBlock[];
      } catch {
        alert('progression JSON 형식이 올바르지 않습니다.');
        setSaving(false);
        return;
      }
    }

    let choices: string[] | null = null;
    if (choicesText.trim()) {
      try {
        choices = JSON.parse(choicesText) as string[];
      } catch {
        alert('choices JSON 형식이 올바르지 않습니다.');
        setSaving(false);
        return;
      }
    }

    await onSave(nodeId, {
      name,
      node_data: {
        declaration: declaration || undefined,
        progression: progression,
        choices: choices,
      },
    });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirm('이 이벤트를 삭제할까?')) {
      await onDelete(nodeId);
      onClose();
    }
  };

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">{data.displayId}</span>
          <h3 className="text-sm font-bold text-gray-800">이벤트 상세</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* 폼 */}
      <div className="p-4 space-y-5 flex-1">
        {/* 이름 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            이벤트 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 이벤트 발생 선언 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            이벤트 발생 선언
          </label>
          <input
            type="text"
            value={declaration}
            onChange={(e) => setDeclaration(e.target.value)}
            placeholder="예: 촌장이 주인공에게 다가온다"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 진행 블럭 (임시 JSON 편집) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            진행 블럭 <span className="text-gray-400 normal-case font-normal">(JSON — Phase 3에서 UI 개선 예정)</span>
          </label>
          <textarea
            value={progressionText}
            onChange={(e) => setProgressionText(e.target.value)}
            placeholder={`[\n  { "type": "text", "content": "대사 내용" }\n]`}
            rows={6}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 선택지 (임시 JSON 편집) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            선택지 <span className="text-gray-400 normal-case font-normal">(JSON — Phase 3에서 UI 개선 예정)</span>
          </label>
          <textarea
            value={choicesText}
            onChange={(e) => setChoicesText(e.target.value)}
            placeholder={`["선택지 A", "선택지 B"]`}
            rows={3}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 액션 */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? '저장중...' : '저장'}
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-2 text-red-500 text-sm border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          삭제
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 text-gray-500 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
