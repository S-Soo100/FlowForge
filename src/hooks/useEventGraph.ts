import { useCallback, useEffect, useState } from 'react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import type { GameNode, GameEdge, NodeType, EventNodeData, SwitchNodeData, FlowNodeData, ProgressionBlock } from '../types';

export type { EventNodeData, SwitchNodeData, FlowNodeData };

export interface PendingEdge {
  edgeId: string;
  sourceId: string;
}

export interface PendingChoiceEdge {
  edgeId: string;
  sourceId: string;
  choices: string[];
}

export function useEventGraph(projectId: string) {
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingEdge, setPendingEdge] = useState<PendingEdge | null>(null);
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

    setNodes(
      dbNodes.map((n) => {
        let data: FlowNodeData;
        let type: string;

        if (n.node_type === 'switch') {
          data = {
            label: n.name,
            displayId: n.display_id,
            nodeType: 'switch',
            dbId: n.id,
          };
          type = 'switchNode';
        } else {
          data = {
            label: n.name,
            displayId: n.display_id,
            declaration: (n.node_data?.declaration as string) || undefined,
            progression: (n.node_data?.progression as ProgressionBlock[] | null) ?? null,
            choices: (n.node_data?.choices as string[] | null) ?? null,
            nodeType: 'event',
            dbId: n.id,
          };
          type = 'eventNode';
        }

        return {
          id: n.id,
          type,
          position: { x: n.position_x, y: n.position_y },
          data,
        };
      })
    );

    setEdges(
      dbEdges.map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        sourceHandle: e.source_handle || undefined,
        targetHandle: undefined,
        label: e.label || undefined,
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

  // ── 다음 display_id 계산 (타입별 별도 카운트) ──
  const getNextDisplayId = useCallback(
    async (nodeType: NodeType): Promise<string> => {
      const prefixMap: Record<NodeType, string> = { event: 'E', switch: 'S' };
      const prefix = prefixMap[nodeType];
      const { data } = await supabase
        .from('nodes')
        .select('display_id')
        .eq('project_id', projectId)
        .eq('node_type', nodeType)
        .order('display_id', { ascending: false })
        .limit(1);

      if (!data || data.length === 0) return `${prefix}001`;

      const last = (data[0] as GameNode).display_id;
      const match = last?.match(/[ES](\d+)/);
      const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
      return `${prefix}${String(nextNum).padStart(3, '0')}`;
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
          node_type: nodeType,
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
      let nodeData: FlowNodeData;
      let nodeFlowType: string;

      if (n.node_type === 'switch') {
        nodeData = { label: n.name, displayId: n.display_id, nodeType: 'switch', dbId: n.id };
        nodeFlowType = 'switchNode';
      } else {
        nodeData = { label: n.name, displayId: n.display_id, nodeType: 'event', dbId: n.id };
        nodeFlowType = 'eventNode';
      }

      setNodes((nds) => [
        ...nds,
        {
          id: n.id,
          type: nodeFlowType,
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

          if (n.data.nodeType === 'event' && updates.node_data) {
            const nd = updates.node_data;
            return {
              ...n,
              data: {
                ...n.data,
                label: updates.name ?? n.data.label,
                declaration: nd.declaration as string | undefined,
                progression: nd.progression as ProgressionBlock[] | null ?? null,
                choices: nd.choices as string[] | null ?? null,
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

  // ── 엣지 연결 (중복 방지 + 스위치 Yes/No 로직) ──
  const onConnect: OnConnect = useCallback(
    async (params) => {
      if (!params.source || !params.target) return;

      const duplicate = edges.find(
        (e) => e.source === params.source && e.target === params.target
      );
      if (duplicate) return;

      // 소스 노드가 스위치인지 확인
      const sourceNode = nodes.find((n) => n.id === params.source);
      const isFromSwitch = sourceNode?.type === 'switchNode';

      if (isFromSwitch) {
        // 스위치에서 나가는 기존 엣지
        const outEdges = edges.filter((e) => e.source === params.source);

        // 이미 2개 이상이면 차단
        if (outEdges.length >= 2) return;

        // 1개 이미 있으면 반대 라벨 자동 결정
        if (outEdges.length === 1) {
          const existingLabel = outEdges[0].label as string | undefined;
          const autoLabel = existingLabel === 'yes' ? 'no' : 'yes';

          const { data, error } = await supabase
            .from('edges')
            .insert({
              project_id: projectId,
              source_node_id: params.source,
              target_node_id: params.target,
              label: autoLabel,
              source_handle: params.sourceHandle || 'source-bottom',
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
              sourceHandle: edge.source_handle || 'source-bottom',
              label: autoLabel,
              type: 'edgeWithLabel',
              data: { dbId: edge.id },
            },
          ]);
          return;
        }

        // 0개 — 먼저 DB에 라벨 없이 저장하고 pendingEdge로 팝업 대기
        const { data, error } = await supabase
          .from('edges')
          .insert({
            project_id: projectId,
            source_node_id: params.source,
            target_node_id: params.target,
            label: '',
            source_handle: params.sourceHandle || 'source-bottom',
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
            sourceHandle: edge.source_handle || 'source-bottom',
            label: undefined,
            type: 'edgeWithLabel',
            data: { dbId: edge.id },
          },
        ]);
        setPendingEdge({ edgeId: edge.id, sourceId: params.source });
        return;
      }

      // 이벤트 노드에서 선택지가 있으면 → 선택 팝업 대기
      const isFromEvent = sourceNode?.type === 'eventNode';
      const eventData = isFromEvent ? (sourceNode?.data as EventNodeData | undefined) : undefined;
      const hasChoices = isFromEvent && eventData?.choices && eventData.choices.length > 0;

      const { data, error } = await supabase
        .from('edges')
        .insert({
          project_id: projectId,
          source_node_id: params.source,
          target_node_id: params.target,
          label: '',
          source_handle: params.sourceHandle || null,
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
          sourceHandle: edge.source_handle || undefined,
          label: undefined,
          type: 'edgeWithLabel',
          data: { dbId: edge.id },
        },
      ]);

      if (hasChoices) {
        setPendingChoiceEdge({
          edgeId: edge.id,
          sourceId: params.source,
          choices: eventData!.choices!,
        });
      }
    },
    [projectId, edges, nodes]
  );

  // ── pendingEdge Yes/No 확정 ──
  const confirmPendingEdge = useCallback(
    async (choice: 'yes' | 'no') => {
      if (!pendingEdge) return;
      const { edgeId } = pendingEdge;
      await supabase.from('edges').update({ label: choice }).eq('id', edgeId);
      setEdges((eds) =>
        eds.map((e) => (e.id === edgeId ? { ...e, label: choice } : e))
      );
      setPendingEdge(null);
    },
    [pendingEdge]
  );

  // ── pendingEdge 취소 (엣지 삭제) ──
  const cancelPendingEdge = useCallback(async () => {
    if (!pendingEdge) return;
    await supabase.from('edges').delete().eq('id', pendingEdge.edgeId);
    setEdges((eds) => eds.filter((e) => e.id !== pendingEdge.edgeId));
    setPendingEdge(null);
  }, [pendingEdge]);

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
  // 이벤트 노드 저장 시 choices 배열 → 나가는 엣지 라벨 순서대로 업데이트
  const syncChoicesToEdges = useCallback(
    async (sourceNodeId: string, choices: string[] | null) => {
      // 나가는 엣지 목록 (sort_order 순)
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
    pendingEdge,
    confirmPendingEdge,
    cancelPendingEdge,
    pendingChoiceEdge,
    confirmPendingChoiceEdge,
    cancelPendingChoiceEdge,
    syncChoicesToEdges,
  };
}
