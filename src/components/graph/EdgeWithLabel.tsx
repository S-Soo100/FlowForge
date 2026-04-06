import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  useStore,
  type EdgeProps,
  type ReactFlowState,
} from '@xyflow/react';
import type { EventNodeData } from '../../types';

interface Props extends EdgeProps {
  onLabelChange?: (edgeId: string, label: string) => void;
  onDelete?: (edgeId: string) => void;
}

const selectSourceNode = (source: string) => (s: ReactFlowState) =>
  s.nodes.find((n) => n.id === source);

const selectHasSelection = (s: ReactFlowState) =>
  s.nodes.some((n) => n.selected);

const selectIsConnectedToSelected = (source: string, target: string) => (s: ReactFlowState) =>
  s.nodes.some((n) => n.selected && (n.id === source || n.id === target));

const selectOutSiblings = (edgeId: string, source: string) => (s: ReactFlowState) => {
  const sibs = s.edges.filter((e) => e.source === source);
  const i = sibs.findIndex((e) => e.id === edgeId);
  return { i: i < 0 ? 0 : i, n: sibs.length };
};

const selectInSiblings = (edgeId: string, target: string) => (s: ReactFlowState) => {
  const sibs = s.edges.filter((e) => e.target === target);
  const i = sibs.findIndex((e) => e.id === edgeId);
  return { i: i < 0 ? 0 : i, n: sibs.length };
};

function centerOff(i: number, n: number): number {
  if (n <= 1) return 0;
  return (i - (n - 1) / 2);
}

const R = 8;

/** 둥근 꺾임: from (x,y) 수직→수평, dir=수평방향(±1) */
function cornerVH(x: number, y: number, dir: number, r: number): string {
  return `L ${x} ${y - r} Q ${x} ${y} ${x + dir * r} ${y}`;
}

/** 둥근 꺾임: from (x,y) 수평→수직, vdir=수직방향(±1) */
function cornerHV(x: number, y: number, vdir: number, r: number): string {
  const hdir = x > 0 ? -1 : 1; // 이건 사용 안 함, 아래에서 직접 제어
  return `L ${x} ${y} Q ${x} ${y} ${x} ${y + vdir * r}`;
}

export function EdgeWithLabel({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  style,
  onLabelChange,
  onDelete,
}: Props) {
  const sourceNode = useStore(selectSourceNode(source));
  const hasSelection = useStore(selectHasSelection);
  const isConnectedToSelected = useStore(selectIsConnectedToSelected(source, target));
  const out = useStore(selectOutSiblings(id, source));
  const inp = useStore(selectInSiblings(id, target));
  const [showDropdown, setShowDropdown] = useState(false);

  const eventChoices = ((sourceNode?.data as unknown as EventNodeData)?.choices?.items ?? null);
  const labelStr = label as string | undefined | null;

  // ── 경로 계산 ──

  // 1) 수평 구간 Y: source 아래, 형제별 20px 분리
  const hGap = 20;
  const midY = sourceY + 25 + out.i * hGap;

  // 2) 수직 구간 X: target 근처, 들어오는 형제별 12px 분리
  const vGap = 30;
  const vX = targetX + centerOff(inp.i, inp.n) * vGap;

  // 3) 대각선 시작 Y: target 위 60px
  const diagStart = targetY - 60;

  // 4) 경로: source → 수직 → 수평(midY) → 수직(vX) → 대각선 → target
  const r = Math.min(R, Math.abs(midY - sourceY) / 2, hGap / 2);

  const hDir = vX > sourceX ? 1 : -1; // 수평 방향
  const goingDown = targetY > midY;

  let d = `M ${sourceX} ${sourceY}`;

  // 직선 아래로 → midY에서 수평으로 꺾임
  if (Math.abs(sourceX - vX) < 1) {
    // 수직 직선 (수평 구간 불필요)
    d += ` L ${sourceX} ${Math.min(diagStart, midY)}`;
  } else {
    // 꺾임1: 수직→수평 at (sourceX, midY)
    d += ` L ${sourceX} ${midY - r}`;
    d += ` Q ${sourceX} ${midY} ${sourceX + hDir * r} ${midY}`;

    // 수평 이동 → vX
    d += ` L ${vX - hDir * r} ${midY}`;

    // 꺾임2: 수평→수직 at (vX, midY)
    const vDir = goingDown ? 1 : -1;
    d += ` Q ${vX} ${midY} ${vX} ${midY + vDir * r}`;

    // 수직 이동 → 대각선 시작점
    if (diagStart > midY + r) {
      d += ` L ${vX} ${diagStart}`;
    }
  }

  // 대각선: (vX, diagStart) → (targetX, targetY)
  d += ` L ${targetX} ${targetY}`;

  const edgePath = d;

  // 라벨 위치: 수평 구간 중앙
  const labelX = (sourceX + vX) / 2;
  const labelY = midY;

  // ── 스타일 ──
  const dimmed = hasSelection && !isConnectedToSelected;
  const highlighted = hasSelection && isConnectedToSelected;
  const strokeWidth = highlighted ? 2.5 : 1.5;
  const opacity = dimmed ? 0.15 : 1;
  const stroke = highlighted ? '#3b82f6' : (style?.stroke ?? '#6b7280');

  const edgeStyle = { ...style, stroke, strokeWidth, opacity, fill: 'none' };

  return (
    <>
      <BaseEdge path={edgePath} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto transition-opacity z-10"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            opacity,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full select-none max-w-[140px] truncate transition shadow-sm ${
                  highlighted && labelStr
                    ? 'bg-blue-100 border border-blue-400 text-blue-700 font-semibold'
                    : labelStr
                    ? 'bg-white border border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300'
                    : 'bg-white/80 border border-dashed border-gray-300 text-gray-400 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                {labelStr || '+ 선택지'}
              </button>
              {showDropdown && eventChoices && eventChoices.length > 0 && (
                <div className="absolute top-7 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                  {eventChoices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onLabelChange?.(id, choice);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 ${
                        labelStr === choice ? 'text-blue-600 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onLabelChange?.(id, '');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1 text-xs text-gray-400 hover:bg-gray-50"
                    >
                      선택 안 함
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
