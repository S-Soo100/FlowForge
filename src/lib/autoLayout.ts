import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '../types';

const elk = new ELK();

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

export async function getAutoLayout(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
): Promise<Node<FlowNodeData>[]> {
  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '100',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    },
    // 입력 순서 고정 → 결정론적 레이아웃
    children: [...nodes]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((node) => ({
        id: node.id,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      })),
    edges: [...edges]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
  };

  const laid = await elk.layout(elkGraph);

  const posMap = new Map<string, { x: number; y: number }>();
  for (const child of laid.children ?? []) {
    posMap.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }

  return nodes.map((node) => {
    const pos = posMap.get(node.id) ?? { x: 0, y: 0 };
    return { ...node, position: pos };
  });
}
