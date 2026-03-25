import { useEffect, useState } from 'react';
import type { SetterNodeData } from '../../types';

interface SwitchOption {
  displayId: string;
  name: string;
}

interface Props {
  nodeId: string;
  data: SetterNodeData;
  switchNodes: SwitchOption[];
  onSave: (nodeId: string, updates: { name: string; node_data: Record<string, unknown> }) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function SetterDetailPanel({ nodeId, data, switchNodes, onSave, onDelete, onClose, isReadOnly }: Props) {
  const [targetDisplayId, setTargetDisplayId] = useState(data.targetDisplayId);
  const [targetValue, setTargetValue] = useState(data.targetValue);
  const [saving, setSaving] = useState(false);

  // 노드 변경 시 폼 리셋
  useEffect(() => {
    setTargetDisplayId(data.targetDisplayId);
    setTargetValue(data.targetValue);
  }, [nodeId, data]);

  const handleSave = async () => {
    setSaving(true);
    const name = `${targetDisplayId || '?'} → ${targetValue || '?'}`;
    await onSave(nodeId, {
      name,
      node_data: {
        target_display_id: targetDisplayId,
        value: targetValue,
      },
    });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirm('이 세터를 삭제할까?')) {
      await onDelete(nodeId);
      onClose();
    }
  };

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-500">{data.displayId}</span>
          <h3 className="text-sm font-bold text-gray-800">세터 상세</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* 폼 */}
      <div className="p-4 space-y-5 flex-1">
        {/* 대상 스위치 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            대상 스위치
          </label>
          {switchNodes.length > 0 ? (
            <select
              value={targetDisplayId}
              onChange={(e) => setTargetDisplayId(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">선택...</option>
              {switchNodes.map((sw) => (
                <option key={sw.displayId} value={sw.displayId}>
                  {sw.displayId} — {sw.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-1">
              <input
                type="text"
                value={targetDisplayId}
                onChange={(e) => setTargetDisplayId(e.target.value)}
                disabled={isReadOnly}
                placeholder="예: S013"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <p className="text-[10px] text-gray-400">스위치 노드가 없어 직접 입력합니다</p>
            </div>
          )}
        </div>

        {/* 세팅 값 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            세팅 값
          </label>
          <input
            type="text"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            disabled={isReadOnly}
            placeholder="예: ON, OFF, true, 1..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {/* 미리보기 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mb-1">미리보기</p>
          <p className="text-sm font-mono text-emerald-900">
            {targetDisplayId || '?'} → {targetValue || '?'}
          </p>
        </div>
      </div>

      {/* 액션 */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        {!isReadOnly && (
          <>
            <button
              onClick={handleSave}
              disabled={saving || !targetDisplayId || !targetValue}
              className="flex-1 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition"
            >
              {saving ? '저장중...' : '저장'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-red-500 text-sm border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              삭제
            </button>
          </>
        )}
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
