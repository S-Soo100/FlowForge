import { useEffect, useState } from 'react';
import type { EventNodeData } from '../../types';

interface Props {
  nodeId: string;
  data: EventNodeData;
  onSave: (nodeId: string, updates: { name?: string; summary?: string; detail?: string }) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
}

export function EventDetailPanel({ nodeId, data, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(data.label);
  const [summary, setSummary] = useState(data.summary ?? '');
  const [detail, setDetail] = useState(data.detail ?? '');
  const [saving, setSaving] = useState(false);

  // 노드 변경 시 폼 리셋
  useEffect(() => {
    setName(data.label);
    setSummary(data.summary ?? '');
    setDetail(data.detail ?? '');
  }, [nodeId, data]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(nodeId, { name, summary, detail });
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

        {/* 한 줄 요약 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            한 줄 요약
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="한 줄 요약"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 상세 내용 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            이벤트 상세 내용
          </label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="이벤트 상세 내용"
            rows={9}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
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
