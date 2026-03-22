import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type NodeDragHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EventNode } from './EventNode';
import { EdgeWithLabel } from './EdgeWithLabel';
import type { useEventGraph } from '../../hooks/useEventGraph';

type GraphHook = ReturnType<typeof useEventGraph>;

interface Props {
  graph: GraphHook;
  onNodeDoubleClick: (nodeId: string) => void;
}

export function EventCanvas({ graph, onNodeDoubleClick }: Props) {
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

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
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

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={graph.onNodesChange}
        onEdgesChange={graph.onEdgesChange}
        onConnect={graph.onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick}
        fitView
        deleteKeyCode="Delete"
        className="bg-gray-50"
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor="#3b82f6"
          className="!bg-white !border-gray-200"
        />
      </ReactFlow>
    </div>
  );
}
