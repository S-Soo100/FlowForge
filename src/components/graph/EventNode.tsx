import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EventNodeData } from '../../hooks/useEventGraph';
import { EVENT_TYPE_CONFIG, type EventType } from '../../types';

function EventNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as EventNodeData;
  const eventType: EventType = nodeData.eventData?.eventType ?? 'other';
  const typeConfig = EVENT_TYPE_CONFIG[eventType];
  const hasContent = nodeData.eventData?.content;
  const hasTrigger = nodeData.eventData?.trigger?.type;
  const effectCount = nodeData.eventData?.effects?.length ?? 0;

  return (
    <div className={`bg-white border-2 ${typeConfig.border} rounded-lg shadow-sm min-w-[180px] max-w-[240px] hover:shadow-md transition-all`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* 상단: ID + 타입 태그 */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-[11px] font-mono text-gray-400">
          {nodeData.displayId}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* 중앙: 이벤트 이름 */}
      <div className="px-3 pb-1">
        <div className="text-sm font-semibold text-gray-800 truncate">
          {nodeData.label}
        </div>
        {nodeData.description && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">{nodeData.description}</div>
        )}
      </div>

      {/* 하단: 조건/효과 요약 */}
      {(hasTrigger || hasContent || effectCount > 0) && (
        <div className="px-3 pb-2 pt-1 border-t border-gray-100 space-y-0.5">
          {hasTrigger && (
            <div className="text-[10px] text-gray-500 truncate">
              ▸ 조건: {nodeData.eventData.trigger!.type}
            </div>
          )}
          {hasContent && (
            <div className="text-[10px] text-gray-500 truncate">
              ▸ 콘텐츠 있음
            </div>
          )}
          {effectCount > 0 && (
            <div className="text-[10px] text-gray-500">
              ▸ 효과 {effectCount}개
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}

// eventData 내부 변경도 감지하기 위해 JSON 비교
export const EventNode = memo(EventNodeComponent, (prev, next) => {
  return JSON.stringify(prev.data) === JSON.stringify(next.data);
});
