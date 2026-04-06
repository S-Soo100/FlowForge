import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EventNodeData } from '../../types';

function EventNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as EventNodeData;

  const progressionCount = nodeData.progression?.length ?? 0;
  const choicesCount = nodeData.choices?.items?.length ?? 0;
  const conditionsCount = nodeData.conditions?.items?.length ?? 0;

  return (
    <div className={`bg-white border-2 rounded-lg shadow-sm min-w-[180px] max-w-[240px] hover:shadow-md transition-all ${selected ? 'border-blue-400 ring-2 ring-blue-300 shadow-lg shadow-blue-100' : 'border-gray-300'}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* 상단: ID 배지 + 이름 */}
      <div className="px-3 pt-2 pb-1">
        <span className="inline-block text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mb-1">
          {String(nodeData.displayId ?? '')}
        </span>
        <div className="text-sm font-semibold text-gray-800 truncate">
          {String(nodeData.label ?? '')}
        </div>
        {nodeData.declaration && (
          <div className="text-xs text-gray-400 mt-0.5 truncate" title={String(nodeData.declaration)}>
            {String(nodeData.declaration)}
          </div>
        )}
      </div>

      {/* 인디케이터 */}
      {(progressionCount > 0 || choicesCount > 0 || conditionsCount > 0) && (
        <div className="px-3 pb-2 pt-1 border-t border-gray-100 flex gap-2">
          {conditionsCount > 0 && (
            <span className="text-[10px] text-orange-500 font-medium">
              {conditionsCount}조건
            </span>
          )}
          {progressionCount > 0 && (
            <span className="text-[10px] text-blue-500 font-medium">
              {progressionCount}블럭
            </span>
          )}
          {choicesCount > 0 && (
            <span className="text-[10px] text-purple-500 font-medium">
              {choicesCount}선택지
            </span>
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

export const EventNode = memo(EventNodeComponent, (prev, next) => {
  return JSON.stringify(prev.data) === JSON.stringify(next.data) && prev.selected === next.selected;
});
