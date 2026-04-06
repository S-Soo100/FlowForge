import { useCallback, useEffect, useState } from 'react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import type { GameNode, GameEdge, NodeType, EventNodeData, FlowNodeData, ProgressionBlock, ChoicesData, ConditionGroup } from '../types';

// 하위호환 정규화: string[] (레거시) 또는 ChoicesData 모두 처리
function normalizeChoices(raw: unknown): ChoicesData | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw.length > 0 ? { items: raw as string[] } : null;
  }
  if (typeof raw === 'object' && raw !== null && 'items' in raw) {
    const data = raw as ChoicesData;
    return data.items.length > 0 || data.label ? data : null;
  }
  return null;
}

export type { EventNodeData, FlowNodeData };

export interface PendingChoiceEdge {
  edgeId: string;
  sourceId: string;
  choices: string[];
}

export function useEventGraph(projectId: string) {
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChoiceEdge, setPendingChoiceEdge] = useState<PendingChoiceEdge | null>(null);

  // ── DB에서 로드 ──
  const load = useCallback(async () => {
    setLoading(true);

    const [nodesRes, edgesRes] = await Promise.all([
      supabase.from('nodes').select('*').eq('project_id', projectId),
      supabase.from('edges').select('*').eq('project_id', projectId),
    ]);

    const dbNodes: GameNode[] = nodesRes.data ?? [];
    const dbEdges: GameEdge[] = edgesRes.data ?? [];

    const flowNodes = dbNodes.map((n) => {
      const data: FlowNodeData = {
        label: n.name,
        displayId: n.display_id,
        declaration: (n.node_data?.declaration as string) || undefined,
        conditions: (n.node_data?.conditions as ConditionGroup | null) ?? null,
        progression: (n.node_data?.progression as ProgressionBlock[] | null) ?? null,
        choices: normalizeChoices(n.node_data?.choices),
        nodeType: 'event',
        dbId: n.id,
      };

      return {
        id: n.id,
        type: 'eventNode',
        position: { x: n.position_x, y: n.position_y },
        data,
      };
    });

    const flowEdges: Edge[] = dbEdges.map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      label: e.label || undefined,
      type: 'edgeWithLabel',
      data: { dbId: e.id },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── React Flow 변경 핸들러 ──
  const onNodesChange: OnNodesChange<Node<FlowNodeData>> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<FlowNodeData>[]),
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
        .from('nodes')
        .update({ position_x: x, position_y: y, updated_at: new Date().toISOString() })
        .eq('id', nodeId);
    },
    []
  );

  // ── 다음 display_id 계산 ──
  const getNextDisplayId = useCallback(
    async (_nodeType: NodeType): Promise<string> => {
      const { data } = await supabase
        .from('nodes')
        .select('display_id')
        .eq('project_id', projectId)
        .eq('node_type', 'event')
        .order('display_id', { ascending: false })
        .limit(1);

      if (!data || data.length === 0) return 'E001';

      const last = (data[0] as GameNode).display_id;
      const match = last?.match(/[ES](\d+)/);
      const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
      return `E${String(nextNum).padStart(3, '0')}`;
    },
    [projectId]
  );

  // ── 새 노드 추가 ──
  const addNode = useCallback(
    async (name: string, nodeType: NodeType, x: number, y: number) => {
      const displayId = await getNextDisplayId(nodeType);

      const { data, error } = await supabase
        .from('nodes')
        .insert({
          project_id: projectId,
          node_type: 'event',
          name,
          display_id: displayId,
          position_x: x,
          position_y: y,
          node_data: {},
        })
        .select()
        .single();

      if (error || !data) throw error;

      const n = data as GameNode;
      const nodeData: FlowNodeData = {
        label: n.name,
        displayId: n.display_id,
        nodeType: 'event',
        dbId: n.id,
      };

      setNodes((nds) => [
        ...nds,
        {
          id: n.id,
          type: 'eventNode',
          position: { x: n.position_x, y: n.position_y },
          data: nodeData,
        },
      ]);

      return n;
    },
    [projectId, getNextDisplayId]
  );

  // ── 노드 삭제 ──
  const deleteNode = useCallback(async (nodeId: string) => {
    await supabase.from('nodes').delete().eq('id', nodeId);
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
  }, []);

  // ── 노드 데이터 업데이트 ──
  const updateNode = useCallback(
    async (nodeId: string, updates: { name?: string; node_data?: Record<string, unknown> }) => {
      await supabase
        .from('nodes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', nodeId);

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;

          if (updates.node_data) {
            const nd = updates.node_data;
            return {
              ...n,
              data: {
                ...n.data,
                label: updates.name ?? n.data.label,
                declaration: nd.declaration as string | undefined,
                conditions: (nd.conditions as ConditionGroup | null) ?? null,
                progression: nd.progression as ProgressionBlock[] | null ?? null,
                choices: normalizeChoices(nd.choices),
              },
            };
          }

          return {
            ...n,
            data: {
              ...n.data,
              label: updates.name ?? n.data.label,
            },
          };
        })
      );
    },
    []
  );

  // ── 엣지 연결 (중복 방지 + 선택지 팝업) ──
  const onConnect: OnConnect = useCallback(
    async (params) => {
      if (!params.source || !params.target) return;

      const duplicate = edges.find(
        (e) => e.source === params.source && e.target === params.target
      );
      if (duplicate) return;

      const { data, error } = await supabase
        .from('edges')
        .insert({
          project_id: projectId,
          source_node_id: params.source,
          target_node_id: params.target,
          label: '',
          sort_order: 0,
        })
        .select()
        .single();

      if (error || !data) return;

      const edge = data as GameEdge;
      setEdges((eds) => [
        ...eds,
        {
          id: edge.id,
          source: edge.source_node_id,
          target: edge.target_node_id,
          label: undefined,
          type: 'edgeWithLabel',
          data: { dbId: edge.id },
        },
      ]);

      // 소스 노드에 선택지가 있으면 → 선택 팝업 대기
      const sourceNode = nodes.find((n) => n.id === params.source);
      const eventData = sourceNode?.data as EventNodeData | undefined;
      const hasChoices = eventData?.choices && eventData.choices.items.length > 0;

      if (hasChoices) {
        setPendingChoiceEdge({
          edgeId: edge.id,
          sourceId: params.source,
          choices: eventData!.choices!.items,
        });
      }
    },
    [projectId, edges, nodes]
  );

  // ── pendingChoiceEdge 선택지 확정 ──
  const confirmPendingChoiceEdge = useCallback(
    async (choice: string | null) => {
      if (!pendingChoiceEdge) return;
      const { edgeId } = pendingChoiceEdge;
      const label = choice || '';
      await supabase.from('edges').update({ label }).eq('id', edgeId);
      setEdges((eds) =>
        eds.map((e) => (e.id === edgeId ? { ...e, label: label || undefined } : e))
      );
      setPendingChoiceEdge(null);
    },
    [pendingChoiceEdge]
  );

  // ── pendingChoiceEdge 취소 (선택 안 함으로 확정) ──
  const cancelPendingChoiceEdge = useCallback(async () => {
    setPendingChoiceEdge(null);
  }, []);

  // ── 선택지 → 나가는 엣지 라벨 자동 동기화 ──
  const syncChoicesToEdges = useCallback(
    async (sourceNodeId: string, choices: string[] | null) => {
      const outEdges = edges
        .filter((e) => e.source === sourceNodeId)
        .sort((a, b) => {
          const aOrder = (a.data as { sort_order?: number } | undefined)?.sort_order ?? 0;
          const bOrder = (b.data as { sort_order?: number } | undefined)?.sort_order ?? 0;
          return aOrder - bOrder;
        });

      const updates = outEdges.map((edge, idx) => {
        const newLabel = choices && idx < choices.length ? choices[idx] : '';
        return { edgeId: edge.id, label: newLabel };
      });

      await Promise.all(
        updates.map(({ edgeId, label }) =>
          supabase.from('edges').update({ label }).eq('id', edgeId)
        )
      );

      setEdges((eds) =>
        eds.map((e) => {
          const update = updates.find((u) => u.edgeId === e.id);
          if (!update) return e;
          return { ...e, label: update.label || undefined };
        })
      );
    },
    [edges]
  );

  // ── 엣지 라벨 수정 ──
  const updateEdgeLabel = useCallback(async (edgeId: string, label: string) => {
    await supabase
      .from('edges')
      .update({ label })
      .eq('id', edgeId);

    setEdges((eds) =>
      eds.map((e) => (e.id === edgeId ? { ...e, label: label || undefined } : e))
    );
  }, []);

  // ── 엣지 삭제 ──
  const deleteEdge = useCallback(async (edgeId: string) => {
    await supabase.from('edges').delete().eq('id', edgeId);
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, []);

  // ── 자동 정렬 결과 일괄 적용 (노드 위치만) ──
  const applyAutoLayout = useCallback(
    async (layoutNodes: Node<FlowNodeData>[]) => {
      // 노드 위치 state 업데이트
      const posMap = new Map(layoutNodes.map((n) => [n.id, n.position]));
      setNodes((nds) =>
        nds.map((n) => {
          const pos = posMap.get(n.id);
          return pos ? { ...n, position: pos } : n;
        })
      );

      // DB에 노드 위치 저장
      await Promise.all(
        layoutNodes.map((n) =>
          supabase
            .from('nodes')
            .update({ position_x: n.position.x, position_y: n.position.y, updated_at: new Date().toISOString() })
            .eq('id', n.id)
        )
      );
    },
    []
  );

  return {
    nodes,
    edges,
    loading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    updateNode,
    updateNodePosition,
    updateEdgeLabel,
    deleteEdge,
    reload: load,
    pendingChoiceEdge,
    confirmPendingChoiceEdge,
    cancelPendingChoiceEdge,
    syncChoicesToEdges,
    applyAutoLayout,
  };
}
