import { supabase } from './supabase';
import type { ExportedProject } from '../types';

export async function importProject(
  projectId: string,
  json: ExportedProject
): Promise<{ eventCount: number; edgeCount: number }> {
  // 기존 데이터 삭제
  await supabase.from('event_edges').delete().eq('project_id', projectId);
  await supabase.from('events').delete().eq('project_id', projectId);

  // ID 매핑 (export의 uuid → 새 uuid)
  const idMap = new Map<string, string>();

  // 이벤트 삽입
  for (let i = 0; i < json.events.length; i++) {
    const evt = json.events[i];
    const displayId = evt.displayId || `EVT-${String(i + 1).padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('events')
      .insert({
        project_id: projectId,
        name: evt.name,
        display_id: displayId,
        description: evt.description || '',
        position_x: 400,
        position_y: i * 150,
        event_data: {
          eventType: evt.type || 'other',
          content: evt.content || '',
          effects: evt.effects || [],
        },
      })
      .select('id')
      .single();

    if (error || !data) throw error;
    idMap.set(evt.id, data.id);
  }

  // 엣지 삽입
  let edgeCount = 0;
  for (const evt of json.events) {
    for (const next of evt.next) {
      const sourceId = idMap.get(evt.id);
      const targetId = idMap.get(next.target);
      if (!sourceId || !targetId) continue;

      await supabase.from('event_edges').insert({
        project_id: projectId,
        source_event_id: sourceId,
        target_event_id: targetId,
        condition_label: next.condition || '',
        sort_order: 0,
      });
      edgeCount++;
    }
  }

  return { eventCount: json.events.length, edgeCount };
}
