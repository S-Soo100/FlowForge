import { useReactFlow } from '@xyflow/react';
import type { ValidationWarning } from '../../lib/validate';

const TYPE_ICONS: Record<ValidationWarning['type'], string> = {
  orphan: '🔴',
  dead_end: '🟡',
  self_loop: '🔴',
};

const NODE_TYPE_ICON: Record<string, string> = {
  event: '□',
  switch: '◇',
};

interface Props {
  warnings: ValidationWarning[];
  onClose: () => void;
}

export function ValidationPanel({ warnings, onClose }: Props) {
  const { fitView } = useReactFlow();

  const jumpTo = (nodeId?: string) => {
    if (!nodeId) return;
    fitView({ nodes: [{ id: nodeId }], duration: 400, padding: 0.5 });
  };

  const grouped = {
    errors: warnings.filter((w) => w.type === 'orphan' || w.type === 'self_loop'),
    warns: warnings.filter((w) => w.type === 'dead_end'),
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">
          검증 결과 ({warnings.length})
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {warnings.length === 0 ? (
        <div className="p-6 flex flex-col items-center text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-gray-500 font-medium">문제 없음!</p>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {[...grouped.errors, ...grouped.warns].map((w, i) => (
            <button
              key={i}
              onClick={() => jumpTo(w.nodeId)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-start gap-2"
            >
              <span>{TYPE_ICONS[w.type]}</span>
              <div>
                <span className="text-gray-400 mr-1">
                  {NODE_TYPE_ICON[w.nodeType ?? 'event'] ?? '□'}
                </span>
                <span className="font-mono text-[10px] text-gray-400">{w.displayId}</span>
                <span className="text-gray-600 ml-1">{w.name}</span>
                <div className="text-xs text-gray-400">{w.message}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
