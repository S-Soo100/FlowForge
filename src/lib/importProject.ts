import { supabase } from './supabase';
import type { ExportedProject } from '../types';

export async function importProject(
  projectId: string,
  json: ExportedProject
): Promise<{ nodeCount: number; edgeCount: number }> {
  // 기존 데이터 삭제
  await supabase.from('edges').delete().eq('project_id', projectId);
  await supabase.from('nodes').delete().eq('project_id', projectId);

  // ID 매핑 (export의 uuid → 새 uuid)
  const idMap = new Map<string, string>();

  // 노드 삽입
  for (let i = 0; i < json.nodes.length; i++) {
    const n = json.nodes[i];
    const prefixMap: Record<string, string> = { event: 'E', switch: 'S' };
    const prefix = prefixMap[n.nodeType ?? 'event'] ?? 'E';
    const displayId = n.displayId || `${prefix}${String(i + 1).padStart(3, '0')}`;

    const nodeData =
      n.nodeType === 'event'
        ? {
            declaration: n.declaration ?? null,
            progression: n.progression ?? null,
            choices: n.choices ?? null,
          }
        : {};

    const { data, error } = await supabase
      .from('nodes')
      .insert({
        project_id: projectId,
        node_type: n.nodeType ?? 'event',
        name: n.name,
        display_id: displayId,
        summary: '',
        detail: '',
        position_x: 400,
        position_y: i * 150,
        node_data: nodeData,
      })
      .select('id')
      .single();

    if (error || !data) throw error;
    idMap.set(n.id, data.id);
  }

  // 엣지 삽입
  let edgeCount = 0;
  for (const n of json.nodes) {
    for (const next of n.next) {
      const sourceId = idMap.get(n.id);
      const targetId = idMap.get(next.target);
      if (!sourceId || !targetId) continue;

      await supabase.from('edges').insert({
        project_id: projectId,
        source_node_id: sourceId,
        target_node_id: targetId,
        label: next.label ?? '',
        sort_order: 0,
      });
      edgeCount++;
    }
  }

  return { nodeCount: json.nodes.length, edgeCount };
}
