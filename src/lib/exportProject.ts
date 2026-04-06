import type { Node, Edge } from '@xyflow/react';
import type { ExportedProject, ExportedNode, ExportedVariable, FlowNodeData, EventNodeData, ProjectVariable } from '../types';

export function exportProject(
  projectName: string,
  projectDescription: string | undefined,
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  variables?: ProjectVariable[],
): ExportedProject {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const exportedNodes: ExportedNode[] = nodes.map((node) => {
    const data = node.data as unknown as EventNodeData;
    const outEdges = edges.filter((e) => e.source === node.id);

    return {
      id: node.id,
      displayId: data.displayId,
      nodeType: 'event' as const,
      name: data.label,
      declaration: data.declaration,
      conditions: data.conditions ?? null,
      progression: data.progression ?? null,
      choices: data.choices ?? null,
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
  });

  // 변수/배경/캐릭터
  const exportedVariables: ExportedVariable[] | undefined =
    variables && variables.length > 0
      ? variables.map((v) => ({
          category: v.category,
          key: v.key,
          value_type: v.value_type,
          default_value: v.default_value,
          file_name: v.file_name,
        }))
      : undefined;

  return {
    project: {
      name: projectName,
      description: projectDescription,
      exportedAt: new Date().toISOString(),
    },
    nodes: exportedNodes,
    variables: exportedVariables,
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
