import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, SetterNodeData } from '../types';

export interface ValidationWarning {
  nodeId?: string;
  displayId?: string;
  name?: string;
  nodeType?: string;
  type: 'orphan' | 'dead_end' | 'self_loop' | 'setter_unset';
  message: string;
}

export function validateGraph(nodes: Node[], edges: Edge[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  const sourceSet = new Set(edges.map((e) => e.source));
  const targetSet = new Set(edges.map((e) => e.target));

  for (const node of nodes) {
    const data = node.data as unknown as FlowNodeData;
    const hasIncoming = targetSet.has(node.id);
    const hasOutgoing = sourceSet.has(node.id);

    // setter는 leaf 노드이므로 dead_end 검사 제외
    if (data.nodeType === 'setter') {
      // 미설정 세터 검증
      const setterData = data as SetterNodeData;
      if (!setterData.targetDisplayId || !setterData.targetValue) {
        warnings.push({
          nodeId: node.id,
          displayId: data.displayId,
          name: data.label,
          nodeType: data.nodeType,
          type: 'setter_unset',
          message: `미설정 세터 — 대상 스위치 또는 값이 없음`,
        });
      }
      // 고아 검사는 동일 적용
      if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
        warnings.push({
          nodeId: node.id,
          displayId: data.displayId,
          name: data.label,
          nodeType: data.nodeType,
          type: 'orphan',
          message: `연결 없음 — 고아 세터`,
        });
      }
      continue;
    }

    const typeLabel = data.nodeType === 'switch' ? '스위치' : '이벤트';

    // 고아 노드: 연결이 하나도 없음
    if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        name: data.label,
        nodeType: data.nodeType,
        type: 'orphan',
        message: `연결 없음 — 고아 ${typeLabel}`,
      });
    }

    // 막다른 길: 들어오는 건 있지만 나가는 게 없음
    if (hasIncoming && !hasOutgoing) {
      warnings.push({
        nodeId: node.id,
        displayId: data.displayId,
        name: data.label,
        nodeType: data.nodeType,
        type: 'dead_end',
        message: `막다른 길 — 나가는 연결 없음`,
      });
    }
  }

  // 자기 자신으로 연결
  for (const edge of edges) {
    if (edge.source === edge.target) {
      const node = nodes.find((n) => n.id === edge.source);
      const data = node?.data as unknown as FlowNodeData | undefined;
      warnings.push({
        nodeId: edge.source,
        displayId: data?.displayId,
        name: data?.label,
        nodeType: data?.nodeType,
        type: 'self_loop',
        message: `자기 자신으로 연결됨`,
      });
    }
  }

  return warnings;
}
