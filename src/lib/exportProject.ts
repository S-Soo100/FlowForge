import type { Node, Edge } from '@xyflow/react';
import type { ExportedProject, ExportedNode, FlowNodeData, EventNodeData } from '../types';

export function exportProject(
  projectName: string,
  projectDescription: string | undefined,
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): ExportedProject {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const exportedNodes: ExportedNode[] = nodes.map((node) => {
    const data = node.data as unknown as FlowNodeData;
    const outEdges = edges.filter((e) => e.source === node.id);

    const base: ExportedNode = {
      id: node.id,
      displayId: data.displayId,
      nodeType: data.nodeType,
      name: data.label,
      next: outEdges.map((e) => {
        const targetNode = nodeMap.get(e.target);
        const targetData = targetNode?.data as unknown as FlowNodeData | undefined;
        return {
          target: e.target,
          targetDisplayId: targetData?.displayId,
          targetName: targetData?.label,
          label: (e.label as string) || undefined,
        };
      }),
    };

    if (data.nodeType === 'event') {
      const evData = data as EventNodeData;
      base.declaration = evData.declaration;
      base.progression = evData.progression ?? null;
      base.choices = evData.choices ?? null;
    }

    return base;
  });

  return {
    project: {
      name: projectName,
      description: projectDescription,
      exportedAt: new Date().toISOString(),
    },
    nodes: exportedNodes,
  };
}

export function downloadJson(data: ExportedProject) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.project.name.replace(/\s+/g, '_')}_nodes.json`;
  a.click();
  URL.revokeObjectURL(url);
}
