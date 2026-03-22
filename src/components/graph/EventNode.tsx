import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EventNodeData } from '../../hooks/useEventGraph';

function EventNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as EventNodeData;
  const hasContent = nodeData.eventData?.content;
  const effectCount = nodeData.eventData?.effects?.length ?? 0;

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-sm px-4 py-3 min-w-[140px] max-w-[220px] hover:border-blue-400 transition-colors">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
      />

      <div className="text-sm font-semibold text-gray-800 truncate">
        {nodeData.label}
      </div>

      {nodeData.description && (
        <div className="text-xs text-gray-400 mt-1 truncate">{nodeData.description}</div>
      )}

      <div className="flex gap-2 mt-2">
        {hasContent && (
          <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
            콘텐츠
          </span>
        )}
        {effectCount > 0 && (
          <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
            효과 {effectCount}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}

export const EventNode = memo(EventNodeComponent);
