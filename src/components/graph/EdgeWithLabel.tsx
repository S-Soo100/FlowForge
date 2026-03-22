import { useEffect, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

interface Props extends EdgeProps {
  onLabelChange?: (edgeId: string, label: string) => void;
  onDelete?: (edgeId: string) => void;
}

/** 쉼표 구분 문자열 → 태그 배열 */
function parseTags(label: string | undefined): string[] {
  if (!label) return [];
  return label.split(',').map((s) => s.trim()).filter(Boolean);
}

/** 태그 배열 → 쉼표 구분 문자열 */
function joinTags(tags: string[]): string {
  return tags.join(', ');
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
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const tags = parseTags(label as string);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const saveTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    const updated = [...tags, trimmed];
    onLabelChange?.(id, joinTags(updated));
    setNewTag('');
    setAdding(false);
  };

  const removeTag = (index: number) => {
    const updated = tags.filter((_, i) => i !== index);
    onLabelChange?.(id, joinTags(updated));
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
            {/* 조건 태그들 */}
            {tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 bg-yellow-50 border border-yellow-300 rounded-full text-gray-700"
              >
                {tag}
                <button
                  onClick={() => removeTag(i)}
                  className="text-gray-400 hover:text-red-500 ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}

            {/* 추가 입력 */}
            {adding ? (
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onBlur={saveTag}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTag();
                  if (e.key === 'Escape') { setAdding(false); setNewTag(''); }
                }}
                autoFocus
                className="text-[11px] px-2 py-0.5 border border-blue-400 rounded-full bg-white w-20 focus:outline-none"
                placeholder="조건..."
              />
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="text-[9px] w-4 h-4 bg-gray-100 border border-gray-300 rounded-full hover:bg-gray-200 text-gray-400 flex items-center justify-center leading-none"
              >
                +
              </button>
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
