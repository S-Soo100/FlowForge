import { useEffect, useState } from 'react';
import type { SwitchNodeData, FlowNodeData } from '../../types';
import type { Edge, Node } from '@xyflow/react';

interface Props {
  nodeId: string;
  data: SwitchNodeData;
  edges: Edge[];
  nodes: Node<FlowNodeData>[];
  onSave: (nodeId: string, updates: { name?: string }) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
}

export function SwitchDetailPanel({ nodeId, data, edges, nodes, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(data.label);
  const [saving, setSaving] = useState(false);

  // 노드 변경 시 폼 리셋
  useEffect(() => {
    setName(data.label);
  }, [nodeId, data]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(nodeId, { name });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirm('이 스위치를 삭제할까?')) {
      await onDelete(nodeId);
      onClose();
    }
  };

  // 나가는 연결 목록
  const outEdges = edges.filter((e) => e.source === nodeId);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-500">{data.displayId}</span>
          <h3 className="text-sm font-bold text-gray-800">스위치 상세</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* 폼 */}
      <div className="p-4 space-y-5 flex-1">
        {/* 이름 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            스위치 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* 나가는 연결 목록 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            나가는 연결 ({outEdges.length})
          </label>
          {outEdges.length === 0 ? (
            <p className="text-xs text-gray-400">연결된 노드가 없어요</p>
          ) : (
            <div className="space-y-1">
              {outEdges.map((e) => {
                const target = nodeMap.get(e.target);
                const targetData = target?.data as FlowNodeData | undefined;
                const labelStr = e.label as string | undefined | null;
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded text-xs"
                  >
                    <span className="font-mono text-gray-400">
                      {targetData?.displayId ?? '???'}
                    </span>
                    <span className="text-gray-700 truncate flex-1">
                      {targetData?.label ?? '알 수 없음'}
                    </span>
                    {labelStr && (
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                          labelStr === 'yes'
                            ? 'bg-green-100 border border-green-300 text-green-700'
                            : labelStr === 'no'
                            ? 'bg-red-100 border border-red-300 text-red-700'
                            : 'bg-amber-50 border border-amber-200 text-amber-600'
                        }`}
                      >
                        {labelStr === 'yes' ? 'On' : labelStr === 'no' ? 'Off' : labelStr}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 액션 */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
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
