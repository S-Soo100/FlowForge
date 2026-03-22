import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EventNode } from './EventNode';
import { EdgeWithLabel } from './EdgeWithLabel';
import { NodeContextMenu } from './NodeContextMenu';
import type { useEventGraph } from '../../hooks/useEventGraph';

type GraphHook = ReturnType<typeof useEventGraph>;

interface Props {
  graph: GraphHook;
  onNodeDoubleClick: (nodeId: string) => void;
}

interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

export function EventCanvas({ graph, onNodeDoubleClick }: Props) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const nodeTypes: NodeTypes = useMemo(() => ({ eventNode: EventNode }), []);

  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      edgeWithLabel: (props) => (
        <EdgeWithLabel
          {...props}
          onLabelChange={graph.updateEdgeLabel}
          onDelete={graph.deleteEdge}
        />
      ),
    }),
    [graph.updateEdgeLabel, graph.deleteEdge]
  );

  // 모든 엣지에 화살표 기본 적용
  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(
    () => ({
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#6b7280' },
      style: { strokeWidth: 2, stroke: '#6b7280' },
    }),
    []
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      graph.updateNodePosition(node.id, node.position.x, node.position.y);
    },
    [graph.updateNodePosition]
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      onNodeDoubleClick(node.id);
    },
    [onNodeDoubleClick]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      event.preventDefault();
      setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    },
    []
  );

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={graph.onNodesChange}
        onEdgesChange={graph.onEdgesChange}
        onConnect={graph.onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handlePaneClick}
        fitView
        deleteKeyCode="Delete"
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionMode={1}
        multiSelectionKeyCode="Shift"
        className="bg-gray-50"
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor="#3b82f6"
          className="!bg-white !border-gray-200"
        />
      </ReactFlow>

      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onEdit={onNodeDoubleClick}
          onDelete={graph.deleteEvent}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
