import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '../types';

export function getAutoLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Node[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    const data = node.data as unknown as FlowNodeData;
    // 스위치: 120x120, 이벤트: 200x100
    const width = data?.nodeType === 'switch' ? 120 : 200;
    const height = data?.nodeType === 'switch' ? 120 : 100;
    g.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  return nodes.map((node) => {
    const data = node.data as unknown as FlowNodeData;
    const pos = g.node(node.id);
    const halfW = data?.nodeType === 'switch' ? 60 : 100;
    const halfH = data?.nodeType === 'switch' ? 60 : 50;
    return {
      ...node,
      position: { x: pos.x - halfW, y: pos.y - halfH },
    };
  });
}
