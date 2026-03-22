import type { Node, Edge } from '@xyflow/react';
import type { ExportedProject, ExportedEvent } from '../types';
import type { EventNodeData } from '../hooks/useEventGraph';

export function exportProject(
  projectName: string,
  projectDescription: string | undefined,
  nodes: Node<EventNodeData>[],
  edges: Edge[]
): ExportedProject {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const events: ExportedEvent[] = nodes.map((node) => {
    const data = node.data as unknown as EventNodeData;
    const outEdges = edges.filter((e) => e.source === node.id);

    return {
      id: node.id,
      name: data.label,
      description: data.description,
      trigger: data.eventData?.trigger,
      content: data.eventData?.content,
      effects: data.eventData?.effects,
      next: outEdges.map((e) => {
        const targetNode = nodeMap.get(e.target);
        const targetData = targetNode?.data as unknown as EventNodeData | undefined;
        return {
          target: e.target,
          targetName: targetData?.label,
          condition: (e.label as string) || undefined,
        };
      }),
    };
  });

  return {
    project: {
      name: projectName,
      description: projectDescription,
      exportedAt: new Date().toISOString(),
    },
    events,
  };
}

export function downloadJson(data: ExportedProject) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.project.name.replace(/\s+/g, '_')}_events.json`;
  a.click();
  URL.revokeObjectURL(url);
}
