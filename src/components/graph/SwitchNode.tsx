import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { SwitchNodeData } from '../../types';

function SwitchNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as SwitchNodeData;

  return (
    <div className="relative" style={{ width: 120, height: 120 }}>
      {/* 입력 핸들 - 상단 꼭짓점 */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-4 !h-4 !bg-gray-400 !border-2 !border-white !z-10"
        style={{ top: 2 }}
      />

      {/* 다이아몬드 외형 */}
      <div
        className={`absolute bg-amber-50 rounded-sm ${selected ? 'border-[3px] border-blue-400 shadow-lg shadow-blue-100' : 'border-2 border-amber-400'}`}
        style={{
          width: 84,
          height: 84,
          top: 18,
          left: 18,
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
        }}
      >
        {/* 내부 컨텐츠 - 역회전으로 텍스트 수평 */}
        <div
          className="flex flex-col items-center justify-center h-full"
          style={{ transform: 'rotate(-45deg)' }}
        >
          <span className="text-[10px] text-amber-600 font-mono leading-tight">
            {nodeData.displayId}
          </span>
          <span className="text-xs font-semibold text-amber-900 text-center px-1 leading-tight mt-0.5">
            {nodeData.label}
          </span>
        </div>
      </div>

      {/* 출력 핸들 - 하단 꼭짓점 */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
        style={{ bottom: 8 }}
      />

      {/* 출력 핸들 - 왼쪽 꼭짓점 */}
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
        style={{ left: 8 }}
      />

      {/* 출력 핸들 - 오른쪽 꼭짓점 */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
        style={{ right: 8 }}
      />
    </div>
  );
}

export const SwitchNode = memo(SwitchNodeComponent, (prev, next) => {
  return JSON.stringify(prev.data) === JSON.stringify(next.data) && prev.selected === next.selected;
});
