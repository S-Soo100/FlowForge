import { useCallback, useEffect, useState } from 'react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import type { GameEvent, GameEventEdge, EventData } from '../types';

/** React Flow 노드의 data 타입 */
export interface EventNodeData {
  label: string;
  displayId: string;    // EVT-001
  description?: string;
  eventData: EventData;
  dbId: string; // supabase row id
  [key: string]: unknown;
}

export function useEventGraph(projectId: string) {
  const [nodes, setNodes] = useState<Node<EventNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // ── DB에서 로드 ──
  const load = useCallback(async () => {
    setLoading(true);

    const [eventsRes, edgesRes] = await Promise.all([
      supabase.from('events').select('*').eq('project_id', projectId),
      supabase.from('event_edges').select('*').eq('project_id', projectId),
    ]);

    const dbEvents: GameEvent[] = eventsRes.data ?? [];
    const dbEdges: GameEventEdge[] = edgesRes.data ?? [];

    setNodes(
      dbEvents.map((ev) => ({
        id: ev.id,
        type: 'eventNode',
        position: { x: ev.position_x, y: ev.position_y },
        data: {
          label: ev.name,
          displayId: ev.display_id ?? 'EVT-???',
          description: ev.description,
          eventData: ev.event_data ?? {},
          dbId: ev.id,
        },
      }))
    );

    setEdges(
      dbEdges.map((e) => ({
        id: e.id,
        source: e.source_event_id,
        target: e.target_event_id,
        label: e.condition_label || undefined,
        type: 'edgeWithLabel',
        data: { dbId: e.id },
      }))
    );

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── React Flow 변경 핸들러 ──
  const onNodesChange: OnNodesChange<Node<EventNodeData>> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<EventNodeData>[]),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // ── 노드 위치 업데이트 (드래그 완료 후) ──
  const updateNodePosition = useCallback(
    async (nodeId: string, x: number, y: number) => {
      await supabase
        .from('events')
        .update({ position_x: x, position_y: y, updated_at: new Date().toISOString() })
        .eq('id', nodeId);
    },
    []
  );

  // ── 다음 display_id 계산 ──
  const getNextDisplayId = useCallback(async (): Promise<string> => {
    const { data } = await supabase
      .from('events')
      .select('display_id')
      .eq('project_id', projectId)
      .order('display_id', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return 'EVT-001';

    const last = (data[0] as GameEvent).display_id;
    const match = last?.match(/EVT-(\d+)/);
    const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    return `EVT-${String(nextNum).padStart(3, '0')}`;
  }, [projectId]);

  // ── 새 이벤트 추가 ──
  const addEvent = useCallback(
    async (name: string, x: number, y: number, eventType: import('../types').EventType = 'other') => {
      const displayId = await getNextDisplayId();

      const { data, error } = await supabase
        .from('events')
        .insert({
          project_id: projectId,
          name,
          display_id: displayId,
          position_x: x,
          position_y: y,
          event_data: { eventType },
        })
        .select()
        .single();

      if (error || !data) throw error;

      const ev = data as GameEvent;
      setNodes((nds) => [
        ...nds,
        {
          id: ev.id,
          type: 'eventNode',
          position: { x: ev.position_x, y: ev.position_y },
          data: {
            label: ev.name,
            displayId: ev.display_id,
            description: ev.description,
            eventData: ev.event_data ?? {},
            dbId: ev.id,
          },
        },
      ]);

      return ev;
    },
    [projectId, getNextDisplayId]
  );

  // ── 이벤트 삭제 ──
  const deleteEvent = useCallback(async (nodeId: string) => {
    await supabase.from('events').delete().eq('id', nodeId);
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
  }, []);

  // ── 이벤트 데이터 업데이트 ──
  const updateEvent = useCallback(
    async (nodeId: string, updates: { name?: string; description?: string; event_data?: EventData }) => {
      await supabase
        .from('events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', nodeId);

      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: updates.name ?? n.data.label,
                  description: updates.description ?? n.data.description,
                  eventData: updates.event_data ?? n.data.eventData,
                },
              }
            : n
        )
      );
    },
    []
  );

  // ── 엣지 연결 ──
  const onConnect: OnConnect = useCallback(
    async (params) => {
      if (!params.source || !params.target) return;

      const { data, error } = await supabase
        .from('event_edges')
        .insert({
          project_id: projectId,
          source_event_id: params.source,
          target_event_id: params.target,
          condition_label: '',
          sort_order: 0,
        })
        .select()
        .single();

      if (error || !data) return;

      const edge = data as GameEventEdge;
      setEdges((eds) => [
        ...eds,
        {
          id: edge.id,
          source: edge.source_event_id,
          target: edge.target_event_id,
          label: edge.condition_label || undefined,
          type: 'edgeWithLabel',
          data: { dbId: edge.id },
        },
      ]);
    },
    [projectId]
  );

  // ── 엣지 라벨(조건) 수정 ──
  const updateEdgeLabel = useCallback(async (edgeId: string, label: string) => {
    await supabase
      .from('event_edges')
      .update({ condition_label: label })
      .eq('id', edgeId);

    setEdges((eds) =>
      eds.map((e) => (e.id === edgeId ? { ...e, label: label || undefined } : e))
    );
  }, []);

  // ── 엣지 삭제 ──
  const deleteEdge = useCallback(async (edgeId: string) => {
    await supabase.from('event_edges').delete().eq('id', edgeId);
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, []);

  return {
    nodes,
    edges,
    loading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addEvent,
    deleteEvent,
    updateEvent,
    updateNodePosition,
    updateEdgeLabel,
    deleteEdge,
    reload: load,
  };
}
