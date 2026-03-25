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
    // 스위치: 120x120, 세터: 150x70, 이벤트: 200x100
    let width: number;
    let height: number;
    if (data?.nodeType === 'switch') {
      width = 120; height = 120;
    } else if (data?.nodeType === 'setter') {
      width = 150; height = 70;
    } else {
      width = 200; height = 100;
    }
    g.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  return nodes.map((node) => {
    const data = node.data as unknown as FlowNodeData;
    const pos = g.node(node.id);
    let halfW: number;
    let halfH: number;
    if (data?.nodeType === 'switch') {
      halfW = 60; halfH = 60;
    } else if (data?.nodeType === 'setter') {
      halfW = 75; halfH = 35;
    } else {
      halfW = 100; halfH = 50;
    }
    return {
      ...node,
      position: { x: pos.x - halfW, y: pos.y - halfH },
    };
  });
}
