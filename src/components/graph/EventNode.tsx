import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EventNodeData } from '../../types';

function EventNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as EventNodeData;

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-sm min-w-[180px] max-w-[240px] hover:shadow-md transition-all">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* 상단: ID */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[11px] font-mono text-gray-400">
          {nodeData.displayId}
        </span>
      </div>

      {/* 중앙: 이름 */}
      <div className="px-3 pb-1">
        <div className="text-sm font-semibold text-gray-800 truncate">
          {nodeData.label}
        </div>
        {nodeData.summary && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">{nodeData.summary}</div>
        )}
      </div>

      {/* 상세 인디케이터 */}
      {nodeData.detail && (
        <div className="px-3 pb-2 pt-1 border-t border-gray-100">
          <div className="text-[10px] text-gray-500">
            ▸ 상세
          </div>
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
  return JSON.stringify(prev.data) === JSON.stringify(next.data);
});
