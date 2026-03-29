import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { FlowNodeData } from '../../types';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; label: string; displayId: string; nodeType: string }[]>([]);
  const [open, setOpen] = useState(false);
  const { getNodes, fitView, setNodes } = useReactFlow();

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        setResults([]);
        setNodes((nds) => nds.map((n) => ({ ...n, className: '' })));
        return;
      }

      const q = value.toLowerCase();
      const nodes = getNodes();
      const matched = nodes.filter((n) => {
        const data = n.data as unknown as FlowNodeData;
        return (
          data.label?.toLowerCase().includes(q) ||
          data.displayId?.toLowerCase().includes(q) ||
          data.nodeType?.toLowerCase().includes(q)
        );
      });

      setResults(
        matched.map((n) => {
          const data = n.data as unknown as FlowNodeData;
          return { id: n.id, label: data.label, displayId: data.displayId, nodeType: data.nodeType };
        })
      );

      // 매칭 노드 하이라이트
      const matchedIds = new Set(matched.map((n) => n.id));
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          className: matchedIds.has(n.id) ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : 'opacity-30',
        }))
      );
    },
    [getNodes, setNodes]
  );

  const jumpToNode = useCallback(
    (nodeId: string) => {
      fitView({ nodes: [{ id: nodeId }], duration: 400, padding: 0.5 });
      setOpen(false);
      setQuery('');
      setResults([]);
      setNodes((nds) => nds.map((n) => ({ ...n, className: '' })));
    },
    [fitView, setNodes]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setNodes((nds) => nds.map((n) => ({ ...n, className: '' })));
  }, [setNodes]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
        title="Ctrl+F"
      >
        검색
      </button>
    );
  }

  const nodeTypeIcon = (nodeType: string) => {
    if (nodeType === 'switch') return '◇';
    return '□';
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleClose();
            if (e.key === 'Enter' && results.length > 0) jumpToNode(results[0].id);
          }}
          autoFocus
          placeholder="이름, ID..."
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-sm px-1">
          ✕
        </button>
      </div>

      {results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => jumpToNode(r.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
            >
              <span className="text-gray-400">{nodeTypeIcon(r.nodeType)}</span>
              <span className="text-[10px] font-mono text-gray-400">{r.displayId}</span>
              <span className="text-gray-700 truncate">{r.label}</span>
            </button>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-3 py-2 text-sm text-gray-400">
          결과 없음
        </div>
      )}
    </div>
  );
}
