import { useCallback, useEffect, useState } from 'react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import type { GameNode, GameEdge, NodeType, EventNodeData, SwitchNodeData, SetterNodeData, FlowNodeData } from '../types';

export type { EventNodeData, SwitchNodeData, SetterNodeData, FlowNodeData };

export function useEventGraph(projectId: string) {
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

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

        if (n.node_type === 'setter') {
          data = {
            label: `${n.node_data?.target_display_id || '?'} → ${n.node_data?.value || '?'}`,
            displayId: n.display_id,
            targetDisplayId: (n.node_data?.target_display_id as string) || '',
            targetValue: (n.node_data?.value as string) || '',
            nodeType: 'setter',
            dbId: n.id,
          };
          type = 'setterNode';
        } else if (n.node_type === 'switch') {
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
            summary: n.summary,
            detail: n.detail,
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
      const prefixMap: Record<NodeType, string> = { event: 'E', switch: 'S', setter: 'A' };
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
      const match = last?.match(/[ESA](\d+)/);
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

      if (n.node_type === 'setter') {
        nodeData = { label: '? → ?', displayId: n.display_id, targetDisplayId: '', targetValue: '', nodeType: 'setter', dbId: n.id };
        nodeFlowType = 'setterNode';
      } else if (n.node_type === 'switch') {
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
    async (nodeId: string, updates: { name?: string; summary?: string; detail?: string; node_data?: Record<string, unknown> }) => {
      await supabase
        .from('nodes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', nodeId);

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;

          if (n.data.nodeType === 'setter' && updates.node_data) {
            const nd = updates.node_data;
            return {
              ...n,
              data: {
                ...n.data,
                label: `${nd.target_display_id || '?'} → ${nd.value || '?'}`,
                targetDisplayId: (nd.target_display_id as string) || '',
                targetValue: (nd.value as string) || '',
              },
            };
          }

          return {
            ...n,
            data: {
              ...n.data,
              label: updates.name ?? n.data.label,
              ...(n.data.nodeType === 'event'
                ? {
                    summary: updates.summary !== undefined ? updates.summary : (n.data as EventNodeData).summary,
                    detail: updates.detail !== undefined ? updates.detail : (n.data as EventNodeData).detail,
                  }
                : {}),
            },
          };
        })
      );
    },
    []
  );

  // ── 엣지 연결 (중복 방지) ──
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
          label: edge.label || undefined,
          type: 'edgeWithLabel',
          data: { dbId: edge.id },
        },
      ]);
    },
    [projectId, edges]
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
  };
}
