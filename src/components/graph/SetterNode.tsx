import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { SetterNodeData } from '../../types';

const SetterNode = memo(({ data }: NodeProps) => {
  const setterData = data as unknown as SetterNodeData;

  return (
    <div className="relative" style={{ width: 150, height: 70 }}>
      {/* 상단 탭 (클립보드 느낌) */}
      <div
        className="absolute bg-emerald-200 border border-emerald-400 rounded-sm"
        style={{ width: 30, height: 10, top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}
      />
      {/* 메인 바디 */}
      <div
        className="absolute bg-emerald-50 border-2 border-emerald-400 rounded-md flex flex-col items-center justify-center gap-0.5"
        style={{ top: 6, left: 0, right: 0, bottom: 0 }}
      >
        <span className="text-[9px] text-emerald-600 font-mono leading-none">{setterData.displayId}</span>
        <span className="text-xs font-semibold text-emerald-900 leading-tight">
          {setterData.targetDisplayId || '?'} → {setterData.targetValue || '?'}
        </span>
      </div>
      <Handle type="target" position={Position.Top} style={{ top: -4 }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: -4 }} />
    </div>
  );
});

SetterNode.displayName = 'SetterNode';
export default SetterNode;
