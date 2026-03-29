import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useStore,
  type EdgeProps,
  type ReactFlowState,
} from '@xyflow/react';

interface Props extends EdgeProps {
  onLabelChange?: (edgeId: string, label: string) => void;
  onDelete?: (edgeId: string) => void;
}

// Yes/No 라벨에 따른 색상 결정
function getSwitchEdgeStyle(label: string | undefined | null): { stroke: string; markerColor: string } {
  if (label === 'yes') return { stroke: '#86efac', markerColor: '#86efac' };
  if (label === 'no') return { stroke: '#fca5a5', markerColor: '#fca5a5' };
  return { stroke: '#6b7280', markerColor: '#6b7280' };
}

const selectSourceNodeType = (source: string) => (s: ReactFlowState) =>
  s.nodes.find((n) => n.id === source)?.type;

const selectHasSelection = (s: ReactFlowState) =>
  s.nodes.some((n) => n.selected);

const selectIsConnectedToSelected = (source: string, target: string) => (s: ReactFlowState) =>
  s.nodes.some((n) => n.selected && (n.id === source || n.id === target));

export function EdgeWithLabel({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  onDelete,
}: Props) {
  const sourceNodeType = useStore(selectSourceNodeType(source));
  const hasSelection = useStore(selectHasSelection);
  const isConnectedToSelected = useStore(selectIsConnectedToSelected(source, target));

  const isFromSwitch = sourceNodeType === 'switchNode';
  const isFromEvent = sourceNodeType === 'eventNode';

  const labelStr = label as string | undefined | null;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const dimmed = hasSelection && !isConnectedToSelected;
  const strokeWidth = isConnectedToSelected ? 3 : 2;
  const opacity = dimmed ? 0.3 : 1;

  const baseEdgeStyle = isFromSwitch
    ? { ...style, stroke: getSwitchEdgeStyle(labelStr).stroke, strokeWidth, opacity }
    : { ...style, strokeWidth, opacity };

  const edgeStyle = baseEdgeStyle;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto transition-opacity"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            opacity,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            {/* 스위치에서 나가는 엣지 — Yes/No 배지 표시 (편집 불가) */}
            {isFromSwitch && labelStr && (
              <span
                className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-semibold select-none ${
                  labelStr === 'yes'
                    ? 'bg-green-100 border border-green-300 text-green-700'
                    : 'bg-red-100 border border-red-300 text-red-700'
                }`}
              >
                {labelStr === 'yes' ? 'Yes' : 'No'}
              </span>
            )}

            {/* 이벤트에서 나가는 엣지 — 선택지 라벨 표시 (읽기 전용) */}
            {isFromEvent && labelStr && (
              <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full select-none bg-gray-100 border border-gray-300 text-gray-600 max-w-[120px] truncate">
                {labelStr}
              </span>
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
