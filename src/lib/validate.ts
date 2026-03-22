import type { Node, Edge } from '@xyflow/react';
import type { EventNodeData } from '../hooks/useEventGraph';

export interface ValidationWarning {
  nodeId?: string;
  displayId?: string;
  name?: string;
  type: 'orphan' | 'dead_end' | 'no_content' | 'self_loop';
  message: string;
}

export function validateGraph(nodes: Node[], edges: Edge[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  const sourceSet = new Set(edges.map((e) => e.source));
  const targetSet = new Set(edges.map((e) => e.target));

  for (const node of nodes) {
    const data = node.data as unknown as EventNodeData;
    const hasIncoming = targetSet.has(node.id);
    const hasOutgoing = sourceSet.has(node.id);

    // 고아 이벤트: 연결이 하나도 없음
    if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        name: data.label,
        type: 'orphan',
        message: `연결 없음 — 고아 이벤트`,
      });
    }

    // 막다른 길: 들어오는 건 있지만 나가는 게 없음 (마지막 이벤트가 아닌데)
    // 시작 이벤트(들어오는 것 없음)와 끝 이벤트(나가는 것 없음)는 1개씩은 정상
    if (hasIncoming && !hasOutgoing) {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        name: data.label,
        type: 'dead_end',
        message: `막다른 길 — 나가는 연결 없음`,
      });
    }

    // 콘텐츠 없음
    if (!data.eventData?.content) {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        name: data.label,
        type: 'no_content',
        message: `콘텐츠 비어있음`,
      });
    }
  }

  // 자기 자신으로 연결
  for (const edge of edges) {
    if (edge.source === edge.target) {
      const node = nodes.find((n) => n.id === edge.source);
      const data = node?.data as unknown as EventNodeData | undefined;
      warnings.push({
        nodeId: edge.source,
        displayId: data?.displayId,
        name: data?.label,
        type: 'self_loop',
        message: `자기 자신으로 연결됨`,
      });
    }
  }

  return warnings;
}
