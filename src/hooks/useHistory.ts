import { useCallback, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY = 50;

export function useHistory() {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
    past.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]): Snapshot | null => {
      if (past.current.length === 0) return null;
      const snapshot = past.current.pop()!;
      future.current.push({
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
      });
      setCanUndo(past.current.length > 0);
      setCanRedo(true);
      return snapshot;
    },
    []
  );

  const redo = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]): Snapshot | null => {
      if (future.current.length === 0) return null;
      const snapshot = future.current.pop()!;
      past.current.push({
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
      });
      setCanUndo(true);
      setCanRedo(future.current.length > 0);
      return snapshot;
    },
    []
  );

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
