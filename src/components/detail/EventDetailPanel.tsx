import { useEffect, useState } from 'react';
import { TriggerEditor } from './TriggerEditor';
import { ContentEditor } from './ContentEditor';
import { EffectEditor } from './EffectEditor';
import { EVENT_TYPES, EVENT_TYPE_CONFIG, type EventData, type EventType } from '../../types';
import type { EventNodeData } from '../../hooks/useEventGraph';

interface Props {
  nodeId: string;
  data: EventNodeData;
  onSave: (nodeId: string, updates: { name?: string; description?: string; event_data?: EventData }) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
}

export function EventDetailPanel({ nodeId, data, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(data.label);
  const [description, setDescription] = useState(data.description ?? '');
  const [eventData, setEventData] = useState<EventData>(data.eventData ?? {});
  const [saving, setSaving] = useState(false);

  // 노드 변경 시 폼 리셋
  useEffect(() => {
    setName(data.label);
    setDescription(data.description ?? '');
    setEventData(data.eventData ?? {});
  }, [nodeId, data]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(nodeId, { name, description, event_data: eventData });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirm('이 이벤트를 삭제할까?')) {
      await onDelete(nodeId);
      onClose();
    }
  };

  const eventType: EventType = eventData.eventType ?? 'other';

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
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

        {/* 설명 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            설명
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이벤트 한 줄 설명"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 타입 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            이벤트 타입
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_TYPES.map((t) => {
              const config = EVENT_TYPE_CONFIG[t];
              const selected = eventType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEventData({ ...eventData, eventType: t })}
                  className={`px-2.5 py-1 text-xs rounded-md border transition ${
                    selected
                      ? `${config.border} ${config.color} font-semibold`
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-gray-100" />

        <TriggerEditor
          trigger={eventData.trigger}
          onChange={(trigger) => setEventData({ ...eventData, trigger })}
        />

        <hr className="border-gray-100" />

        <ContentEditor
          content={eventData.content}
          onChange={(content) => setEventData({ ...eventData, content })}
        />

        <hr className="border-gray-100" />

        <EffectEditor
          effects={eventData.effects ?? []}
          onChange={(effects) => setEventData({ ...eventData, effects })}
        />
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
      </div>
    </div>
  );
}
