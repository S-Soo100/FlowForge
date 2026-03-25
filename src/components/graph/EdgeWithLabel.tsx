import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useNodes,
  type EdgeProps,
} from '@xyflow/react';

interface Props extends EdgeProps {
  onLabelChange?: (edgeId: string, label: string) => void;
  onDelete?: (edgeId: string) => void;
}

export function EdgeWithLabel({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  onLabelChange,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const nodes = useNodes();
  const sourceNode = nodes.find((n) => n.id === source);
  const isFromSwitch = sourceNode?.type === 'switchNode';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const startEdit = () => {
    setEditValue((label as string) ?? '');
    setEditing(true);
  };

  const saveEdit = () => {
    onLabelChange?.(id, editValue.trim());
    setEditing(false);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={style}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {/* 스위치에서 나가는 엣지만 라벨 편집 가능 */}
            {isFromSwitch && (
              editing ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  autoFocus
                  className="text-[11px] px-2 py-0.5 border border-blue-400 rounded-full bg-white w-24 focus:outline-none"
                  placeholder="조건..."
                />
              ) : label ? (
                <span
                  onClick={startEdit}
                  className="inline-flex items-center text-[11px] px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-full text-gray-700 cursor-pointer hover:bg-amber-100"
                >
                  {label as string}
                </span>
              ) : (
                <button
                  onClick={startEdit}
                  className="text-[9px] px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-full hover:bg-amber-100 text-amber-600 flex items-center justify-center leading-none"
                  title="분기 조건 추가"
                >
                  + 조건
                </button>
              )
            )}
          </div>

          {/* 연결 삭제 */}
          <button
            onClick={() => onDelete?.(id)}
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-gray-300 rounded-full text-[10px] text-gray-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center"
            title="연결 삭제"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
