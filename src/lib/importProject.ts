import { supabase } from './supabase';
import type { ExportedProject, VariableCategory, VariableValueType } from '../types';

export async function importProject(
  projectId: string,
  json: ExportedProject
): Promise<{ nodeCount: number; edgeCount: number; variableCount: number }> {
  // 기존 데이터 삭제
  await supabase.from('edges').delete().eq('project_id', projectId);
  await supabase.from('nodes').delete().eq('project_id', projectId);
  await supabase.from('project_variables').delete().eq('project_id', projectId);

  // ID 매핑 (export의 uuid → 새 uuid)
  const idMap = new Map<string, string>();

  // 노드 삽입
  for (let i = 0; i < json.nodes.length; i++) {
    const n = json.nodes[i];
    const displayId = n.displayId || `E${String(i + 1).padStart(3, '0')}`;

    const nodeData = {
      declaration: n.declaration ?? null,
      conditions: n.conditions ?? null,
      progression: n.progression ?? null,
      choices: Array.isArray(n.choices) ? { items: n.choices } : (n.choices ?? null),
    };

    const { data, error } = await supabase
      .from('nodes')
      .insert({
        project_id: projectId,
        node_type: 'event',
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

  // 변수/배경/캐릭터 삽입
  let variableCount = 0;
  if (json.variables && json.variables.length > 0) {
    for (let i = 0; i < json.variables.length; i++) {
      const v = json.variables[i];
      await supabase.from('project_variables').insert({
        project_id: projectId,
        category: v.category as VariableCategory,
        key: v.key,
        value_type: (v.value_type as VariableValueType) || null,
        default_value: v.default_value || null,
        file_name: v.file_name || null,
        sort_order: i,
      });
      variableCount++;
    }
  }

  return { nodeCount: json.nodes.length, edgeCount, variableCount };
}
