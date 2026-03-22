import { useEffect, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  MarkerType,
} from '@xyflow/react';

interface Props extends EdgeProps {
  onLabelChange?: (edgeId: string, label: string) => void;
  onDelete?: (edgeId: string) => void;
}

export function EdgeWithLabel({
  id,
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
  const [value, setValue] = useState((label as string) ?? '');

  // label이 외부에서 바뀌면 동기화
  useEffect(() => {
    setValue((label as string) ?? '');
  }, [label]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleBlur = () => {
    setEditing(false);
    onLabelChange?.(id, value);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{ ...style, strokeWidth: 2 }}
        markerEnd={MarkerType.ArrowClosed}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute flex items-center gap-1 pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {editing ? (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              autoFocus
              className="text-xs px-2 py-0.5 border border-blue-400 rounded bg-white w-28 focus:outline-none"
              placeholder="조건 (쉼표로 구분)"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-2 py-0.5 bg-yellow-50 border border-yellow-300 rounded hover:bg-yellow-100 text-gray-700 max-w-[160px] truncate"
            >
              {label || '조건 추가'}
            </button>
          )}

          <button
            onClick={() => onDelete?.(id)}
            className="text-xs text-gray-400 hover:text-red-500"
            title="연결 삭제"
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
